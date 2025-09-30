import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import type { InterviewQuestion } from './graph';

// Simple factory to avoid constructing model when no key.
export function makeChatModel() {
  if (!process.env.GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.CRISP_GEMINI_MODEL || 'gemini-1.5-flash',
    temperature: 0.4,
  });
}

// QUESTION GENERATION
const questionPrompt = new PromptTemplate({
  template: `Generate ONE concise technical interview question for a {role} candidate. Difficulty: {difficulty}. Index: {index}. Return only the question.`,
  inputVariables: ['role','difficulty','index']
});

export async function lcGenerateQuestion(params: { role: string; difficulty: string; index: number }) {
  if (!process.env.GEMINI_API_KEY) {
    return { question: 'Fallback: Explain event loop vs call stack in JS.', source: 'mock' as const };
  }
  const model = makeChatModel();
  const chain = questionPrompt.pipe(model);
  const res = await chain.invoke(params);
  const txt = typeof res === 'string' ? res : (res as { content?: { toString?: () => string } | Array<{ text?: string }> | string }).content?.toString?.() || (res as { content?: Array<{ text?: string }> }).content?.[0]?.text || '';
  return { question: txt.trim().split('\n')[0].slice(0, 300), source: 'llm' as const };
}

// ANSWER EVALUATION
const evalSchema = z.object({
  score: z.number().int().min(0).max(5),
  feedback: z.string().max(300)
});
const evalParser = StructuredOutputParser.fromZodSchema(evalSchema);
const evalPrompt = new PromptTemplate({
  template: `Evaluate the candidate's answer. Return JSON with keys score (0-5 int) and feedback.\nQuestion: {question}\nAnswer: {answer}\nFormat: {format}`,
  inputVariables: ['question','answer'],
  partialVariables: { format: evalParser.getFormatInstructions() }
});

export async function lcEvaluateAnswer(params: { question: string; answer: string }) {
  if (!process.env.GEMINI_API_KEY) {
    return heuristicScore(params.question, params.answer);
  }
  const model = makeChatModel();
  try {
    const promptValue = await evalPrompt.format({ ...params, format: evalParser.getFormatInstructions() });
    const res = await model.invoke(promptValue);
    const content = (res as { content?: Array<{ text?: string }> | string }).content;
    const txt = Array.isArray(content) ? content[0]?.text || '' : (typeof content === 'string' ? content : '');
    const cleaned = txt.replace(/^```json/i,'').replace(/```$/,'').trim();
    let parsed: { score?: string | number; feedback?: string };
    try { parsed = JSON.parse(cleaned); } catch { return heuristicScore(params.question, params.answer); }
    const scoreValue = typeof parsed.score === 'string' ? parseInt(parsed.score, 10) : (typeof parsed.score === 'number' ? parsed.score : 0);
    const score = Math.min(5, Math.max(0, scoreValue || 0));
    return { score, feedback: parsed.feedback || 'LLM scored.' };
  } catch {
    return heuristicScore(params.question, params.answer);
  }
}

// SUMMARY
const summaryPrompt = new PromptTemplate({
  template: `Summarize interview performance (<=4 sentences). Overall: {finalScore}%. Data lines:\n{condensed}`,
  inputVariables: ['finalScore','condensed']
});

export async function lcSummarize(params: { questions: InterviewQuestion[]; finalScore: number }) {
  if (!process.env.GEMINI_API_KEY) {
    const summary = `Candidate demonstrated ${params.finalScore >= 70 ? 'strong' : 'developing'} proficiency (heuristic).`;
    return { finalScore: params.finalScore, summary, source: 'heuristic' as const };
  }
  const answered = params.questions.filter(q => q.answer);
  const condensed = answered.map((q: InterviewQuestion) => `Q${q.index+1}(${q.difficulty}) s:${q.score ?? '-'} ${(q.answer||'').slice(0,80)}`).join('\n');
  const model = makeChatModel();
  const chain = summaryPrompt.pipe(model);
  const res = await chain.invoke({ finalScore: params.finalScore, condensed });
  const content = typeof res === 'string' ? res : (res as { content?: Array<{ text?: string }> | string }).content;
  const txt = typeof content === 'string' ? content : (Array.isArray(content) ? content[0]?.text || '' : '');
  return { finalScore: params.finalScore, summary: txt.trim().slice(0, 900), source: 'llm' as const };
}

// Heuristic reused
function heuristicScore(question: string, answer: string) {
  if (!answer) return { score: 0, feedback: 'No answer provided.' };
  let score = 1;
  if (answer.length > 40) score += 1;
  if (answer.length > 120) score += 1;
  const lowered = answer.toLowerCase();
  const keywords = ['performance','scalable','complexity','async','react','node'];
  score += keywords.filter(k => lowered.includes(k)).length > 2 ? 1 : 0;
  if (score > 5) score = 5;
  return { score, feedback: 'Heuristic preliminary score (fallback).' };
}

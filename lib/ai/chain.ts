import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import type { InterviewQuestion } from './graph';

// Debug logging helper
function debugLog(message: string, data?: any) {
  console.log(`[AI Debug] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Simple factory to avoid constructing model when no key.
export function makeChatModel() {
  debugLog('Creating ChatModel with API key present:', !!process.env.GEMINI_API_KEY);
  debugLog('Using model:', process.env.CRISP_GEMINI_MODEL || 'gemini-1.5-flash');
  
  if (!process.env.GEMINI_API_KEY) {
    debugLog('ERROR: Missing GEMINI_API_KEY');
    throw new Error('Missing GEMINI_API_KEY');
  }
  
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.CRISP_GEMINI_MODEL || 'gemini-2.5-flash',
    temperature: 0.4,
  });
}

// QUESTION GENERATION
const questionPrompt = new PromptTemplate({
  template: `Generate ONE concise technical interview question for a {role} candidate focusing on {topic}.
  
Difficulty: {difficulty}. Question Index: {index}.

{resumeContext}

Requirements:
- Tailor the question based on the candidate's background if resume information is provided
- Focus on {topic} technologies and concepts
- Make it appropriate for {difficulty} difficulty level
- Return only the question, no explanations

Question:`,
  inputVariables: ['role', 'difficulty', 'index', 'topic', 'resumeContext']
});

export async function lcGenerateQuestion(params: { 
  role: string; 
  difficulty: string; 
  index: number;
  topic?: string;
  resumeData?: Record<string, unknown>;
}) {
  debugLog('lcGenerateQuestion called with params:', params);
  
  if (!process.env.GEMINI_API_KEY) {
    debugLog('No API key found, returning fallback question');
    return { question: 'Fallback: Explain event loop vs call stack in JS.', source: 'mock' as const };
  }

  try {
    // Prepare resume context
    let resumeContext = '';
    if (params.resumeData) {
      const data = params.resumeData;
      const name = data.name as string;
      const skills = Array.isArray(data.skills) ? data.skills as string[] : [];
      const experience = Array.isArray(data.experience) ? data.experience as string[] : [];
      const education = Array.isArray(data.education) ? data.education as string[] : [];
      const summary = data.summary as string;
      
      resumeContext = `Candidate Background:
${name ? `Name: ${name}` : ''}
${skills.length ? `Skills: ${skills.join(', ')}` : ''}
${experience.length ? `Experience: ${experience.slice(0, 3).join('; ')}` : ''}
${education.length ? `Education: ${education.slice(0, 2).join('; ')}` : ''}
${summary ? `Summary: ${summary}` : ''}

Tailor the question to leverage their background and skills.`;
    }

    const model = makeChatModel();
    const chain = questionPrompt.pipe(model);
    const invokeParams = {
      role: params.role,
      difficulty: params.difficulty,
      index: params.index,
      topic: params.topic || 'general technical',
      resumeContext: resumeContext || 'No resume information provided. Generate a general question.'
    };
    
    debugLog('Invoking LLM with params:', invokeParams);
    const res = await chain.invoke(invokeParams);
    debugLog('LLM response received:', res);
    
    const txt = typeof res === 'string' ? res : (res as { content?: { toString?: () => string } | Array<{ text?: string }> | string }).content?.toString?.() || (res as { content?: Array<{ text?: string }> }).content?.[0]?.text || '';
    const question = txt.trim().split('\n')[0].slice(0, 300);
    debugLog('Processed question:', question);
    
    return { question, source: 'llm' as const };
  } catch (error: unknown) {
    debugLog('ERROR in lcGenerateQuestion:', error);
    return { question: 'Fallback: Explain event loop vs call stack in JS.', source: 'mock' as const };
  }
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
  debugLog('lcEvaluateAnswer called with params:', params);
  
  if (!process.env.GEMINI_API_KEY) {
    debugLog('No API key found, using heuristic scoring');
    return heuristicScore(params.question, params.answer);
  }
  
  try {
    const model = makeChatModel();
    const promptValue = await evalPrompt.format({ ...params, format: evalParser.getFormatInstructions() });
    debugLog('Evaluation prompt formatted:', promptValue);
    
    const res = await model.invoke(promptValue);
    debugLog('Evaluation response received:', res);
    
    const content = (res as { content?: Array<{ text?: string }> | string }).content;
    const txt = Array.isArray(content) ? content[0]?.text || '' : (typeof content === 'string' ? content : '');
    const cleaned = txt.replace(/^```json/i,'').replace(/```$/,'').trim();
    
    let parsed: { score?: string | number; feedback?: string };
    try { 
      parsed = JSON.parse(cleaned);
      debugLog('Parsed evaluation result:', parsed);
    } catch (parseError) { 
      debugLog('JSON parse error:', parseError);
      return heuristicScore(params.question, params.answer); 
    }
    
    const scoreValue = typeof parsed.score === 'string' ? parseInt(parsed.score, 10) : (typeof parsed.score === 'number' ? parsed.score : 0);
    const score = Math.min(5, Math.max(0, scoreValue || 0));
    return { score, feedback: parsed.feedback || 'LLM scored.' };
  } catch (error: unknown) {
    debugLog('ERROR in lcEvaluateAnswer:', error);
    return heuristicScore(params.question, params.answer);
  }
}

// SUMMARY
const summaryPrompt = new PromptTemplate({
  template: `Summarize interview performance (<=4 sentences). Overall: {finalScore}%. Data lines:\n{condensed}`,
  inputVariables: ['finalScore','condensed']
});

export async function lcSummarize(params: { questions: InterviewQuestion[]; finalScore: number }) {
  debugLog('lcSummarize called with params:', params);
  
  if (!process.env.GEMINI_API_KEY) {
    debugLog('No API key found, using heuristic summary');
    const summary = `Candidate demonstrated ${params.finalScore >= 70 ? 'strong' : 'developing'} proficiency (heuristic).`;
    return { finalScore: params.finalScore, summary, source: 'heuristic' as const };
  }
  
  try {
    const answered = params.questions.filter(q => q.answer);
    const condensed = answered.map((q: InterviewQuestion) => `Q${q.index+1}(${q.difficulty}) s:${q.score ?? '-'} ${(q.answer||'').slice(0,80)}`).join('\n');
    debugLog('Summary condensed data:', condensed);
    
    const model = makeChatModel();
    const chain = summaryPrompt.pipe(model);
    const res = await chain.invoke({ finalScore: params.finalScore, condensed });
    debugLog('Summary response received:', res);
    
    const content = typeof res === 'string' ? res : (res as { content?: Array<{ text?: string }> | string }).content;
    const txt = typeof content === 'string' ? content : (Array.isArray(content) ? content[0]?.text || '' : '');
    const summary = txt.trim().slice(0, 900);
    debugLog('Processed summary:', summary);
    
    return { finalScore: params.finalScore, summary, source: 'llm' as const };
  } catch (error: unknown) {
    debugLog('ERROR in lcSummarize:', error);
    const summary = `Candidate demonstrated ${params.finalScore >= 70 ? 'strong' : 'developing'} proficiency (fallback).`;
    return { finalScore: params.finalScore, summary, source: 'heuristic' as const };
  }
}

// Heuristic reused
function heuristicScore(question: string, answer: string) {
  debugLog('Using heuristic scoring for:', { question: question?.substring(0, 50), answer: answer?.substring(0, 50) });
  
  if (!answer) return { score: 0, feedback: 'No answer provided.' };
  
  let score = 1;
  if (answer.length > 40) score += 1;
  if (answer.length > 120) score += 1;
  
  const lowered = answer.toLowerCase();
  const keywords = ['performance','scalable','complexity','async','react','node'];
  score += keywords.filter(k => lowered.includes(k)).length > 2 ? 1 : 0;
  
  if (score > 5) score = 5;
  
  const result = { score, feedback: 'Heuristic preliminary score (fallback).' };
  debugLog('Heuristic score result:', result);
  
  return result;
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import type { InterviewQuestion } from './graph';

// Debug logging helper
function debugLog(message: string, data?: any) {
  console.log(`[AI Debug] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper to read API key from multiple env names
function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

// Simple factory to create Google Generative AI model
export function makeChatModel() {
  const apiKey = getGeminiApiKey();
  const modelName = process.env.CRISP_GEMINI_MODEL || 'gemini-1.5-flash';
  debugLog('Creating GenerativeModel with API key present:', !!apiKey);
  debugLog('Using model:', modelName);
  
  if (!apiKey) {
    debugLog('ERROR: Missing Gemini API Key (GEMINI_API_KEY or GOOGLE_API_KEY)');
    throw new Error('Missing Gemini API Key');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.4 } });
  return model;
}

// QUESTION GENERATION

export async function lcGenerateQuestion(params: { 
  role: string; 
  difficulty: string; 
  index: number;
  topic?: string;
  resumeData?: Record<string, unknown>;
}) {
  debugLog('lcGenerateQuestion called with params:', params);
  
  if (!getGeminiApiKey()) {
    debugLog('No API key found, returning fallback question');
    return { question: 'Fallback: Explain event loop vs call stack in JS.', source: 'mock' as const, error: 'Missing Gemini API Key (GEMINI_API_KEY or GOOGLE_API_KEY)' } as const;
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
    const prompt = `Generate ONE concise technical interview question for a ${params.role} candidate focusing on ${params.topic || 'general technical'}.

Difficulty: ${params.difficulty}. Question Index: ${params.index}.

${resumeContext || 'No resume information provided. Generate a general question.'}

Requirements:
- Tailor the question based on the candidate's background if resume information is provided
- Focus on ${params.topic || 'general technical'} technologies and concepts
- Make it appropriate for ${params.difficulty} difficulty level (easy(estimated ansering time 15 seconds), medium(estimated ansering time 30 seconds), hard(estimated ansering time 60 seconds))
- Return only the question, no explanations

Question:`;

    debugLog('Invoking LLM with prompt:', prompt);
    // Retry with exponential backoff on transient errors (e.g., 503)
    const maxAttempts = 3;
    let attempt = 0;
    let txt = '';
    let lastError: unknown = undefined;
    while (attempt < maxAttempts) {
      try {
        const res = await model.generateContent(prompt);
        txt = res.response?.text() || '';
        break;
      } catch (err: unknown) {
        lastError = err;
        const status = (err as any)?.status;
        const isTransient = status === 429 || status === 500 || status === 503 || status === 504;
        attempt += 1;
        if (!isTransient || attempt >= maxAttempts) {
          throw err;
        }
        const delayMs = 500 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    const question = txt.trim().split('\n')[0].slice(0, 300);
    debugLog('Processed question:', question);
    
    return { question, source: 'llm' as const };
  } catch (error: unknown) {
    debugLog('ERROR in lcGenerateQuestion:', error);
    // Propagate error so API can return non-200
    throw error;
  }
}

// ANSWER EVALUATION
const evalSchema = z.object({
  score: z.number().int().min(0).max(5),
  feedback: z.string().max(300)
});

export async function lcEvaluateAnswer(params: { question: string; answer: string }) {
  debugLog('lcEvaluateAnswer called with params:', params);
  
  if (!getGeminiApiKey()) {
    debugLog('No API key found, using heuristic scoring');
    return heuristicScore(params.question, params.answer);
  }
  
  try {
    const model = makeChatModel();
    const prompt = `Evaluate the candidate's answer. Return JSON with keys score (0-5 int) and feedback.\nQuestion: ${params.question}\nAnswer: ${params.answer}\nFormat: {"score": 0-5, "feedback": "<=300 chars"}`;
    debugLog('Evaluation prompt:', prompt);

    const res = await model.generateContent(prompt);
    const txt = res.response?.text() || '';
    const cleaned = txt.replace(/^```json/i,'').replace(/```$/,'').trim();
    
    let parsed: { score?: string | number; feedback?: string };
    try { 
      parsed = JSON.parse(cleaned);
      debugLog('Parsed evaluation result:', parsed);
    } catch (parseError) { 
      debugLog('JSON parse error:', parseError);
      return heuristicScore(params.question, params.answer); 
    }
    
    const scoreValue = typeof parsed.score === 'string' ? parseInt(parsed.score as string, 10) : (typeof parsed.score === 'number' ? parsed.score : 0);
    const score = Math.min(5, Math.max(0, scoreValue || 0));
    return { score, feedback: parsed.feedback || 'LLM scored.' };
  } catch (error: unknown) {
    debugLog('ERROR in lcEvaluateAnswer:', error);
    return heuristicScore(params.question, params.answer);
  }
}

// SUMMARY
// SUMMARY PROMPT BUILDER

export async function lcSummarize(params: { questions: InterviewQuestion[]; finalScore: number }) {
  debugLog('lcSummarize called with params:', params);
  
  if (!getGeminiApiKey()) {
    debugLog('No API key found, using heuristic summary');
    const summary = `Candidate demonstrated ${params.finalScore >= 70 ? 'strong' : 'developing'} proficiency (heuristic).`;
    return { finalScore: params.finalScore, summary, source: 'heuristic' as const };
  }
  
  try {
    const answered = params.questions.filter(q => q.answer);
    const condensed = answered.map((q: InterviewQuestion) => `Q${q.index+1}(${q.difficulty}) s:${q.score ?? '-'} ${(q.answer||'').slice(0,80)}`).join('\n');
    debugLog('Summary condensed data:', condensed);

    const model = makeChatModel();
    const prompt = `Summarize interview performance (<=4 sentences). Overall: ${params.finalScore}%. Data lines:\n${condensed}`;
    // Simple retry similar to question generation
    const maxAttempts = 3;
    let attempt = 0;
    let txt = '';
    while (attempt < maxAttempts) {
      try {
        const res = await model.generateContent(prompt);
        txt = res.response?.text() || '';
        break;
      } catch (err: unknown) {
        const status = (err as any)?.status;
        const isTransient = status === 429 || status === 500 || status === 503 || status === 504;
        attempt += 1;
        if (!isTransient || attempt >= maxAttempts) {
          throw err;
        }
        const delayMs = 500 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    const summary = txt.trim().slice(0, 900);
    debugLog('Processed summary:', summary);
    
    return { finalScore: params.finalScore, summary, source: 'llm' as const };
  } catch (error: unknown) {
    debugLog('ERROR in lcSummarize:', error);
    // Propagate so API can fail instead of silently succeeding
    throw error;
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

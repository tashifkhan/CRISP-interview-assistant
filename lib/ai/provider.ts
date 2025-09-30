import { lcGenerateQuestion, lcEvaluateAnswer, lcSummarize } from './chain';

// Shared types (lightweight to avoid circular deps)
export interface GenerateQuestionArgs { 
  index: number; 
  difficulty: string; 
  role: string; 
  topic?: string;
  resumeData?: Record<string, unknown>;
}
export interface EvaluateAnswerArgs { question: string; answer: string; }
export interface SummarizeArgs { questions: Array<{ index: number; difficulty: string; question?: string; answer?: string; score?: number; }>; finalScore: number; role?: string; }

// Debug logging helper
function debugLog(message: string, data?: any) {
  console.log(`[Provider Debug] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function hasGemini() {
  const hasKey = !!getGeminiApiKey();
  debugLog('Checking Gemini API key availability:', hasKey);
  return hasKey;
}
debugLog('AI Engine preference removed; using direct SDK calls only.');

// --- Mock / heuristic helpers ---
const mockBank: Record<string, string[]> = {
  easy: [
    'Explain the difference between var, let, and const in JavaScript.',
    'What is JSX and why is it used in React?'
  ],
  medium: [
    'Describe how the event loop works in Node.js.',
    'How would you optimize bundle size in a React/Next.js application?'
  ],
  hard: [
    'Design a scalable architecture for a real-time collaborative editor (high-level).',
    'Explain how you would implement server-side rendering with streaming and suspense in Next.js for a large app.'
  ],
};

function mockQuestion(index: number, difficulty: string) {
  const list = mockBank[difficulty] || [];
  return list[index % list.length] || 'Describe a challenging full stack problem you solved recently.';
}

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

// --- Gemini-backed implementations ---
export async function generateQuestion(args: GenerateQuestionArgs) {
  debugLog('generateQuestion called with args:', args);
  
  const fallback = (source: 'mock' | 'fallback' = 'mock', error?: string) => {
    const result = {
      question: mockQuestion(args.index, args.difficulty),
      source,
      ...(error ? { error } : {}),
    };
    debugLog('Returning fallback result:', result);
    return result;
  };
  
  if (!hasGemini()) {
    const error = 'Missing Gemini API Key (GEMINI_API_KEY or GOOGLE_API_KEY)';
    debugLog('No Gemini API key, using mock', error);
    return fallback('mock', error);
  }
  
  try {
    const res = await lcGenerateQuestion({ 
      role: args.role, 
      difficulty: args.difficulty, 
      index: args.index,
      topic: args.topic,
      resumeData: args.resumeData
    });
    return res
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : undefined;
    return fallback('fallback', message);
  }
}

export async function evaluateAnswer(args: EvaluateAnswerArgs) {
  debugLog('evaluateAnswer called with args:', args);
  
  if (!hasGemini()) {
    debugLog('No Gemini API key, using heuristic scoring');
    return heuristicScore(args.question, args.answer);
  }
  
  try {
    return await lcEvaluateAnswer({ question: args.question, answer: args.answer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : undefined;
    return { ...heuristicScore(args.question, args.answer), ...(message ? { error: message } : {}), source: 'fallback' };
  }
}

export async function summarizeInterview(args: SummarizeArgs) {
  debugLog('summarizeInterview called with args:', args);
  
  const answered = args.questions.filter((q) => q.answer);
  const totalScore = answered.reduce((acc: number, q) => acc + (q.score || 0), 0);
  const maxScore = args.questions.length * 5;
  const finalScore = args.finalScore ?? Math.round((totalScore / maxScore) * 100);
  
  debugLog('Summary calculations:', { answered: answered.length, totalScore, maxScore, finalScore });
  
  if (!hasGemini()) {
    debugLog('No Gemini API key, using heuristic summary');
    const summary = `Candidate demonstrated ${finalScore >= 70 ? 'strong' : 'developing'} proficiency across full stack concepts. (Heuristic summary)`;
    return { finalScore, summary, source: 'heuristic' as const };
  }
  
  try {
    return await lcSummarize({ questions: args.questions, finalScore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : undefined;
    const summary = `Candidate demonstrated ${finalScore >= 70 ? 'strong' : 'developing'} proficiency. (Fallback summary)`;
    return { finalScore, summary, source: 'fallback' as const, ...(message ? { error: message } : {}) };
  }
}

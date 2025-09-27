import { GoogleGenerativeAI } from '@google/generative-ai';

// Shared types (lightweight to avoid circular deps)
export interface GenerateQuestionArgs { index: number; difficulty: string; role: string; }
export interface EvaluateAnswerArgs { question: string; answer: string; }
export interface SummarizeArgs { questions: any[]; finalScore: number; }

function hasGemini() {
  return !!process.env.GEMINI_API_KEY;
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.CRISP_GEMINI_MODEL || 'gemini-1.5-flash';
  return genAI.getGenerativeModel({ model: modelName });
}

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

// Utility to parse JSON that may be wrapped in code fences.
function tryParseJson(raw: string) {
  const cleaned = raw.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch { return null; }
}

// --- Gemini-backed implementations ---
export async function generateQuestion(args: GenerateQuestionArgs) {
  if (!hasGemini()) return { question: mockQuestion(args.index, args.difficulty), source: 'mock' as const };
  try {
    const model = getModel();
    const prompt = `Generate ONE concise ${args.difficulty} interview question for a ${args.role} candidate. Index ${args.index}. No numbering or extra text.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().split('\n')[0];
    return { question: text.slice(0, 300), source: 'llm' as const };
  } catch (e: any) {
    return { question: mockQuestion(args.index, args.difficulty), source: 'fallback' as const, error: e.message };
  }
}

export async function evaluateAnswer(args: EvaluateAnswerArgs) {
  if (!hasGemini()) return heuristicScore(args.question, args.answer);
  try {
    const model = getModel();
    const prompt = `You evaluate interview answers. Return JSON with keys score (0-5 integer) and feedback (short helpful phrase).\nQuestion: ${args.question}\nAnswer: ${args.answer}`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = tryParseJson(raw) || tryParseJson(raw.replace(/```[a-z]*\n/gi,''));
    if (parsed) {
      const score = Math.min(5, Math.max(0, parseInt(parsed.score, 10) || 0));
      return { score, feedback: parsed.feedback || 'LLM scored.' };
    }
    return heuristicScore(args.question, args.answer);
  } catch (e: any) {
    return { ...heuristicScore(args.question, args.answer), error: e.message, source: 'fallback' };
  }
}

export async function summarizeInterview(args: SummarizeArgs) {
  const answered = args.questions.filter(q => q.answer);
  const totalScore = answered.reduce((acc: number, q: any) => acc + (q.score || 0), 0);
  const maxScore = args.questions.length * 5;
  const finalScore = args.finalScore ?? Math.round((totalScore / maxScore) * 100);
  if (!hasGemini()) {
    const summary = `Candidate demonstrated ${finalScore >= 70 ? 'strong' : 'developing'} proficiency across full stack concepts. (Heuristic summary)`;
    return { finalScore, summary, source: 'heuristic' as const };
  }
  try {
    const model = getModel();
    const condensed = answered.map((q: any) => `Q${q.index + 1} (${q.difficulty}) score:${q.score ?? '-'} ans:${(q.answer||'').slice(0,140)}`).join('\n');
    const prompt = `Summarize this interview performance in <=4 sentences. Avoid restating questions exactly. Overall percent: ${finalScore}. Data:\n${condensed}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return { finalScore, summary: text.slice(0, 900), source: 'llm' as const };
  } catch (e: any) {
    const summary = `Candidate demonstrated ${finalScore >= 70 ? 'strong' : 'developing'} proficiency. (Fallback summary)`;
    return { finalScore, summary, source: 'fallback' as const, error: e.message };
  }
}

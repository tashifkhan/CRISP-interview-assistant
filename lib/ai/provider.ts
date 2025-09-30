import { lcGenerateQuestion, lcEvaluateAnswer, lcSummarize } from './chain';
import { buildInterviewGraph, runGraphStep, type GraphState, type InterviewQuestion } from './graph';

// Shared types (lightweight to avoid circular deps)
export interface GenerateQuestionArgs { 
  index: number; 
  difficulty: string; 
  role: string; 
  topic?: string;
  resumeData?: Record<string, unknown>;
}
export interface EvaluateAnswerArgs { question: string; answer: string; }
export interface SummarizeArgs { questions: InterviewQuestion[]; finalScore: number; role?: string; }

function hasGemini() {
  return !!process.env.GEMINI_API_KEY;
}
const preferGraph = process.env.AI_ENGINE === 'graph';

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
  const fallback = (source: 'mock' | 'fallback' = 'mock', error?: string) => ({
    question: mockQuestion(args.index, args.difficulty),
    source,
    ...(error ? { error } : {}),
  });
  if (!hasGemini()) return fallback('mock');
  try {
    if (preferGraph) {
      const graph = buildInterviewGraph();
      const state: GraphState = {
        role: args.role,
        topic: args.topic,
        resumeData: args.resumeData,
        questions: [
          {
            index: args.index,
            difficulty: args.difficulty,
            question: '',
            answer: undefined,
            score: undefined,
          }
        ],
        currentIndex: 0,
        finalScore: undefined,
        summary: undefined,
      };
      const next = await runGraphStep(graph, state, { runEvaluate: false, runSummary: false });
      const generated = next.questions?.[0]?.question;
      if (generated) {
        return { question: generated.slice(0, 300), source: 'llm' as const };
      }
    }
    return await lcGenerateQuestion({ 
      role: args.role, 
      difficulty: args.difficulty, 
      index: args.index,
      topic: args.topic,
      resumeData: args.resumeData
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : undefined;
    return fallback('fallback', message);
  }
}

export async function evaluateAnswer(args: EvaluateAnswerArgs) {
  if (!hasGemini()) return heuristicScore(args.question, args.answer);
  try {
    if (preferGraph) {
      const graph = buildInterviewGraph();
      const state: GraphState = {
        role: 'unspecified',
        questions: [
          {
            index: 0,
            difficulty: 'medium',
            question: args.question,
            answer: args.answer,
          }
        ],
        currentIndex: 0,
        finalScore: undefined,
        summary: undefined,
      };
      const next = await runGraphStep(graph, state, { runGenerate: false, runSummary: false });
      const scored = next.questions?.[0];
      if (typeof scored?.score === 'number') {
        return { score: scored.score, feedback: scored.feedback || 'LLM scored via graph.' };
      }
    }
    return await lcEvaluateAnswer({ question: args.question, answer: args.answer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : undefined;
    return { ...heuristicScore(args.question, args.answer), ...(message ? { error: message } : {}), source: 'fallback' };
  }
}

export async function summarizeInterview(args: SummarizeArgs) {
  const answered = args.questions.filter((q) => q.answer);
  const totalScore = answered.reduce((acc: number, q) => acc + (q.score || 0), 0);
  const maxScore = args.questions.length * 5;
  const finalScore = args.finalScore ?? Math.round((totalScore / maxScore) * 100);
  if (!hasGemini()) {
    const summary = `Candidate demonstrated ${finalScore >= 70 ? 'strong' : 'developing'} proficiency across full stack concepts. (Heuristic summary)`;
    return { finalScore, summary, source: 'heuristic' as const };
  }
  try {
    if (preferGraph) {
      const graph = buildInterviewGraph();
      const state: GraphState = {
        role: args.role || 'General candidate',
        questions: args.questions.map((q) => ({ ...q })),
        currentIndex: Math.max(0, (args.questions.length || 1) - 1),
        finalScore,
        summary: undefined,
      };
      const next = await runGraphStep(graph, state, { runGenerate: false, runEvaluate: false, runSummary: true });
      if (next.summary) {
        return { finalScore: next.finalScore ?? finalScore, summary: next.summary, source: 'llm' as const };
      }
    }
    return await lcSummarize({ questions: args.questions, finalScore });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : undefined;
    const summary = `Candidate demonstrated ${finalScore >= 70 ? 'strong' : 'developing'} proficiency. (Fallback summary)`;
    return { finalScore, summary, source: 'fallback' as const, ...(message ? { error: message } : {}) };
  }
}

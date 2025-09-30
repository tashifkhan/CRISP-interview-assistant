// Simplified version without StateGraph for build compatibility
import { lcGenerateQuestion, lcEvaluateAnswer, lcSummarize } from './chain';

export type InterviewQuestion = {
  index: number;
  difficulty: string;
  question?: string;
  answer?: string;
  score?: number;
  feedback?: string;
  [key: string]: unknown;
};

export type GraphState = {
  role: string;
  questions: InterviewQuestion[];
  currentIndex: number;
  finalScore?: number;
  summary?: string;
};

// Node: generate question if missing
export const nodeGenerate = async (state: GraphState): Promise<GraphState> => {
  const q = state.questions[state.currentIndex];
  if (!q.question) {
    const res = await lcGenerateQuestion({ role: state.role, difficulty: q.difficulty, index: q.index });
    q.question = res.question;
  }
  return { ...state };
};

// Node: evaluate existing answer
export const nodeEvaluate = async (state: GraphState): Promise<GraphState> => {
  const q = state.questions[state.currentIndex];
  if (q.answer && q.score == null && q.question) {
    const res = await lcEvaluateAnswer({ question: q.question, answer: q.answer });
    q.score = res.score;
    q.feedback = res.feedback;
  }
  return { ...state };
};

// Node: summary once all scored
export const nodeSummary = async (state: GraphState): Promise<GraphState> => {
  if (state.currentIndex === state.questions.length - 1) {
    const total = state.questions.reduce((acc, q) => acc + (q.score || 0), 0);
    const max = state.questions.length * 5;
    const finalScore = Math.round((total / max) * 100);
    const res = await lcSummarize({ questions: state.questions, finalScore });
    state.finalScore = res.finalScore;
    state.summary = res.summary;
  }
  return { ...state };
};

// Simplified workflow without StateGraph
export function buildInterviewGraph() {
  return {
    async invoke(state: GraphState) {
      return state;
    }
  };
}

type RunOptions = {
  runGenerate?: boolean;
  runEvaluate?: boolean;
  runSummary?: boolean;
};

export async function runGraphStep(graph: ReturnType<typeof buildInterviewGraph>, state: GraphState, options: RunOptions = {}) {
  const { runGenerate = true, runEvaluate = true, runSummary = true } = options;
  let next = { ...state };
  if (runGenerate) next = await nodeGenerate(next);
  if (runEvaluate) next = await nodeEvaluate(next);
  if (runSummary) next = await nodeSummary(next);
  return next;
}

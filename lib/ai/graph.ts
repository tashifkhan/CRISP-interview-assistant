import { StateGraph } from '@langchain/langgraph';
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
const nodeGenerate = async (state: GraphState): Promise<GraphState> => {
  const q = state.questions[state.currentIndex];
  if (!q.question) {
    const res = await lcGenerateQuestion({ role: state.role, difficulty: q.difficulty, index: q.index });
    q.question = res.question;
  }
  return { ...state };
};

// Node: evaluate existing answer
const nodeEvaluate = async (state: GraphState): Promise<GraphState> => {
  const q = state.questions[state.currentIndex];
  if (q.answer && q.score == null) {
    const res = await lcEvaluateAnswer({ question: q.question, answer: q.answer });
    q.score = res.score;
    q.feedback = res.feedback;
  }
  return { ...state };
};

// Node: summary once all scored
const nodeSummary = async (state: GraphState): Promise<GraphState> => {
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

export function buildInterviewGraph() {
  const builder = new StateGraph<GraphState>({
    channels: {
      role: '' as string,
      questions: [] as InterviewQuestion[],
      currentIndex: 0,
      finalScore: undefined as number | undefined,
      summary: undefined as string | undefined,
    }
  });
  builder.addNode('generate', nodeGenerate);
  builder.addNode('evaluate', nodeEvaluate);
  builder.addNode('summary', nodeSummary);
  // For simplicity we won't create edges; we'll invoke nodes manually.
  return builder.compile();
}

type RunOptions = {
  runGenerate?: boolean;
  runEvaluate?: boolean;
  runSummary?: boolean;
};

export async function runGraphStep(graph: ReturnType<typeof buildInterviewGraph>, state: GraphState, options: RunOptions = {}) {
  const { runGenerate = true, runEvaluate = true, runSummary = true } = options;
  let next = await graph.invoke(state); // start (unused in manual pattern)
  if (runGenerate) next = await nodeGenerate(next);
  if (runEvaluate) next = await nodeEvaluate(next);
  if (runSummary) next = await nodeSummary(next);
  return next as GraphState;
}

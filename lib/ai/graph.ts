import { StateGraph } from '@langchain/langgraph';
import { lcGenerateQuestion, lcEvaluateAnswer, lcSummarize } from './chain';

export type GraphState = {
  role: string;
  questions: any[];
  currentIndex: number;
  finalScore?: number;
  summary?: string;
};

// Node: generate question if missing
const nodeGenerate = async (state: GraphState) => {
  const q = state.questions[state.currentIndex];
  if (!q.question) {
    const res = await lcGenerateQuestion({ role: state.role, difficulty: q.difficulty, index: q.index });
    q.question = res.question;
  }
  return { ...state };
};

// Node: evaluate existing answer
const nodeEvaluate = async (state: GraphState) => {
  const q = state.questions[state.currentIndex];
  if (q.answer && q.score == null) {
    const res = await lcEvaluateAnswer({ question: q.question, answer: q.answer });
    q.score = res.score;
  }
  return { ...state };
};

// Node: summary once all scored
const nodeSummary = async (state: GraphState) => {
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
      role: null as any,
      questions: null as any,
      currentIndex: null as any,
      finalScore: null as any,
      summary: null as any,
    }
  });
  builder.addNode('generate', nodeGenerate as any);
  builder.addNode('evaluate', nodeEvaluate as any);
  builder.addNode('summary', nodeSummary as any);
  // For simplicity we won't create edges; we'll invoke nodes manually.
  return builder.compile();
}

export async function runGraphStep(graph: any, state: GraphState) {
  let next = await graph.invoke(state); // start (unused in manual pattern)
  next = await (nodeGenerate as any)(next);
  next = await (nodeEvaluate as any)(next);
  next = await (nodeSummary as any)(next);
  return next as GraphState;
}

// Simplified version without StateGraph for build compatibility
import { lcGenerateQuestion, lcEvaluateAnswer, lcSummarize } from './chain';

// Debug logging helper
function debugLog(message: string, data?: any) {
  console.log(`[Graph Debug] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

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
  topic?: string;
  resumeData?: Record<string, unknown>;
};

// Node: generate question if missing
export const nodeGenerate = async (state: GraphState): Promise<GraphState> => {
  debugLog('nodeGenerate called for index:', state.currentIndex);
  const q = state.questions[state.currentIndex];
  
  if (!q) {
    debugLog('ERROR: No question found at current index');
    return state;
  }
  
  if (!q.question) {
    debugLog('Generating question for:', { index: q.index, difficulty: q.difficulty, role: state.role });
    try {
      const res = await lcGenerateQuestion({ 
        role: state.role, 
        difficulty: q.difficulty, 
        index: q.index,
        topic: state.topic,
        resumeData: state.resumeData
      });
      q.question = res.question;
      debugLog('Question generated successfully:', res.question);
    } catch (error) {
      debugLog('ERROR generating question:', error);
      q.question = `Fallback question for ${q.difficulty} difficulty`;
    }
  } else {
    debugLog('Question already exists, skipping generation');
  }
  return { ...state };
};

// Node: evaluate existing answer
export const nodeEvaluate = async (state: GraphState): Promise<GraphState> => {
  debugLog('nodeEvaluate called for index:', state.currentIndex);
  const q = state.questions[state.currentIndex];
  
  if (!q) {
    debugLog('ERROR: No question found at current index');
    return state;
  }
  
  if (q.answer && q.score == null && q.question) {
    debugLog('Evaluating answer:', { question: q.question?.substring(0, 50), answer: q.answer?.substring(0, 50) });
    try {
      const res = await lcEvaluateAnswer({ question: q.question, answer: q.answer });
      q.score = res.score;
      q.feedback = res.feedback;
      debugLog('Answer evaluated successfully:', { score: res.score, feedback: res.feedback });
    } catch (error) {
      debugLog('ERROR evaluating answer:', error);
      q.score = 0;
      q.feedback = 'Error occurred during evaluation';
    }
  } else {
    debugLog('Skipping evaluation:', { hasAnswer: !!q.answer, hasScore: q.score != null, hasQuestion: !!q.question });
  }
  return { ...state };
};

// Node: summary once all scored
export const nodeSummary = async (state: GraphState): Promise<GraphState> => {
  debugLog('nodeSummary called, checking if should summarize');
  
  // Always allow summary generation, not just on last question
  const total = state.questions.reduce((acc, q) => acc + (q.score || 0), 0);
  const max = state.questions.length * 5;
  const finalScore = Math.round((total / max) * 100);
  
  debugLog('Summary calculation:', { total, max, finalScore, questionsCount: state.questions.length });
  
  try {
    const res = await lcSummarize({ questions: state.questions, finalScore });
    state.finalScore = res.finalScore;
    state.summary = res.summary;
    debugLog('Summary generated successfully:', { finalScore: res.finalScore, summary: res.summary });
  } catch (error) {
    debugLog('ERROR generating summary:', error);
    state.finalScore = finalScore;
    state.summary = `Fallback summary: Score ${finalScore}%`;
  }
  
  return { ...state };
};

// Simplified workflow without StateGraph
export function buildInterviewGraph() {
  debugLog('Building interview graph');
  return {
    async invoke(state: GraphState) {
      debugLog('Graph invoke called with state:', state);
      return await runGraphStep(this, state);
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
  debugLog('runGraphStep called with options:', options);
  debugLog('Initial state:', state);
  
  let next = { ...state };
  
  if (runGenerate) {
    debugLog('Running generate step');
    next = await nodeGenerate(next);
  }
  
  if (runEvaluate) {
    debugLog('Running evaluate step');
    next = await nodeEvaluate(next);
  }
  
  if (runSummary) {
    debugLog('Running summary step');
    next = await nodeSummary(next);
  }
  
  debugLog('Final state after graph execution:', next);
  return next;
}

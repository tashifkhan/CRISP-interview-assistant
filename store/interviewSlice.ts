import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuestionRecord {
  id: string;
  index: number; // 0..5
  difficulty: Difficulty;
  question: string;
  answer?: string;
  score?: number;
  startedAt?: number; // epoch ms
  submittedAt?: number; // epoch ms
  allottedMs: number;
  remainingMs?: number; // persisted remaining time (updated every ~1s)
}

export interface CandidateProfile {
  name?: string;
  email?: string;
  phone?: string;
  resumeExtracted?: boolean;
}

export interface InterviewState {
  sessionId?: string;
  role: string;
  topic?: string;
  resumeData?: any;
  status: 'idle' | 'collecting-profile' | 'generating-questions' | 'in-progress' | 'completed';
  currentQuestionIndex: number; // -1 before start
  questions: QuestionRecord[];
  profile: CandidateProfile;
  finalScore?: number;
  summary?: string;
  createdAt?: number;
  completedAt?: number;
  questionsGenerating?: boolean;
  questionsGenerated?: boolean;
}

const initialState: InterviewState = {
  role: 'Full Stack Developer',
  topic: 'fullstack',
  status: 'idle',
  currentQuestionIndex: -1,
  questions: [],
  profile: {},
  questionsGenerating: false,
  questionsGenerated: false,
};

const difficultySchedule: Difficulty[] = ['easy','easy','medium','medium','hard','hard'];
const difficultyTimers: Record<Difficulty, number> = { easy: 20000, medium: 60000, hard: 120000 };

export const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startProfileCollection(state) {
      if (!state.sessionId) state.sessionId = nanoid();
      state.status = 'collecting-profile';
      state.createdAt = Date.now();
    },
    setProfileField(state, action: PayloadAction<{ key: keyof CandidateProfile; value: string }>) {
      (state.profile as any)[action.payload.key] = action.payload.value;
    },
    markResumeExtracted(state) {
      state.profile.resumeExtracted = true;
    },
    setTopic(state, action: PayloadAction<string>) {
      state.topic = action.payload;
    },
    setResumeData(state, action: PayloadAction<any>) {
      state.resumeData = action.payload;
    },
    beginInterview(state) {
      if (state.questions.length === 0) {
        state.questions = difficultySchedule.map((d, idx) => ({
          id: nanoid(),
          index: idx,
          difficulty: d,
          question: '',
          allottedMs: difficultyTimers[d],
          remainingMs: difficultyTimers[d],
        }));
      }
      state.status = 'generating-questions';
      state.questionsGenerating = true;
      state.questionsGenerated = false;
      state.currentQuestionIndex = -1; // Don't start timer yet
    },
    startActualInterview(state) {
      state.status = 'in-progress';
      state.currentQuestionIndex = 0;
      state.questions[0].startedAt = Date.now();
      state.questionsGenerating = false;
      state.questionsGenerated = true;
    },
    setAllQuestionsGenerated(state) {
      state.questionsGenerated = true;
      state.questionsGenerating = false;
    },
    setQuestionText(state, action: PayloadAction<{ index: number; text: string }>) {
      const q = state.questions[action.payload.index];
      if (q) q.question = action.payload.text;
    },
    recordAnswer(state, action: PayloadAction<{ index: number; answer: string }>) {
      const q = state.questions[action.payload.index];
      if (q) q.answer = action.payload.answer;
    },
    recordScore(state, action: PayloadAction<{ index: number; score: number }>) {
      const q = state.questions[action.payload.index];
      if (q) q.score = action.payload.score;
    },
    advanceQuestion(state) {
      const idx = state.currentQuestionIndex;
      if (idx >= 0 && idx < state.questions.length) {
        const q = state.questions[idx];
        if (!q.submittedAt) q.submittedAt = Date.now();
      }
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
        const nq = state.questions[state.currentQuestionIndex];
        nq.startedAt = Date.now();
        if (nq.remainingMs == null) nq.remainingMs = nq.allottedMs;
      } else {
        state.status = 'completed';
        state.completedAt = Date.now();
      }
    },
    tickTimer(state) {
      if (state.status !== 'in-progress') return;
      const idx = state.currentQuestionIndex;
      if (idx < 0) return;
      const q = state.questions[idx];
      if (!q.startedAt) return;
      const elapsed = Date.now() - q.startedAt;
      const remaining = q.allottedMs - elapsed;
      q.remainingMs = remaining > 0 ? remaining : 0;
    },
    setFinalSummary(state, action: PayloadAction<{ summary: string; finalScore: number }>) {
      state.summary = action.payload.summary;
      state.finalScore = action.payload.finalScore;
    },
    resetInterview() {
      return initialState;
    }
  }
});

export const {
  startProfileCollection,
  setProfileField,
  markResumeExtracted,
  setTopic,
  setResumeData,
  beginInterview,
  startActualInterview,
  setAllQuestionsGenerated,
  setQuestionText,
  recordAnswer,
  recordScore,
  advanceQuestion,
  tickTimer,
  setFinalSummary,
  resetInterview
} = interviewSlice.actions;

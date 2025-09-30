// Simplified version without StateGraph for build compatibility
// Removed graph utilities. Kept file to avoid import breakages; export minimal shared types if needed.
export type InterviewQuestion = {
  index: number;
  difficulty: string;
  question?: string;
  answer?: string;
  score?: number;
  feedback?: string;
  [key: string]: unknown;
};

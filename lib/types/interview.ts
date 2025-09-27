import { z } from 'zod';

export const QuestionSchema = z.object({
  id: z.string(),
  index: z.number(),
  difficulty: z.enum(['easy','medium','hard']),
  question: z.string(),
  answer: z.string().optional(),
  score: z.number().optional(),
  allottedMs: z.number(),
  startedAt: z.number().optional(),
  submittedAt: z.number().optional(),
});

export const CandidateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  resumeExtracted: z.boolean().optional(),
});

export const CompletedInterviewSchema = z.object({
  sessionId: z.string(),
  role: z.string(),
  profile: CandidateProfileSchema,
  questions: z.array(QuestionSchema),
  finalScore: z.number(),
  summary: z.string(),
  createdAt: z.number(),
  completedAt: z.number(),
  version: z.literal(1),
});

export type CompletedInterview = z.infer<typeof CompletedInterviewSchema>;

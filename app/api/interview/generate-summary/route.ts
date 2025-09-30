export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { summarizeInterview } from '@/lib/ai/provider';
import { InterviewQuestion } from '@/lib/ai/graph';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { questions } = body as { questions: InterviewQuestion[] };
  const totalScore = questions.reduce((acc, q) => acc + (q.score || 0), 0); // may be 0 if not yet scored
  const maxScore = questions.length * 5;
  const finalScore = Math.round((totalScore / maxScore) * 100);
  const result = await summarizeInterview({ questions, finalScore });
  return NextResponse.json(result);
}

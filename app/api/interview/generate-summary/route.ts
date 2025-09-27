import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { questions } = body as { questions: any[] };
  const answered = questions.filter(q => q.answer);
  const totalScore = answered.reduce((acc, q) => acc + (q.score || 0), 0);
  const maxScore = questions.length * 5; // mock scale
  const finalScore = Math.round((totalScore / maxScore) * 100);
  const summary = `Candidate demonstrated ${finalScore >= 70 ? 'strong' : 'developing'} proficiency across full stack concepts. (Mock summary)`;
  return NextResponse.json({ finalScore, summary });
}

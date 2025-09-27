import { NextRequest, NextResponse } from 'next/server';

// TEMP mock scoring: basic heuristic (length-based + keyword presence)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { question, answer } = body as { question: string; answer: string };
  if (!answer) return NextResponse.json({ score: 0, feedback: 'No answer provided.' });
  let score = 1;
  if (answer.length > 40) score += 1;
  if (answer.length > 120) score += 1;
  const lowered = answer.toLowerCase();
  const keywords = ['performance','scalable','complexity','async','react','node'];
  score += keywords.filter(k => lowered.includes(k)).length > 2 ? 1 : 0;
  if (score > 5) score = 5;
  return NextResponse.json({ score, feedback: 'Preliminary heuristic score (mock). Final scoring will be AI-driven.' });
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { evaluateAnswer } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { question, answer } = body as { question: string; answer: string };
  const result = await evaluateAnswer({ question, answer });
  return NextResponse.json(result);
}

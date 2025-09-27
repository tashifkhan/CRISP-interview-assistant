import { NextRequest, NextResponse } from 'next/server';
import { generateQuestion } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { index, difficulty, role } = body as { index: number; difficulty: string; role: string };
  const result = await generateQuestion({ index, difficulty, role });
  return NextResponse.json(result);
}

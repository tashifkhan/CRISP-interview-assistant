export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generateQuestion } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { index, difficulty, role, topic, resumeData } = body as { 
      index: number; 
      difficulty: string; 
      role: string;
      topic?: string;
      resumeData?: Record<string, unknown>;
    };
    const result = await generateQuestion({ index, difficulty, role, topic, resumeData });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate question';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

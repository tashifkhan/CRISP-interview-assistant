import { NextRequest, NextResponse } from 'next/server';
import { generateQuestion } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { index, difficulty, role, topic, resumeData } = body as { 
    index: number; 
    difficulty: string; 
    role: string;
    topic?: string;
    resumeData?: any;
  };
  const result = await generateQuestion({ index, difficulty, role, topic, resumeData });
  return NextResponse.json(result);
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generateQuestion } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questions, role, topic, resumeData } = body as { 
      questions: Array<{ index: number; difficulty: string; id: string; }>;
      role: string;
      topic?: string;
      resumeData?: Record<string, unknown>;
    };

    // Generate all questions in parallel for better performance
    const promises = questions.map(async (q) => {
      try {
        const result = await generateQuestion({ 
          index: q.index, 
          difficulty: q.difficulty, 
          role, 
          topic, 
          resumeData 
        });
        return {
          id: q.id,
          index: q.index,
          question: result.question,
          source: result.source,
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to generate';
        return { id: q.id, index: q.index, error: message };
      }
    });

    const results = await Promise.all(promises);

    const hadErrors = results.some((r: any) => r.error);
    return NextResponse.json({ questions: results, success: !hadErrors }, { status: hadErrors ? 207 : 200 });
  } catch (error) {
    console.error('Failed to generate questions:', error);
    return NextResponse.json({ 
      error: 'Failed to generate questions',
      success: false 
    }, { status: 500 });
  }
}
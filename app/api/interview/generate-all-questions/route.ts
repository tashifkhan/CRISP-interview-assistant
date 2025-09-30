import { NextRequest, NextResponse } from 'next/server';
import { generateQuestion } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { questions, role, topic, resumeData } = body as { 
    questions: Array<{ index: number; difficulty: string; id: string; }>;
    role: string;
    topic?: string;
    resumeData?: Record<string, unknown>;
  };

  try {
    // Generate all questions in parallel for better performance
    const promises = questions.map(async (q) => {
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
      };
    });

    const results = await Promise.all(promises);
    
    return NextResponse.json({ 
      questions: results,
      success: true 
    });
  } catch (error) {
    console.error('Failed to generate questions:', error);
    return NextResponse.json({ 
      error: 'Failed to generate questions',
      success: false 
    }, { status: 500 });
  }
}
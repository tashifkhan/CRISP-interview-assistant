import { NextRequest, NextResponse } from 'next/server';

// TEMP mock - will integrate LangChain in later phase
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { index, difficulty, role } = body as { index: number; difficulty: string; role: string };
  const mockQuestionBank: Record<string, string[]> = {
    easy: [
      'Explain the difference between var, let, and const in JavaScript.',
      'What is JSX and why is it used in React?',
    ],
    medium: [
      'Describe how the event loop works in Node.js.',
      'How would you optimize bundle size in a React/Next.js application?',
    ],
    hard: [
      'Design a scalable architecture for a real-time collaborative editor (high-level).',
      'Explain how you would implement server-side rendering with streaming and suspense in Next.js for a large app.',
    ],
  };
  const list = mockQuestionBank[difficulty] || [];
  const q = list[index % list.length] || 'Describe a challenging full stack problem you solved recently.';
  return NextResponse.json({ question: q });
}

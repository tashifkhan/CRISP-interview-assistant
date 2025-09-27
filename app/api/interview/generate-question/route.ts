import { NextRequest, NextResponse } from 'next/server';

async function mockQuestion(index: number, difficulty: string) {
  const bank: Record<string, string[]> = {
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
  const list = bank[difficulty] || [];
  return list[index % list.length] || 'Describe a challenging full stack problem you solved recently.';
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { index, difficulty, role } = body as { index: number; difficulty: string; role: string };
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    const q = await mockQuestion(index, difficulty);
    return NextResponse.json({ question: q, source: 'mock' });
  }
  try {
    // Lazy import langchain to avoid cold start weight if unused
    // Minimal generic OpenAI REST call (fallback approach) to avoid dependency shape issues
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.CRISP_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You generate concise, technical interview questions.' },
          { role: 'user', content: `Role: ${role}. Difficulty: ${difficulty}. Provide ONE question only (no preamble, no numbering). Index: ${index}.` }
        ],
        temperature: 0.7,
        max_tokens: 120
      })
    });
    if (!completion.ok) throw new Error(`LLM HTTP ${completion.status}`);
    const json = await completion.json();
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty LLM response');
    return NextResponse.json({ question: content, source: 'llm' });
  } catch (e: any) {
    const q = await mockQuestion(index, difficulty);
    return NextResponse.json({ question: q, source: 'fallback', error: e.message });
  }
}

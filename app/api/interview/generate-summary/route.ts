import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { questions } = body as { questions: any[] };
  const answered = questions.filter(q => q.answer);
  const totalScore = answered.reduce((acc, q) => acc + (q.score || 0), 0);
  const maxScore = questions.length * 5;
  const finalScore = Math.round((totalScore / maxScore) * 100);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const summary = `Candidate demonstrated ${finalScore >= 70 ? 'strong' : 'developing'} proficiency across full stack concepts. (Heuristic summary)`;
    return NextResponse.json({ finalScore, summary, source: 'heuristic' });
  }
  try {
    const condensed = answered.map(q => `Q${q.index + 1} (${q.difficulty}) score:${q.score ?? '-'} ans:${(q.answer||'').slice(0,140)}`).join('\n');
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.CRISP_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You summarize interview performance briefly (<=4 sentences). Avoid restating the questions.' },
          { role: 'user', content: `Provide a concise performance summary for a full stack interview. Overall percent: ${finalScore}. Data:\n${condensed}` }
        ],
        temperature: 0.4,
        max_tokens: 180
      })
    });
    if (!completion.ok) throw new Error(`LLM HTTP ${completion.status}`);
    const json = await completion.json();
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty summary');
    return NextResponse.json({ finalScore, summary: content, source: 'llm' });
  } catch (e: any) {
    const summary = `Candidate demonstrated ${finalScore >= 70 ? 'strong' : 'developing'} proficiency. (Fallback summary)`;
    return NextResponse.json({ finalScore, summary, source: 'fallback', error: e.message });
  }
}

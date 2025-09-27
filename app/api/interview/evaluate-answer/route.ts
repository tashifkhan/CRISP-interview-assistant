import { NextRequest, NextResponse } from 'next/server';

function heuristic(question: string, answer: string) {
  if (!answer) return { score: 0, feedback: 'No answer provided.' };
  let score = 1;
  if (answer.length > 40) score += 1;
  if (answer.length > 120) score += 1;
  const lowered = answer.toLowerCase();
  const keywords = ['performance','scalable','complexity','async','react','node'];
  score += keywords.filter(k => lowered.includes(k)).length > 2 ? 1 : 0;
  if (score > 5) score = 5;
  return { score, feedback: 'Heuristic preliminary score (fallback).' };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { question, answer } = body as { question: string; answer: string };
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(heuristic(question, answer));
  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.CRISP_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You evaluate interview answers. Return a JSON object with keys score (0-5 integer) and feedback (short string).' },
          { role: 'user', content: `Question: ${question}\nAnswer: ${answer}\nProvide JSON only.` }
        ],
        temperature: 0.2,
        max_tokens: 180
      })
    });
    if (!completion.ok) throw new Error(`LLM HTTP ${completion.status}`);
    const json = await completion.json();
    const raw = json.choices?.[0]?.message?.content;
    if (typeof raw !== 'string') throw new Error('Empty response');
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { return NextResponse.json(heuristic(question, answer)); }
    const score = Math.min(5, Math.max(0, parseInt(parsed.score, 10) || 0));
    return NextResponse.json({ score, feedback: parsed.feedback || 'LLM scored.' });
  } catch (e: any) {
    return NextResponse.json({ ...heuristic(question, answer), error: e.message, source: 'fallback' });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { CompletedInterviewSchema } from '@/lib/types/interview';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const parsed = CompletedInterviewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.format() }, { status: 400 });
  }
  try {
    const db = await getDb();
    await db.collection('interviews').insertOne(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

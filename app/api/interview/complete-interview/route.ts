export const runtime = 'nodejs';

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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

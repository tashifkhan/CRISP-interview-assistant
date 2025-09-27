import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';

export async function GET() {
  try {
    const db = await getDb();
    const docs = await db.collection('interviews')
      .find({}, { projection: { summary: 1, finalScore: 1, 'profile.name': 1, 'profile.email':1, sessionId:1 } })
      .sort({ finalScore: -1 })
      .limit(200)
      .toArray();
    return NextResponse.json({ candidates: docs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

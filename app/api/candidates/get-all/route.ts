import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const sortParam = searchParams.get('sort') || '-score';
    const filter: Record<string, unknown> = {};
    if (q) {
      filter.$or = [
        { 'profile.name': { $regex: q, $options: 'i' } },
        { 'profile.email': { $regex: q, $options: 'i' } },
      ];
    }
    let sort: Record<string, 1 | -1> = {};
    switch (sortParam) {
      case 'score':
        sort = { finalScore: 1 };
        break;
      case '-created':
        sort = { createdAt: -1 };
        break;
      case 'created':
        sort = { createdAt: 1 };
        break;
      case '-score':
      default:
        sort = { finalScore: -1 };
    }
    const db = await getDb();
    const docs = await db.collection('interviews')
      .find(filter, { projection: { summary: 1, finalScore: 1, 'profile.name': 1, 'profile.email':1, sessionId:1, createdAt:1 } })
      .sort(sort)
      .limit(200)
      .toArray();
    return NextResponse.json({ candidates: docs });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

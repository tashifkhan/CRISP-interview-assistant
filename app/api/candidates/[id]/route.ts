import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    // id could be sessionId (string) or ObjectId
    const bySession = await db.collection('interviews').findOne({ sessionId: id });
    if (bySession) return NextResponse.json({ interview: bySession });
    if (ObjectId.isValid(id)) {
      const byObjectId = await db.collection('interviews').findOne({ _id: new ObjectId(id) });
      if (byObjectId) return NextResponse.json({ interview: byObjectId });
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

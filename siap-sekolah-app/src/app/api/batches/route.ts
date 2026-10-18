export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { getDB, batches as batchesTable, students as studentsTable } from '@/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { Batch } from '@/types';

export async function GET() {
  try {
    const db = getDB();
    const allBatches = (await db.select().from(batchesTable).all()) as Batch[];
    const allStudents = await db.select({ id: studentsTable.id, batch_id: studentsTable.batch_id }).from(studentsTable).all();

    const counts: Record<string, number> = {};
    allStudents.forEach((s) => {
      if (s.batch_id) {
        counts[s.batch_id] = (counts[s.batch_id] || 0) + 1;
      }
    });

    const batches = allBatches.map((b) => ({
      ...b,
      student_count: counts[b.id] || 0,
    }));

    batches.sort((a, b) => new Date(b.batch_date).getTime() - new Date(a.batch_date).getTime());
    return NextResponse.json({ success: true, data: batches });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const body = await request.json();
    const { batch_name, batch_date, notes } = body;

    const db = getDB();
    const now = new Date().toISOString();
    const newBatch: Batch = {
      id: crypto.randomUUID(),
      batch_name,
      batch_date,
      notes: notes || null,
      status: 'draft',
      created_by: session!.user_id,
      created_at: now,
      updated_at: now,
    };

    await db.insert(batchesTable).values(newBatch);
    return NextResponse.json({ success: true, data: newBatch }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

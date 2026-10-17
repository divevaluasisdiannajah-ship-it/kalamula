export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDB, batches as batchesTable, students as studentsTable } from '@/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { Batch, Student } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDB();

    const batch = (await db
      .select()
      .from(batchesTable)
      .where(eq(batchesTable.id, id))
      .get()) as Batch | null;

    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch tidak ditemukan' }, { status: 404 });
    }

    const students = (await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.batch_id, id))
      .all()) as Student[];

    const student_count = students.length;
    return NextResponse.json({ success: true, data: { ...batch, student_count } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const db = getDB();

    const existing = (await db
      .select()
      .from(batchesTable)
      .where(eq(batchesTable.id, id))
      .get()) as Batch | null;

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Batch tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { status, batch_name, notes } = body;

    if (status) {
      const validTransitions: Record<string, string[]> = {
        draft: ['active'],
        active: ['locked'],
        locked: [],
      };
      if (!validTransitions[existing.status]?.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Tidak bisa mengubah status dari ${existing.status} ke ${status}` },
          { status: 400 }
        );
      }
    }

    const updates: Partial<Batch> = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (batch_name) updates.batch_name = batch_name;
    if (notes !== undefined) updates.notes = notes;

    await db.update(batchesTable).set(updates).where(eq(batchesTable.id, id));
    const updated = { ...existing, ...updates };
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const db = getDB();

    const batch = (await db
      .select()
      .from(batchesTable)
      .where(eq(batchesTable.id, id))
      .get()) as Batch | null;

    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch tidak ditemukan' }, { status: 404 });
    }
    if (batch.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Hanya batch draft yang bisa dihapus' },
        { status: 400 }
      );
    }

    await db.delete(batchesTable).where(eq(batchesTable.id, id));
    return NextResponse.json({ success: true, data: { message: 'Batch berhasil dihapus' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

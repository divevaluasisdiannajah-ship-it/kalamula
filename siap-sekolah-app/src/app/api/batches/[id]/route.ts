export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { findById, update, remove, findWhere } from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { Batch, Student } from '@/types';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const batch = findById<Batch>('batches', id);
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch tidak ditemukan' }, { status: 404 });
    }
    const students = findWhere<Student>('students', (s) => s.batch_id === id);
    return NextResponse.json({ success: true, data: { ...batch, student_count: students.length } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const existing = findById<Batch>('batches', id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Batch tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { status, batch_name, notes } = body;

    // Validate status transitions
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

    const updated = update<Batch>('batches', id, {
      ...(status && { status }),
      ...(batch_name && { batch_name }),
      ...(notes !== undefined && { notes }),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const batch = findById<Batch>('batches', id);
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch tidak ditemukan' }, { status: 404 });
    }
    if (batch.status !== 'draft') {
      return NextResponse.json({ success: false, error: 'Hanya batch draft yang bisa dihapus' }, { status: 400 });
    }

    remove('batches', id);
    return NextResponse.json({ success: true, data: { message: 'Batch berhasil dihapus' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}


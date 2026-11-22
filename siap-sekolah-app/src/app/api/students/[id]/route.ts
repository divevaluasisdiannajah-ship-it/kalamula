export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDB, students as studentsTable } from '@/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { Student } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDB();
    const student = (await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.id, id))
      .get()) as Student | null;

    if (!student) {
      return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: student });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
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
      .from(studentsTable)
      .where(eq(studentsTable.id, id))
      .get()) as Student | null;

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();

    // Validasi field nama jika diedit
    if (body.full_name !== undefined && !body.full_name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama lengkap tidak boleh kosong' },
        { status: 400 }
      );
    }
    if (body.nickname !== undefined && !body.nickname.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama panggilan tidak boleh kosong' },
        { status: 400 }
      );
    }

    // Jika no pendaftaran diubah, pastikan tidak bentrok dengan siswa lain
    if (
      body.registration_no &&
      body.registration_no.trim() !== existing.registration_no
    ) {
      const regDuplicate = await db
        .select()
        .from(studentsTable)
        .where(eq(studentsTable.registration_no, body.registration_no.trim()))
        .get();

      if (regDuplicate && regDuplicate.id !== id) {
        return NextResponse.json(
          { success: false, error: 'No. Pendaftaran sudah digunakan oleh siswa lain' },
          { status: 409 }
        );
      }
    }

    const allowedKeys: (keyof Student)[] = [
      'full_name',
      'nickname',
      'registration_no',
      'birth_date',
      'gender',
      'parent_name',
      'phone',
      'batch_id',
      'observation_group',
      'is_active',
    ];

    const updates: Partial<Student> = {};
    for (const key of allowedKeys) {
      if (key in body) {
        const val = body[key];
        if (typeof val === 'string') {
          (updates as Record<string, unknown>)[key] = val.trim() || null;
        } else {
          (updates as Record<string, unknown>)[key] = val;
        }
      }
    }

    // Ensure non-nullable strings aren't null
    if (updates.full_name === null) updates.full_name = existing.full_name;
    if (updates.nickname === null) updates.nickname = existing.nickname;
    if (updates.registration_no === null) updates.registration_no = existing.registration_no;
    if (updates.birth_date === null) updates.birth_date = existing.birth_date;

    updates.updated_at = new Date().toISOString();

    await db.update(studentsTable).set(updates).where(eq(studentsTable.id, id));
    return NextResponse.json({ success: true, data: { ...existing, ...updates } });
  } catch (err) {
    console.error('Error updating student:', err);
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
    const student = (await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.id, id))
      .get()) as Student | null;

    if (!student) {
      return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    await db.delete(studentsTable).where(eq(studentsTable.id, id));
    return NextResponse.json({ success: true, data: { message: 'Siswa berhasil dihapus' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

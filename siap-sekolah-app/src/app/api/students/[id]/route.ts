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
    const updates = { ...body, updated_at: new Date().toISOString() };
    await db.update(studentsTable).set(updates).where(eq(studentsTable.id, id));
    return NextResponse.json({ success: true, data: { ...existing, ...updates } });
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

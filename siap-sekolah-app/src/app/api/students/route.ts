export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDB, students as studentsTable } from '@/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { Student } from '@/types';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const batchId = url.searchParams.get('batch_id');
    const group = url.searchParams.get('group');

    const db = getDB();
    let query = db.select().from(studentsTable);
    let students = (await (batchId 
      ? db.select().from(studentsTable).where(eq(studentsTable.batch_id, batchId)).all()
      : db.select().from(studentsTable).all())) as Student[];

    if (group) {
      students = students.filter((s) => s.observation_group === group);
    }

    return NextResponse.json({ success: true, data: students });
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
    const {
      registration_no,
      full_name,
      nickname,
      birth_date,
      gender,
      parent_name,
      phone,
      batch_id,
      observation_group,
    } = body;

    const db = getDB();

    // Check for duplicate registration_no
    const existing = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.registration_no, registration_no))
      .get();
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'No Pendaftaran sudah terdaftar' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const newStudent: Student = {
      id: crypto.randomUUID(),
      registration_no,
      full_name,
      nickname,
      birth_date,
      gender,
      parent_name: parent_name || null,
      phone: phone || null,
      batch_id: batch_id || null,
      observation_group: observation_group?.trim() || null,
      avatar_seed: Math.random().toString(36).substring(2, 8),
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    await db.insert(studentsTable).values(newStudent);
    return NextResponse.json({ success: true, data: newStudent }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

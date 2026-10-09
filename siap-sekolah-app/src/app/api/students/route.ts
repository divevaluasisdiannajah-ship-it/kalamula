export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { findAll, findWhere, findOne, create, generateId } from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { Student } from '@/types';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const batchId = url.searchParams.get('batch_id');

    let students: Student[];
    if (batchId) {
      students = findWhere<Student>('students', (s) => s.batch_id === batchId);
    } else {
      students = findAll<Student>('students');
    }

    return NextResponse.json({ success: true, data: students });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const body = await request.json();
    const { registration_no, full_name, nickname, birth_date, gender, parent_name, phone, batch_id } = body;

    // Check for duplicate registration_no
    const existing = findOne<Student>('students', (s) => s.registration_no === registration_no);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'No Pendaftaran sudah terdaftar' },
        { status: 409 }
      );
    }

    const newStudent: Student = {
      id: generateId(),
      registration_no,
      full_name,
      nickname,
      birth_date,
      gender,
      parent_name: parent_name || null,
      phone: phone || null,
      batch_id: batch_id || null,
      avatar_seed: Math.random().toString(36).substring(2, 8),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = create<Student>('students', newStudent);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}


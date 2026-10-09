export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { findOne, create, update, generateId } from '@/lib/db';
import type { ParentResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student_id, batch_id, responses_json } = body;

    if (!student_id || !batch_id) {
      return NextResponse.json({ success: false, error: 'student_id dan batch_id wajib diisi' }, { status: 400 });
    }

    // Upsert parent response
    const existing = findOne<ParentResponse>('parent_responses', (p) =>
      p.student_id === student_id && p.batch_id === batch_id
    );

    const responses = typeof responses_json === 'string' ? responses_json : JSON.stringify(responses_json);

    if (existing) {
      const updated = update<ParentResponse>('parent_responses', existing.id, {
        responses_json: responses,
        submitted_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: updated });
    }

    const newResponse: ParentResponse = {
      id: generateId(),
      student_id,
      batch_id,
      responses_json: responses,
      submitted_at: new Date().toISOString(),
    };

    const created = create<ParentResponse>('parent_responses', newResponse);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}


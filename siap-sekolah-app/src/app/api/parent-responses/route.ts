export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getDB, parentResponses as parentResponsesTable } from '@/db';
import type { ParentResponse } from '@/types';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student_id');
    const batchId = url.searchParams.get('batch_id');

    const db = getDB();
    let query = db.select().from(parentResponsesTable);

    const conditions = [];
    if (studentId) {
      conditions.push(eq(parentResponsesTable.student_id, studentId));
    }
    if (batchId) {
      conditions.push(eq(parentResponsesTable.batch_id, batchId));
    }

    let responses: ParentResponse[];
    if (conditions.length === 1) {
      responses = (await query.where(conditions[0]).all()) as ParentResponse[];
    } else if (conditions.length > 1) {
      responses = (await query.where(and(...conditions)).all()) as ParentResponse[];
    } else {
      responses = (await query.all()) as ParentResponse[];
    }

    return NextResponse.json({ success: true, data: responses });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student_id, batch_id, responses_json } = body;

    if (!student_id || !batch_id) {
      return NextResponse.json(
        { success: false, error: 'student_id dan batch_id wajib diisi' },
        { status: 400 }
      );
    }

    const db = getDB();
    const responses =
      typeof responses_json === 'string' ? responses_json : JSON.stringify(responses_json);

    const now = new Date().toISOString();

    // Upsert parent response
    const existing = (await db
      .select()
      .from(parentResponsesTable)
      .where(
        and(
          eq(parentResponsesTable.student_id, student_id),
          eq(parentResponsesTable.batch_id, batch_id)
        )
      )
      .get()) as ParentResponse | null;

    if (existing) {
      await db
        .update(parentResponsesTable)
        .set({ responses_json: responses, submitted_at: now })
        .where(eq(parentResponsesTable.id, existing.id));
      return NextResponse.json({
        success: true,
        data: { ...existing, responses_json: responses, submitted_at: now },
      });
    }

    const newResponse: ParentResponse = {
      id: crypto.randomUUID(),
      student_id,
      batch_id,
      responses_json: responses,
      submitted_at: now,
    };

    await db.insert(parentResponsesTable).values(newResponse);
    return NextResponse.json({ success: true, data: newResponse }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

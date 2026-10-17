export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getDB, parentResponses as parentResponsesTable } from '@/db';
import type { ParentResponse } from '@/types';

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

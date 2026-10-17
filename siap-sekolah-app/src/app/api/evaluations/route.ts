export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getDB, evaluations as evaluationsTable, students as studentsTable } from '@/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { Evaluation, Student } from '@/types';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student_id');
    const batchId = url.searchParams.get('batch_id');
    const posNumber = url.searchParams.get('pos_number');

    const db = getDB();
    let query = db.select().from(evaluationsTable);

    let evaluations: Evaluation[];
    if (studentId && batchId) {
      evaluations = (await query
        .where(
          and(eq(evaluationsTable.student_id, studentId), eq(evaluationsTable.batch_id, batchId))
        )
        .all()) as Evaluation[];
    } else if (batchId && posNumber) {
      evaluations = (await query
        .where(
          and(
            eq(evaluationsTable.batch_id, batchId),
            eq(evaluationsTable.pos_number, parseInt(posNumber))
          )
        )
        .all()) as Evaluation[];
    } else if (studentId) {
      evaluations = (await query
        .where(eq(evaluationsTable.student_id, studentId))
        .all()) as Evaluation[];
    } else if (batchId) {
      evaluations = (await query
        .where(eq(evaluationsTable.batch_id, batchId))
        .all()) as Evaluation[];
    } else {
      evaluations = (await query.all()) as Evaluation[];
    }

    return NextResponse.json({ success: true, data: evaluations });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    const auth = requireRole(session, 'evaluator', 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const body = await request.json();
    const {
      student_id,
      batch_id,
      pos_number,
      config_id,
      scores_json,
      reading_level,
      red_flags_json,
      anecdotal_note,
      client_id,
    } = body;

    const db = getDB();

    // Validate student exists
    const student = (await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student_id))
      .get()) as Student | null;
    if (!student) {
      return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    // Check for existing evaluation (upsert)
    const existing = (await db
      .select()
      .from(evaluationsTable)
      .where(
        and(
          eq(evaluationsTable.student_id, student_id),
          eq(evaluationsTable.batch_id, batch_id),
          eq(evaluationsTable.pos_number, pos_number)
        )
      )
      .get()) as Evaluation | null;

    // Parse scores and compute total
    const scores = typeof scores_json === 'string' ? JSON.parse(scores_json) : scores_json;
    const scoreValues = Object.values(scores).filter(
      (v): v is number => typeof v === 'number'
    );
    const totalScore =
      scoreValues.length > 0
        ? scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length
        : null;

    // Parse red flags
    const redFlags = typeof red_flags_json === 'string' ? JSON.parse(red_flags_json) : red_flags_json;
    const hasRedFlag = Object.values(redFlags).some((v) => v === true);

    const isComplete = scoreValues.length > 0;
    const now = new Date().toISOString();

    if (existing) {
      const updates = {
        scores_json: JSON.stringify(scores),
        reading_level: reading_level || null,
        red_flags_json: JSON.stringify(redFlags),
        has_red_flag: hasRedFlag,
        anecdotal_note: anecdotal_note || null,
        total_score: totalScore,
        is_complete: isComplete,
        synced_at: now,
        updated_at: now,
      };
      await db.update(evaluationsTable).set(updates).where(eq(evaluationsTable.id, existing.id));
      return NextResponse.json({ success: true, data: { ...existing, ...updates } });
    }

    // Create new evaluation
    const newEvaluation: Evaluation = {
      id: crypto.randomUUID(),
      student_id,
      batch_id,
      pos_number,
      evaluator_id: session!.user_id,
      config_id: config_id || null,
      scores_json: JSON.stringify(scores),
      reading_level: reading_level || null,
      red_flags_json: JSON.stringify(redFlags),
      has_red_flag: hasRedFlag,
      anecdotal_note: anecdotal_note || null,
      total_score: totalScore,
      is_complete: isComplete,
      client_id: client_id || null,
      synced_at: now,
      created_at: now,
      updated_at: now,
    };

    await db.insert(evaluationsTable).values(newEvaluation);
    return NextResponse.json({ success: true, data: newEvaluation }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

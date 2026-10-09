import { NextResponse } from 'next/server';
import { findAll, findWhere, findOne, create, update, generateId } from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { Evaluation, Student } from '@/types';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student_id');
    const batchId = url.searchParams.get('batch_id');
    const posNumber = url.searchParams.get('pos_number');

    let evaluations: Evaluation[];

    if (studentId && batchId) {
      evaluations = findWhere<Evaluation>('evaluations', (e) =>
        e.student_id === studentId && e.batch_id === batchId
      );
    } else if (batchId && posNumber) {
      evaluations = findWhere<Evaluation>('evaluations', (e) =>
        e.batch_id === batchId && e.pos_number === parseInt(posNumber)
      );
    } else if (studentId) {
      evaluations = findWhere<Evaluation>('evaluations', (e) => e.student_id === studentId);
    } else if (batchId) {
      evaluations = findWhere<Evaluation>('evaluations', (e) => e.batch_id === batchId);
    } else {
      evaluations = findAll<Evaluation>('evaluations');
    }

    return NextResponse.json({ success: true, data: evaluations });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const auth = requireRole(session, 'evaluator', 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const body = await request.json();
    const {
      student_id, batch_id, pos_number, config_id,
      scores_json, reading_level, red_flags_json,
      anecdotal_note, client_id,
    } = body;

    // Validate student exists
    const student = findOne<Student>('students', (s) => s.id === student_id);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    // Check for existing evaluation (upsert)
    const existing = findOne<Evaluation>('evaluations', (e) =>
      e.student_id === student_id && e.batch_id === batch_id && e.pos_number === pos_number
    );

    // Parse scores and compute total
    const scores = typeof scores_json === 'string' ? JSON.parse(scores_json) : scores_json;
    const scoreValues = Object.values(scores).filter((v): v is number => typeof v === 'number');
    const totalScore = scoreValues.length > 0
      ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
      : null;

    // Parse red flags
    const redFlags = typeof red_flags_json === 'string' ? JSON.parse(red_flags_json) : red_flags_json;
    const hasRedFlag = Object.values(redFlags).some((v) => v === true);

    // Determine completion
    const configScoresCount = scoreValues.length;
    const isComplete = configScoresCount > 0; // at least some scores filled

    if (existing) {
      // Update existing evaluation
      const updated = update<Evaluation>('evaluations', existing.id, {
        scores_json: JSON.stringify(scores),
        reading_level: reading_level || null,
        red_flags_json: JSON.stringify(redFlags),
        has_red_flag: hasRedFlag,
        anecdotal_note: anecdotal_note || null,
        total_score: totalScore,
        is_complete: isComplete,
        synced_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Create new evaluation
    const newEvaluation: Evaluation = {
      id: generateId(),
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
      synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = create<Evaluation>('evaluations', newEvaluation);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

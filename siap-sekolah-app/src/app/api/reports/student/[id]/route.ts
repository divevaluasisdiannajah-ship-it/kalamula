export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDB, students as studentsTable } from '@/db';
import {
  buildStudentProfile,
  generateQualitativeNarrative,
  getStudentAiSummary,
  saveStudentAiSummary,
} from '@/lib/profiles';
import { synthesizeWithGemini } from '@/lib/gemini';
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

    const profile = await buildStudentProfile(db, student);
    const qualitative = generateQualitativeNarrative(profile);

    // 1. Check if AI summary is already cached in database
    const cachedSummary = await getStudentAiSummary(db, id);
    if (cachedSummary) {
      return NextResponse.json({
        success: true,
        data: {
          profile,
          narratives: cachedSummary.narratives,
          stimulations: cachedSummary.stimulations,
          source: 'ai',
          cached: true,
        },
      });
    }

    // 2. If not cached, auto-synthesize if authentic notes exist
    const hasNotes = Object.values(qualitative.notes).some(
      (n) => n && n.trim().length > 0
    );

    if (hasNotes) {
      try {
        const aiResult = await synthesizeWithGemini({
          fullName: student.full_name,
          nickname: student.nickname,
          templates: qualitative.templates,
          notes: qualitative.notes,
          readingLevel: profile.reading_level,
          overallScore: profile.overall_score,
        });

        if (aiResult.source === 'ai') {
          // Save to D1 database for instant retrieval next time
          await saveStudentAiSummary(
            db,
            id,
            student.batch_id,
            aiResult.narratives,
            aiResult.stimulations
          );

          return NextResponse.json({
            success: true,
            data: {
              profile,
              narratives: aiResult.narratives,
              stimulations: aiResult.stimulations,
              source: 'ai',
              cached: false,
            },
          });
        }
      } catch (aiErr) {
        console.error('Auto Gemini synthesis error:', aiErr);
      }
    }

    // 3. Fallback to smart rule-based combination (template + sanitized teacher notes)
    return NextResponse.json({
      success: true,
      data: {
        profile,
        narratives: qualitative.narratives,
        stimulations: qualitative.stimulations,
        source: 'fallback',
        cached: false,
      },
    });
  } catch (err) {
    console.error('GET /api/reports/student/[id] error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/reports/student/[id]
 * Explicitly triggers AI narrative synthesis with Gemini and updates the database cache.
 */
export async function POST(
  request: Request,
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

    let apiKeyOverride: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body === 'object' && 'apiKey' in body && typeof body.apiKey === 'string') {
        apiKeyOverride = body.apiKey;
      }
    } catch {
      // Body may be empty, which is totally fine
    }

    const profile = await buildStudentProfile(db, student);
    const qualitative = generateQualitativeNarrative(profile);

    const aiResult = await synthesizeWithGemini(
      {
        fullName: student.full_name,
        nickname: student.nickname,
        templates: qualitative.templates,
        notes: qualitative.notes,
        readingLevel: profile.reading_level,
        overallScore: profile.overall_score,
      },
      apiKeyOverride
    );

    // Save to D1 database
    await saveStudentAiSummary(
      db,
      id,
      student.batch_id,
      aiResult.narratives,
      aiResult.stimulations
    );

    return NextResponse.json({
      success: true,
      data: {
        profile,
        narratives: aiResult.narratives,
        stimulations: aiResult.stimulations,
        source: aiResult.source,
      },
    });
  } catch (err) {
    console.error('POST /api/reports/student/[id] error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

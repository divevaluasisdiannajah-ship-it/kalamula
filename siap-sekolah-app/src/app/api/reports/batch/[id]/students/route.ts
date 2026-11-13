export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDB, batches as batchesTable } from '@/db';
import {
  getBatchStudentProfiles,
  generateQualitativeNarrative,
  getStudentAiSummary,
  saveStudentAiSummary,
} from '@/lib/profiles';
import { synthesizeWithGemini } from '@/lib/gemini';
import type { Batch } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDB();

    const batch = (await db
      .select()
      .from(batchesTable)
      .where(eq(batchesTable.id, id))
      .get()) as Batch | null;

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Gelombang tidak ditemukan' },
        { status: 404 }
      );
    }

    const profiles = await getBatchStudentProfiles(db, id);

    // Build complete report item for each student, auto-synthesizing AI if not yet cached
    const items = await Promise.all(
      profiles.map(async (profile) => {
        const qualitative = generateQualitativeNarrative(profile);
        let cached = await getStudentAiSummary(db, profile.student.id);

        if (!cached) {
          const hasNotes = Object.values(qualitative.notes).some(
            (n) => n && n.trim().length > 0
          );
          if (hasNotes) {
            try {
              const aiResult = await synthesizeWithGemini({
                fullName: profile.student.full_name,
                nickname: profile.student.nickname,
                templates: qualitative.templates,
                notes: qualitative.notes,
                readingLevel: profile.reading_level,
                overallScore: profile.overall_score,
              });

              if (aiResult.source === 'ai') {
                await saveStudentAiSummary(
                  db,
                  profile.student.id,
                  profile.student.batch_id,
                  aiResult.narratives,
                  aiResult.stimulations
                );
                cached = {
                  narratives: aiResult.narratives,
                  stimulations: aiResult.stimulations,
                  updated_at: new Date().toISOString(),
                };
              }
            } catch (aiErr) {
              console.error('Batch student auto Gemini error:', aiErr);
            }
          }
        }

        const narratives = cached?.narratives || qualitative.narratives;
        const stimulations = cached?.stimulations || qualitative.stimulations;
        const source = cached ? 'ai' : 'fallback';

        return {
          profile,
          narratives,
          stimulations,
          source,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        batch,
        total: items.length,
        items,
      },
    });
  } catch (err: any) {
    console.error('Error fetching batch student reports:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

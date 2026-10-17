export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDB, students as studentsTable } from '@/db';
import { buildStudentProfile, generateQualitativeNarrative } from '@/lib/profiles';
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

    return NextResponse.json({
      success: true,
      data: {
        profile,
        narratives: qualitative.narratives,
        stimulations: qualitative.stimulations,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getDB, classPlacements as classPlacementsTable } from '@/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import { getBatchStudentProfiles } from '@/lib/profiles';
import { balanceClasses, buildClassBalanceMetrics } from '@/lib/balancer';
import type { ClassPlacement } from '@/types';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const batchId = url.searchParams.get('batch_id');

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'batch_id parameter is required' },
        { status: 400 }
      );
    }

    const db = getDB();
    const profiles = await getBatchStudentProfiles(db, batchId);
    const existingPlacements = (await db
      .select()
      .from(classPlacementsTable)
      .where(eq(classPlacementsTable.batch_id, batchId))
      .all()) as ClassPlacement[];

    const studentsA = profiles.filter((p) => {
      const placement = existingPlacements.find((ep) => ep.student_id === p.student.id);
      return placement?.assigned_class === '1A';
    });

    const studentsB = profiles.filter((p) => {
      const placement = existingPlacements.find((ep) => ep.student_id === p.student.id);
      return placement?.assigned_class === '1B';
    });

    const unassigned = profiles.filter(
      (p) => !existingPlacements.some((ep) => ep.student_id === p.student.id)
    );

    const classA = buildClassBalanceMetrics('1A', studentsA);
    const classB = buildClassBalanceMetrics('1B', studentsB);

    const genderDiff = Math.abs(classA.male_count - classB.male_count);
    const redFlagDiff = Math.abs(classA.red_flag_count - classB.red_flag_count);
    const scoreDiff = Math.abs(classA.avg_score - classB.avg_score);

    const warnings: string[] = [];
    if (genderDiff > 2) {
      warnings.push(`Ketidakseimbangan Gender: Selisih ${genderDiff} siswa laki-laki antara 1A dan 1B.`);
    }
    if (redFlagDiff > 1) {
      warnings.push(`Penyebaran Red Flag: Selisih ${redFlagDiff} anak red flag antara 1A dan 1B.`);
    }
    if (scoreDiff > 0.3) {
      warnings.push(`Kesenjangan Rata-rata Skor: Selisih ${scoreDiff.toFixed(2)} antara 1A (${classA.avg_score.toFixed(2)}) dan 1B (${classB.avg_score.toFixed(2)}).`);
    }

    let balanceScore = 100;
    balanceScore -= genderDiff * 10;
    balanceScore -= redFlagDiff * 12;
    balanceScore -= Math.round(scoreDiff * 30);
    balanceScore = Math.max(0, Math.min(100, balanceScore));

    classA.balance_score = balanceScore;
    classB.balance_score = balanceScore;

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        totalStudents: profiles.length,
        classA,
        classB,
        unassigned,
        placements: existingPlacements,
        balanceScore: existingPlacements.length > 0 ? balanceScore : null,
        overallBalanceScore: existingPlacements.length > 0 ? balanceScore : null,
        warnings,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
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
    const { batch_id, dry_run = false } = body;

    if (!batch_id) {
      return NextResponse.json(
        { success: false, error: 'batch_id parameter is required' },
        { status: 400 }
      );
    }

    const db = getDB();
    const profiles = await getBatchStudentProfiles(db, batch_id);
    if (profiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada siswa pada batch ini' },
        { status: 400 }
      );
    }

    const result = balanceClasses(profiles, batch_id);

    if (!dry_run) {
      // Clear previous placements for this batch before inserting newly balanced placements
      await db
        .delete(classPlacementsTable)
        .where(eq(classPlacementsTable.batch_id, batch_id));

      // Insert new placements
      for (const p of result.placements) {
        await db.insert(classPlacementsTable).values(p);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        balanceScore: result.overallBalanceScore,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

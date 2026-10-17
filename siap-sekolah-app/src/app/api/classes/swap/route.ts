export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getDB, classPlacements as classPlacementsTable } from '@/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { ClassPlacement, AssignedClass } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const body = await request.json();
    const { student_id, batch_id, target_class, override_reason } = body;

    if (!student_id || !batch_id || !target_class) {
      return NextResponse.json(
        { success: false, error: 'student_id, batch_id, dan target_class wajib diisi' },
        { status: 400 }
      );
    }

    if (target_class !== '1A' && target_class !== '1B') {
      return NextResponse.json(
        { success: false, error: 'target_class harus 1A atau 1B' },
        { status: 400 }
      );
    }

    const db = getDB();
    const now = new Date().toISOString();

    const existingPlacement = (await db
      .select()
      .from(classPlacementsTable)
      .where(
        and(
          eq(classPlacementsTable.student_id, student_id),
          eq(classPlacementsTable.batch_id, batch_id)
        )
      )
      .get()) as ClassPlacement | null;

    if (existingPlacement) {
      const updates = {
        assigned_class: target_class as AssignedClass,
        manual_override: true,
        override_by: session!.user_id,
        override_reason: override_reason || 'Manual swap by admin',
        override_at: now,
        updated_at: now,
      };
      await db
        .update(classPlacementsTable)
        .set(updates)
        .where(eq(classPlacementsTable.id, existingPlacement.id));
      return NextResponse.json({ success: true, data: { ...existingPlacement, ...updates } });
    }

    const newPlacement: ClassPlacement = {
      id: crypto.randomUUID(),
      student_id,
      batch_id,
      assigned_class: target_class as AssignedClass,
      algorithm_version: 'manual-override',
      balance_score: null,
      manual_override: true,
      override_by: session!.user_id,
      override_reason: override_reason || 'Manual placement by admin',
      override_at: now,
      assigned_at: now,
      updated_at: now,
    };
    await db.insert(classPlacementsTable).values(newPlacement);
    return NextResponse.json({ success: true, data: newPlacement });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

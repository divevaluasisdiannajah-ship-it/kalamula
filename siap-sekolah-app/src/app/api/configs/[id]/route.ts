export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDB, assessmentConfigs as configsTable } from '@/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { AssessmentConfig } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDB();
    const config = (await db
      .select()
      .from(configsTable)
      .where(eq(configsTable.id, id))
      .get()) as AssessmentConfig | null;

    if (!config) {
      return NextResponse.json({ success: false, error: 'Config tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: config });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const db = getDB();
    const existing = (await db
      .select()
      .from(configsTable)
      .where(eq(configsTable.id, id))
      .get()) as AssessmentConfig | null;

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Config tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const updates = { ...body, updated_at: new Date().toISOString() };
    await db.update(configsTable).set(updates).where(eq(configsTable.id, id));
    return NextResponse.json({ success: true, data: { ...existing, ...updates } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const db = getDB();
    const existing = (await db
      .select()
      .from(configsTable)
      .where(eq(configsTable.id, id))
      .get()) as AssessmentConfig | null;

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Config tidak ditemukan' }, { status: 404 });
    }

    // Soft delete
    await db
      .update(configsTable)
      .set({ is_active: false, updated_at: new Date().toISOString() })
      .where(eq(configsTable.id, id));
    return NextResponse.json({ success: true, data: { message: 'Config dinonaktifkan' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

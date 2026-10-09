import { NextResponse } from 'next/server';
import { findById, update, remove } from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { AssessmentConfig } from '@/types';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const config = findById<AssessmentConfig>('assessment_configs', id);
    if (!config) {
      return NextResponse.json({ success: false, error: 'Config tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: config });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const updated = update<AssessmentConfig>('assessment_configs', id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Config tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const { id } = await params;
    // Soft delete: set is_active to false
    const updated = update<AssessmentConfig>('assessment_configs', id, { is_active: false } as Partial<AssessmentConfig>);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Config tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { message: 'Config dinonaktifkan' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

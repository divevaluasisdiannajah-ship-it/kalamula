export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDB, assessmentConfigs as configsTable } from '@/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { AssessmentConfig } from '@/types';

export async function GET() {
  try {
    const db = getDB();
    const configs = (await db
      .select()
      .from(configsTable)
      .where(eq(configsTable.is_active, true))
      .all()) as AssessmentConfig[];
    return NextResponse.json({ success: true, data: configs });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
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
    const { pos_number, pos_name, pos_description, indicators_json, red_flags_json } = body;

    const db = getDB();
    const now = new Date().toISOString();
    const newConfig: AssessmentConfig = {
      id: crypto.randomUUID(),
      pos_number,
      pos_name,
      pos_description: pos_description || null,
      indicators_json: indicators_json || '[]',
      red_flags_json: red_flags_json || '[]',
      version: '1.0.0',
      is_active: true,
      created_by: session!.user_id,
      created_at: now,
      updated_at: now,
    };

    await db.insert(configsTable).values(newConfig);
    return NextResponse.json({ success: true, data: newConfig }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

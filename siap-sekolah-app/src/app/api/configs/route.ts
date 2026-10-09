import { NextResponse } from 'next/server';
import { findWhere, create, generateId } from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { AssessmentConfig } from '@/types';

export async function GET() {
  try {
    const configs = findWhere<AssessmentConfig>('assessment_configs', (c) => c.is_active === true);
    return NextResponse.json({ success: true, data: configs });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const auth = requireRole(session, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const body = await request.json();
    const { pos_number, pos_name, pos_description, indicators_json, red_flags_json } = body;

    const newConfig: AssessmentConfig = {
      id: generateId(),
      pos_number,
      pos_name,
      pos_description: pos_description || null,
      indicators_json: indicators_json || '[]',
      red_flags_json: red_flags_json || '[]',
      version: '1.0.0',
      is_active: true,
      created_by: session!.user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = create<AssessmentConfig>('assessment_configs', newConfig);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

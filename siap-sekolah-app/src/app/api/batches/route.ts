export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { findAll, create, generateId } from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import type { Batch } from '@/types';

export async function GET() {
  try {
    const batches = findAll<Batch>('batches');
    batches.sort((a, b) => new Date(b.batch_date).getTime() - new Date(a.batch_date).getTime());
    return NextResponse.json({ success: true, data: batches });
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
    const { batch_name, batch_date, notes } = body;

    const newBatch: Batch = {
      id: generateId(),
      batch_name,
      batch_date,
      notes: notes || null,
      status: 'draft',
      created_by: session!.user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = create<Batch>('batches', newBatch);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}


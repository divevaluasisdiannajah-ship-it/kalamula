export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { findWhere, findAll } from '@/lib/db';
import { verifyPin, createSession } from '@/lib/auth';
import { User } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin, pos_number } = body;

    let user: User | undefined;

    if (pos_number !== undefined) {
      user = findWhere<User>('users', (u) => u.pos_number === pos_number && u.role === 'evaluator')[0];
    } else {
      const users = findAll<User>('users');
      user = users.find((u) => u.role === 'admin' || u.role === 'teacher');
    }

    if (!user || !user.pin_hash) {
      return NextResponse.json({ success: false, error: 'PIN salah atau pengguna tidak ditemukan' }, { status: 401 });
    }

    const isValid = await verifyPin(pin, user.pin_hash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'PIN salah atau pengguna tidak ditemukan' }, { status: 401 });
    }

    const token = await createSession(user);
    const session = { user_id: user.id, role: user.role, name: user.name, pos_number: user.pos_number };

    const response = NextResponse.json({ success: true, data: { token, session } });
    response.cookies.set('session', token, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const response = NextResponse.json({ success: true, data: { message: 'Logged out successfully' } });
    response.cookies.delete('session');
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}


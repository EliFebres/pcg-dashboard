export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { queryUsers } from '@/app/lib/db/users';
import { verifyJWT, SESSION_COOKIE } from '@/app/lib/auth/jwt';
import { rowToUser } from '@/app/lib/auth/types';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyJWT(token);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const rows = await queryUsers(
      'SELECT * FROM users ORDER BY created_at DESC'
    );

    const users = (rows as Record<string, unknown>[]).map(rowToUser);
    return NextResponse.json(users, { status: 200 });
  } catch (err) {
    console.error('[GET /api/admin/users]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

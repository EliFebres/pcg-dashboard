export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { queryUsers } from '@/app/lib/db/users';
import { verifyPassword } from '@/app/lib/auth/password';
import { signJWT, SESSION_COOKIE, COOKIE_OPTIONS } from '@/app/lib/auth/jwt';
import { rowToUser } from '@/app/lib/auth/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const rows = await queryUsers('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const row = rows[0] as Record<string, unknown>;

    if (row.status === 'pending') {
      return NextResponse.json({ error: 'Your account is pending admin approval.' }, { status: 403 });
    }
    if (row.status === 'inactive') {
      return NextResponse.json({ error: 'Your account has been deactivated. Contact an admin.' }, { status: 403 });
    }

    const valid = await verifyPassword(password, row.password_hash as string);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const user = rowToUser(row);

    const jwt = await signJWT({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json({ user }, { status: 200 });
    response.cookies.set(SESSION_COOKIE, jwt, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

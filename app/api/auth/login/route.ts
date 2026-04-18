export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { queryUsers } from '@/app/lib/db/users';
import { verifyPassword } from '@/app/lib/auth/password';
import { signJWT, SESSION_COOKIE, COOKIE_OPTIONS } from '@/app/lib/auth/jwt';
import { rowToUser } from '@/app/lib/auth/types';
import { logActivity } from '@/app/lib/activity/log';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const rows = await queryUsers('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) {
      void logActivity(req, {
        action: 'auth.login_failed',
        entityType: 'user',
        details: { reason: 'unknown_email' },
        userOverride: { email: String(email).toLowerCase() },
      });
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const row = rows[0] as Record<string, unknown>;

    if (row.status === 'pending') {
      void logActivity(req, {
        action: 'auth.login_failed',
        entityType: 'user',
        entityId: row.id as string,
        details: { reason: 'pending' },
        userOverride: { id: row.id as string, email: row.email as string },
      });
      return NextResponse.json({ error: 'Your account is pending admin approval.' }, { status: 403 });
    }
    if (row.status === 'inactive') {
      void logActivity(req, {
        action: 'auth.login_failed',
        entityType: 'user',
        entityId: row.id as string,
        details: { reason: 'inactive' },
        userOverride: { id: row.id as string, email: row.email as string },
      });
      return NextResponse.json({ error: 'Your account has been deactivated. Contact an admin.' }, { status: 403 });
    }

    const valid = await verifyPassword(password, row.password_hash as string);
    if (!valid) {
      void logActivity(req, {
        action: 'auth.login_failed',
        entityType: 'user',
        entityId: row.id as string,
        details: { reason: 'bad_password' },
        userOverride: { id: row.id as string, email: row.email as string },
      });
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
      team: user.team,
    });

    void logActivity(req, {
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
      userOverride: { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`.trim() },
    });

    const response = NextResponse.json({ user }, { status: 200 });
    response.cookies.set(SESSION_COOKIE, jwt, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/app/lib/auth/jwt';
import { logActivity } from '@/app/lib/activity/log';

export async function POST(req: NextRequest) {
  void logActivity(req, { action: 'auth.logout', entityType: 'user' });
  const response = NextResponse.json({ message: 'Logged out.' }, { status: 200 });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

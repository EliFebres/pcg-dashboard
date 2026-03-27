export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/app/lib/auth/jwt';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out.' }, { status: 200 });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

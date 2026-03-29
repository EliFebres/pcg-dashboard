import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, SESSION_COOKIE } from './jwt';
import type { JWTPayload } from './jwt';
import type { ServerConstraints } from '../db/queries';

export type AuthResult =
  | { payload: JWTPayload; error: null }
  | { payload: null; error: NextResponse };

export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return { payload: null, error: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }) };
  }
  try {
    const payload = await verifyJWT(token);
    if (!payload.team && payload.role !== 'admin') {
      return { payload: null, error: NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 }) };
    }
    return { payload, error: null };
  } catch {
    return { payload: null, error: NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 }) };
  }
}

export function teamConstraint(payload: JWTPayload): ServerConstraints {
  return { team: payload.role === 'admin' ? undefined : payload.team };
}

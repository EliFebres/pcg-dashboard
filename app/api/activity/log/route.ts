export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth/require-auth';
import { logActivity } from '@/app/lib/activity/log';

const CLIENT_ACTION_ALLOWLIST = new Set(['page.view']);

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const action = String(body?.action ?? '');
    if (!CLIENT_ACTION_ALLOWLIST.has(action)) {
      return NextResponse.json({ error: 'Action not allowed.' }, { status: 400 });
    }

    const path = typeof body?.path === 'string' ? body.path : null;

    void logActivity(req, {
      action,
      entityType: 'page',
      entityId: path,
      details: path ? { path } : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}

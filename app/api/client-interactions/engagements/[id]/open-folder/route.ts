export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { query } from '@/app/lib/db';
import { requireAuth, teamConstraint } from '@/app/lib/auth/require-auth';

// POST /api/client-interactions/engagements/:id/open-folder
// Looks up the engagement's stored filepath and launches Windows Explorer to it.
// The path is read from the DB (never from the request body) so a caller can't
// point this endpoint at arbitrary paths.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DUCKDB_DIR) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }
  if (process.platform !== 'win32') {
    return NextResponse.json({ error: 'Opening folders is only supported on Windows.' }, { status: 501 });
  }
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const sc = teamConstraint(auth.payload);

  try {
    const { id } = await params;
    const engagementId = Number(id);

    const teamClause = sc.team ? 'AND team = ?' : '';
    const teamParams = sc.team ? [sc.team] : [];
    const rows = await query<{ filepath: string | null }>(
      `SELECT filepath FROM engagements WHERE id = ? ${teamClause}`,
      [engagementId, ...teamParams]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }
    const filepath = rows[0].filepath;
    if (!filepath) {
      return NextResponse.json({ error: 'No filepath set for this engagement.' }, { status: 400 });
    }

    // Arg-array form (no shell) — the path is passed as a single argv entry, so
    // shell metacharacters in the stored value can't break out into a command.
    // Note: explorer.exe returns exit code 1 even on success when launching a
    // window, so we don't await it; spawning it is the result.
    const child = spawn('explorer.exe', [filepath], { detached: true, stdio: 'ignore' });
    child.unref();

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('POST .../open-folder error:', err);
    return NextResponse.json({ error: 'Failed to open folder' }, { status: 500 });
  }
}

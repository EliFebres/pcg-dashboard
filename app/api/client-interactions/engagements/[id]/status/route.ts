export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/app/lib/db';
import { requireAuth, teamConstraint } from '@/app/lib/auth/require-auth';
import { toDisplayDate, localTodayISO } from '@/app/lib/db/dateUtils';
import { emitEngagementChange } from '@/app/lib/events';

// PATCH /api/client-interactions/engagements/:id/status
// Body: { status: string }
// Auto-sets date_finished to today when status becomes "Complete"; clears it otherwise.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DUCKDB_DIR) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const sc = teamConstraint(auth.payload);

  try {
    const { id } = await params;
    const engagementId = Number(id);
    const { status } = await req.json();

    const VALID_STATUSES = ['In Progress', 'Awaiting Meeting', 'Follow Up', 'Completed'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const todayISO = localTodayISO();
    const dateFinishedISO = status === 'Completed' ? todayISO : null;
    const teamClause = sc.team ? 'AND team = ?' : '';
    const teamParams = sc.team ? [sc.team] : [];

    await execute(
      `UPDATE engagements SET status = ?, date_finished = ? WHERE id = ? ${teamClause}`,
      [status, dateFinishedISO, engagementId, ...teamParams]
    );

    // Verify the row exists
    const rows = await query<Record<string, unknown>>(
      `SELECT id, status, date_finished FROM engagements WHERE id = ?`,
      [engagementId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }

    emitEngagementChange('updated');
    return NextResponse.json({
      id: engagementId,
      status,
      dateFinished: toDisplayDate(rows[0].date_finished as string | null),
    });
  } catch (err) {
    console.error('PATCH .../status error:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

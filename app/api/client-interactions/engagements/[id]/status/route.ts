export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/app/lib/db';
import { toDisplayDate } from '@/app/lib/db/dateUtils';

// PATCH /api/client-interactions/engagements/:id/status
// Body: { status: string }
// Auto-sets date_finished to today when status becomes "Completed"; clears it otherwise.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DUCKDB_DIR) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }
  try {
    const { id } = await params;
    const engagementId = Number(id);
    const { status } = await req.json();

    const VALID_STATUSES = ['Pending', 'In Progress', 'Completed'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const todayISO = new Date().toISOString().split('T')[0];
    const dateFinishedISO = status === 'Completed' ? todayISO : null;

    await execute(
      `UPDATE engagements SET status = ?, date_finished = ? WHERE id = ?`,
      [status, dateFinishedISO, engagementId]
    );

    // Verify the row exists
    const rows = await query<Record<string, unknown>>(
      `SELECT id, status, date_finished FROM engagements WHERE id = ?`,
      [engagementId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }

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

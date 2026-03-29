export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { rowToEngagement } from '@/app/lib/db/queries';
import { requireAuth, teamConstraint } from '@/app/lib/auth/require-auth';
import { toISODate } from '@/app/lib/db/dateUtils';

// GET /api/client-interactions/engagements/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const sc = teamConstraint(auth.payload);

  try {
    const { id } = await params;
    const teamClause = sc.team ? 'AND team = ?' : '';
    const teamParams = sc.team ? [sc.team] : [];
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM engagements WHERE id = ? ${teamClause}`,
      [Number(id), ...teamParams]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }
    return NextResponse.json(rowToEngagement(rows[0]));
  } catch (err) {
    console.error('GET /api/client-interactions/engagements/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch engagement' }, { status: 500 });
  }
}

// PATCH /api/client-interactions/engagements/:id
// Body: partial engagement fields (camelCase) — only provided fields are updated
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DUCKDB_DIR) {
    return NextResponse.json({ error: 'Database not configured. Set DUCKDB_PATH to enable write operations.' }, { status: 503 });
  }
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const sc = teamConstraint(auth.payload);

  try {
    const { id } = await params;
    const engagementId = Number(id);
    const body = await req.json();

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (body.externalClient !== undefined) {
      setClauses.push('external_client = ?');
      values.push(body.externalClient ?? null);
    }
    if (body.internalClient !== undefined) {
      setClauses.push('internal_client_name = ?', 'internal_client_dept = ?');
      values.push(body.internalClient.name, body.internalClient.gcgDepartment);
    }
    if (body.intakeType !== undefined) {
      setClauses.push('intake_type = ?');
      values.push(body.intakeType);
    }
    if (body.adHocChannel !== undefined) {
      setClauses.push('ad_hoc_channel = ?');
      values.push(body.adHocChannel ?? null);
    }
    if (body.type !== undefined) {
      setClauses.push('type = ?');
      values.push(body.type);
    }
    if (body.teamMembers !== undefined) {
      setClauses.push('team_members = ?');
      values.push(JSON.stringify(body.teamMembers));
    }
    if (body.dateStarted !== undefined) {
      setClauses.push('date_started = ?');
      values.push(toISODate(body.dateStarted));
    }
    if (body.dateFinished !== undefined) {
      setClauses.push('date_finished = ?');
      values.push(toISODate(body.dateFinished));
    }
    if (body.status !== undefined) {
      setClauses.push('status = ?');
      values.push(body.status);
    }
    if (body.portfolioLogged !== undefined) {
      setClauses.push('portfolio_logged = ?');
      values.push(Boolean(body.portfolioLogged));
    }
    if (body.portfolio !== undefined) {
      setClauses.push('portfolio = ?');
      values.push(body.portfolio ? JSON.stringify(body.portfolio) : null);
    }
    if (body.nna !== undefined) {
      setClauses.push('nna = ?');
      values.push(body.nna ?? null);
    }
    if (body.notes !== undefined) {
      setClauses.push('notes = ?');
      values.push(body.notes ?? null);
    }
    if (body.tickersMentioned !== undefined) {
      setClauses.push('tickers_mentioned = ?');
      values.push(body.tickersMentioned ? JSON.stringify(body.tickersMentioned) : null);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Always bump version for optimistic locking
    setClauses.push('version = version + 1');

    // If client sends version, enforce it to detect concurrent edits
    const clientVersion = typeof body.version === 'number' ? body.version : null;
    const teamClause = sc.team ? 'AND team = ?' : '';
    const whereClause = clientVersion !== null
      ? `WHERE id = ? AND version = ? ${teamClause}`
      : `WHERE id = ? ${teamClause}`;
    values.push(engagementId);
    if (clientVersion !== null) values.push(clientVersion);
    if (sc.team) values.push(sc.team);

    const updated = await query<Record<string, unknown>>(
      `UPDATE engagements SET ${setClauses.join(', ')} ${whereClause} RETURNING id`,
      values
    );

    if (updated.length === 0) {
      const exists = await query<{ id: number }>(`SELECT id FROM engagements WHERE id = ?`, [engagementId]);
      if (exists.length === 0) {
        return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'This engagement was modified by someone else. Refresh and try again.' },
        { status: 409 }
      );
    }

    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM engagements WHERE id = ?`,
      [engagementId]
    );
    return NextResponse.json(rowToEngagement(rows[0]));
  } catch (err) {
    console.error('PATCH /api/client-interactions/engagements/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update engagement' }, { status: 500 });
  }
}

// DELETE /api/client-interactions/engagements/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DUCKDB_DIR) {
    return NextResponse.json({ error: 'Database not configured. Set DUCKDB_PATH to enable write operations.' }, { status: 503 });
  }
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const sc = teamConstraint(auth.payload);

  try {
    const { id } = await params;
    const teamClause = sc.team ? 'AND team = ?' : '';
    const teamParams = sc.team ? [sc.team] : [];
    await query(`DELETE FROM engagements WHERE id = ? ${teamClause}`, [Number(id), ...teamParams]);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/client-interactions/engagements/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete engagement' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/app/lib/db';
import { rowToEngagement } from '@/app/lib/db/queries';
import { toISODate } from '@/app/lib/db/dateUtils';

// GET /api/client-interactions/engagements/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM engagements WHERE id = ?`,
      [Number(id)]
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
  if (!process.env.DUCKDB_PATH) {
    return NextResponse.json({ error: 'Database not configured. Set DUCKDB_PATH to enable write operations.' }, { status: 503 });
  }
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

    values.push(engagementId);
    await execute(
      `UPDATE engagements SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM engagements WHERE id = ?`,
      [engagementId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }
    return NextResponse.json(rowToEngagement(rows[0]));
  } catch (err) {
    console.error('PATCH /api/client-interactions/engagements/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update engagement' }, { status: 500 });
  }
}

// DELETE /api/client-interactions/engagements/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DUCKDB_PATH) {
    return NextResponse.json({ error: 'Database not configured. Set DUCKDB_PATH to enable write operations.' }, { status: 503 });
  }
  try {
    const { id } = await params;
    await execute(`DELETE FROM engagements WHERE id = ?`, [Number(id)]);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /api/client-interactions/engagements/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete engagement' }, { status: 500 });
  }
}

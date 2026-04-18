export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/app/lib/db';
import { buildFilterClause, rowToEngagement } from '@/app/lib/db/queries';
import { computeEngagementsList } from '@/app/lib/db/aggregations';
import { requireAuth, teamConstraint, canModify, readOnlyError } from '@/app/lib/auth/require-auth';
import { toISODate } from '@/app/lib/db/dateUtils';
import type { EngagementFilters } from '@/app/lib/api/client-interactions';
import { emitEngagementChange } from '@/app/lib/events';
import { logActivity } from '@/app/lib/activity/log';

// GET /api/client-interactions/engagements
// Query params: page, page_size, period, search, team_member, status,
//               sort_column, sort_direction, departments[], intake_types[], project_types[]
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const sc = teamConstraint(auth.payload);

  try {
    const sp = req.nextUrl.searchParams;
    const filters: EngagementFilters = {
      page: Number(sp.get('page') || 1),
      pageSize: Number(sp.get('page_size') || 50),
      period: sp.get('period') || undefined,
      search: sp.get('search') || undefined,
      teamMember: sp.get('team_member') || undefined,
      status: sp.get('status') || undefined,
      sortColumn: sp.get('sort_column') || undefined,
      sortDirection: (sp.get('sort_direction') as 'asc' | 'desc') || 'desc',
      departments: sp.getAll('departments').filter(Boolean),
      intakeTypes: sp.getAll('intake_types').filter(Boolean),
      projectTypes: sp.getAll('project_types').filter(Boolean),
    };

    const result = await computeEngagementsList(filters, sc);
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/client-interactions/engagements error:', err);
    return NextResponse.json({ error: 'Failed to fetch engagements' }, { status: 500 });
  }
}

// POST /api/client-interactions/engagements
// Body: engagement fields (camelCase)
export async function POST(req: NextRequest) {
  if (!process.env.DUCKDB_DIR) {
    return NextResponse.json({ error: 'Database not configured. Set DUCKDB_PATH to enable write operations.' }, { status: 503 });
  }
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (!canModify(auth.payload)) return readOnlyError();

  try {
    const body = await req.json();

    // Get next ID from sequence
    const seqRows = await query<Record<string, unknown>>(
      `SELECT nextval('engagements_id_seq') AS nextval`
    );
    const id = Number(seqRows[0].nextval);

    const department = body.internalClient?.gcgDepartment ?? body.department ?? '';

    await execute(
      `INSERT INTO engagements (
        id, external_client, internal_client_name, internal_client_dept,
        intake_type, ad_hoc_channel, type, team_members, department,
        date_started, date_finished, status, portfolio_logged, portfolio,
        nna, notes, tickers_mentioned, team, created_by_id, created_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.externalClient ?? null,
        body.internalClient?.name ?? null,
        body.internalClient?.gcgDepartment ?? null,
        body.intakeType,
        body.adHocChannel ?? null,
        body.type,
        JSON.stringify(body.teamMembers || []),
        department,
        toISODate(body.dateStarted),
        toISODate(body.dateFinished),
        body.status,
        body.portfolioLogged ? true : false,
        body.portfolio ? JSON.stringify(body.portfolio) : null,
        body.nna ?? null,
        body.notes ?? null,
        body.tickersMentioned ? JSON.stringify(body.tickersMentioned) : null,
        auth.payload.team,
        auth.payload.sub,
        `${auth.payload.firstName} ${auth.payload.lastName}`,
      ]
    );

    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM engagements WHERE id = ?`,
      [id]
    );

    emitEngagementChange('created');
    void logActivity(req, {
      action: 'engagement.create',
      entityType: 'engagement',
      entityId: id,
      details: {
        internalClient: body.internalClient?.name ?? null,
        department,
        intakeType: body.intakeType,
        type: body.type,
        status: body.status,
      },
    });
    return NextResponse.json(rowToEngagement(rows[0]), { status: 201 });
  } catch (err) {
    console.error('POST /api/client-interactions/engagements error:', err);
    return NextResponse.json({ error: 'Failed to create engagement' }, { status: 500 });
  }
}

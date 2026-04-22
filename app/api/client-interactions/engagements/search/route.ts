export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { requireAuth, teamConstraint } from '@/app/lib/auth/require-auth';
import { toDisplayDate } from '@/app/lib/db/dateUtils';
import type { EngagementLinkSummary } from '@/app/lib/types/engagements';

// GET /api/client-interactions/engagements/search
// Slim engagement list for the "link previous interaction" picker.
// Params: q (fuzzy), client (internal client name), excludeId, id (exact id lookup), limit
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const sc = teamConstraint(auth.payload);

  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get('q')?.trim() || '';
    const client = sp.get('client')?.trim() || '';
    const excludeId = sp.get('excludeId');
    const id = sp.get('id');
    const limit = Math.min(Number(sp.get('limit') || 20), 50);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (sc.team) {
      conditions.push('team = ?');
      params.push(sc.team);
    }

    // Exact id lookup (used to rehydrate the preview chip on form open)
    if (id) {
      const n = Number(id);
      if (Number.isFinite(n)) {
        conditions.push('id = ?');
        params.push(n);
      }
    }

    if (excludeId) {
      const n = Number(excludeId);
      if (Number.isFinite(n)) {
        conditions.push('id != ?');
        params.push(n);
      }
    }

    if (client) {
      conditions.push('internal_client_name = ?');
      params.push(client);
    }

    if (q) {
      const s = `%${q.toLowerCase()}%`;
      conditions.push(`(
        lower(external_client) LIKE ?
        OR lower(internal_client_name) LIKE ?
        OR lower(intake_type) LIKE ?
        OR lower(type) LIKE ?
        OR CAST(id AS VARCHAR) LIKE ?
      )`);
      params.push(s, s, s, s, s);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query<Record<string, unknown>>(
      `SELECT id, date_started, type, intake_type, internal_client_name, internal_client_dept, external_client
       FROM engagements
       ${where}
       ORDER BY date_started DESC, id DESC
       LIMIT ${limit}`,
      params
    );

    const results: EngagementLinkSummary[] = rows.map((row) => ({
      id: Number(row.id),
      dateStarted: toDisplayDate(row.date_started as string),
      type: row.type as string,
      intakeType: row.intake_type as string,
      internalClientName: row.internal_client_name as string,
      internalClientDept: row.internal_client_dept as string,
      externalClient: (row.external_client as string | null) ?? null,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('GET /api/client-interactions/engagements/search error:', err);
    return NextResponse.json({ error: 'Failed to search engagements' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { query } from '@/app/lib/db';
import { buildFilterClause, rowToEngagement } from '@/app/lib/db/queries';
import type { EngagementFilters } from '@/app/lib/api/client-interactions';
import type { Engagement } from '@/app/lib/types/engagements';

// GET /api/client-interactions/export
// Same query params as the engagements list route (no pagination — exports all matching rows)
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const filters: EngagementFilters = {
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

    const { whereClause, params } = buildFilterClause(filters);
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM engagements ${whereClause} ORDER BY date_started DESC`,
      params
    );

    const engagements = rows.map(r => rowToEngagement(r));
    const csv = buildCsv(engagements);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="engagements-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error('GET /api/client-interactions/export error:', err);
    return new Response('Failed to export engagements', { status: 500 });
  }
}

function buildCsv(engagements: Engagement[]): string {
  const headers = [
    'ID', 'External Client', 'Internal Client', 'Department', 'Intake Type',
    'Project Type', 'Team Members', 'Date Started', 'Date Finished', 'Status',
    'Portfolio Logged', 'NNA', 'Notes',
  ];

  const rows = engagements.map(e => [
    e.id,
    e.externalClient || '',
    e.internalClient.name,
    e.internalClient.gcgDepartment,
    e.intakeType,
    e.type,
    e.teamMembers.join('; '),
    e.dateStarted,
    e.dateFinished,
    e.status,
    e.portfolioLogged ? 'Yes' : 'No',
    e.nna != null ? formatNNA(e.nna) : '',
    e.notes || '',
  ]);

  const sanitizeCsvCell = (v: string) => /^[=+\-@]/.test(v) ? `\t${v}` : v;
  const csvLine = (cells: unknown[]) =>
    cells.map(c => `"${sanitizeCsvCell(String(c)).replace(/"/g, '""')}"`).join(',');

  return [headers.join(','), ...rows.map(csvLine)].join('\n');
}

function formatNNA(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { query } from '@/app/lib/db';
import { buildFilterClause } from '@/app/lib/db/queries';
import { requireAuth, teamConstraint } from '@/app/lib/auth/require-auth';
import type { EngagementFilters } from '@/app/lib/api/client-interactions';

// GET /api/client-interactions/export
// Same query params as the engagements list route (no pagination — exports all matching rows)
// Returns an .xlsx file in the same 13-column format as the bulk upload template
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const sc = teamConstraint(auth.payload);

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

    const { whereClause, params } = buildFilterClause(filters, 'e', sc);
    const EXPORT_ROW_LIMIT = 10_000;
    const rows = await query<Record<string, unknown>>(
      `SELECT e.*,
         (SELECT string_agg(n.note_text, ' | ' ORDER BY n.created_at ASC)
          FROM engagement_notes n
          WHERE n.engagement_id = e.id) AS notes_agg
       FROM engagements e ${whereClause} ORDER BY e.date_started DESC LIMIT ${EXPORT_ROW_LIMIT}`,
      params
    );

    const buffer = await buildXlsx(rows);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="engagements-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('GET /api/client-interactions/export error:', err);
    return new NextResponse('Failed to export engagements', { status: 500 });
  }
}

async function buildXlsx(rows: Record<string, unknown>[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Engagements');

  // 13 columns — same order and keys as the bulk upload template
  // No `header` property here: header row is added manually below to prevent
  // ExcelJS from bleeding row-level styling beyond the last column.
  sheet.columns = [
    { key: 'externalClient',     width: 24 },
    { key: 'internalClientName', width: 24 },
    { key: 'internalClientDept', width: 22 },
    { key: 'intakeType',          width: 16 },
    { key: 'adHocChannel',        width: 16 },
    { key: 'type',                width: 16 },
    { key: 'teamMembers',         width: 30 },
    { key: 'dateStarted',         width: 14 },
    { key: 'dateFinished',        width: 14 },
    { key: 'status',              width: 14 },
    { key: 'nna',                 width: 12 },
    { key: 'notes',               width: 40 },
    { key: 'tickersMentioned',    width: 30 },
  ];

  // Add header row manually and style only the 13 populated cells.
  // eachCell({ includeEmpty: false }) ensures nothing beyond column M is touched.
  const headerRow = sheet.addRow([
    'External Client', 'Internal Client Name', 'Internal Client Dept',
    'Intake Type', 'Ad-Hoc Channel', 'Project Type', 'Team Members',
    'Date Started', 'Date Finished', 'Status', 'NNA ($M)', 'Notes', 'Tickers Mentioned',
  ]);
  headerRow.height = 20;
  headerRow.eachCell({ includeEmpty: false }, cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { vertical: 'middle' };
  });

  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Map raw DB rows directly (avoids display-format date conversion)
  for (const row of rows) {
    const teamMembers = JSON.parse((row.team_members as string) || '[]') as string[];
    const tickers = JSON.parse((row.tickers_mentioned as string) || '[]') as string[];
    const nnaRaw = row.nna as number | null;

    sheet.addRow({
      externalClient:     (row.external_client as string) || '',
      internalClientName: row.internal_client_name as string,
      internalClientDept: row.internal_client_dept as string,
      intakeType:         row.intake_type as string,
      adHocChannel:       (row.ad_hoc_channel as string) || '',
      type:               row.type as string,
      teamMembers:        teamMembers.join(', '),
      dateStarted:        row.date_started as string,
      dateFinished:       (row.date_finished as string) || '',
      status:             row.status as string,
      nna:                nnaRaw != null ? nnaRaw / 1_000_000 : '',
      notes:              (row.notes_agg as string) || (row.notes as string) || '',
      tickersMentioned:   tickers.join(', '),
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

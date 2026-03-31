/**
 * Server-side aggregation functions for the Client Interactions dashboard.
 *
 * DATA SOURCE:
 * - If DUCKDB_DIR env var is set → query DuckDB (real data)
 * - If DUCKDB_DIR is not set    → return mock data (development/demo)
 */
import { query } from './index';
import {
  getMockMetrics,
  getMockDepartmentBreakdown,
  getMockContributionData,
  getMockEngagementsList,
  getMockFilterOptions,
} from '../api/mock-computations';
import { buildFilterClause, rowToEngagement, SORT_COLUMN_MAP } from './queries';
import type { ServerConstraints } from './queries';
import { getPreviousPeriodDates, getPeriodStartISO } from './dateUtils';
import type { EngagementFilters, DashboardMetrics, DepartmentBreakdown, ContributionDataResponse, EngagementsResponse, FilterOptions } from '../api/client-interactions';
import type { DayData } from '../types/engagements';

// Static filter options — these don't change dynamically in this application
export const STATIC_FILTER_OPTIONS: FilterOptions = {
  teamMembers: ['All Team Members', 'Austin Office', 'Charlotte Office'],
  teamMemberGroups: [
    { label: 'Office', options: ['Austin Office', 'Charlotte Office'] },
  ],
  departments: ['Broker-Dealer', 'IAG', 'Institutional'],
  intakeTypes: ['IRQ', 'SRRF', 'GCG Ad-Hoc'],
  projectTypes: ['Data Request', 'Meeting', 'Other', 'PCR'],
  statuses: ['In Progress', 'Awaiting Meeting', 'Follow Up', 'Completed'],
};

// =============================================================================
// METRICS
// =============================================================================

export async function computeMetrics(filters: EngagementFilters, serverConstraints: ServerConstraints = {}): Promise<DashboardMetrics> {
  if (!process.env.DUCKDB_DIR) return getMockMetrics(filters);

  const period = filters.period || '1Y';
  const prevDates = getPreviousPeriodDates(period);
  const { whereClause: currWhere, params: currParams } = buildFilterClause({ ...filters, period }, '', serverConstraints);

  // ---- Build all WHERE clauses before firing queries in parallel ----

  // Previous period
  const prevFilters = { ...filters, period: undefined };
  const { whereClause: baseWhere, params: baseParams } = buildFilterClause(prevFilters, '', serverConstraints);
  const prevAndClause = baseWhere
    ? `${baseWhere} AND date_started >= ? AND date_started <= ?`
    : `WHERE date_started >= ? AND date_started <= ?`;
  const prevParams = [...baseParams, prevDates.start, prevDates.end];

  // In-progress count + sparkline (share the same base filter)
  const inProgressFilters = { ...filters, status: undefined };
  const { whereClause: ipWhere, params: ipParams } = buildFilterClause(inProgressFilters, '', serverConstraints);
  const inProgressAndClause = ipWhere
    ? `${ipWhere} AND status = 'In Progress'`
    : `WHERE status = 'In Progress'`;
  const sparklineAndClause = ipWhere
    ? `${ipWhere} AND date_started >= (CURRENT_DATE - INTERVAL '8 weeks')`
    : `WHERE date_started >= (CURRENT_DATE - INTERVAL '8 weeks')`;

  // ---- Fire all 4 queries in parallel — none depends on another's result ----
  const [projectRows, prevRows, inProgressRows, sparklineRows] = await Promise.all([
    // Current period: client projects (IRQ/SRRF non-PCR) + GCG Ad-Hoc
    query<Record<string, unknown>>(`
      SELECT
        COUNT(*) FILTER (WHERE intake_type IN ('IRQ', 'SRRF') AND type != 'PCR')  AS project_count,
        COUNT(*) FILTER (WHERE intake_type = 'IRQ'  AND type != 'PCR')            AS irq_count,
        COUNT(*) FILTER (WHERE intake_type = 'SRRF' AND type != 'PCR')            AS srrf_count,
        COUNT(*) FILTER (WHERE intake_type IN ('IRQ', 'SRRF') AND type != 'PCR')  AS eligible_count,
        COUNT(*) FILTER (WHERE intake_type IN ('IRQ', 'SRRF') AND type != 'PCR'
                           AND portfolio_logged = TRUE)                            AS portfolios_logged,
        COUNT(*) FILTER (WHERE intake_type = 'GCG Ad-Hoc')                        AS adhoc_count,
        COUNT(*) FILTER (WHERE intake_type = 'GCG Ad-Hoc' AND ad_hoc_channel = 'In-Person') AS adhoc_in_person,
        COUNT(*) FILTER (WHERE intake_type = 'GCG Ad-Hoc' AND ad_hoc_channel = 'Email')     AS adhoc_email,
        COUNT(*) FILTER (WHERE intake_type = 'GCG Ad-Hoc' AND ad_hoc_channel = 'Teams')     AS adhoc_teams,
        COALESCE(SUM(nna), 0)                                                     AS total_nna,
        COUNT(*) FILTER (WHERE nna > 0)                                           AS nna_project_count,
        COUNT(*) FILTER (WHERE nna > 0 AND nna < 50000000)                        AS nna_tier1,
        COUNT(*) FILTER (WHERE nna > 0 AND nna >= 50000000  AND nna < 200000000)  AS nna_tier2,
        COUNT(*) FILTER (WHERE nna > 0 AND nna >= 200000000)                      AS nna_tier3
      FROM engagements ${currWhere}
    `, currParams),
    // Previous period: for change% calculations
    query<Record<string, unknown>>(`
      SELECT
        COUNT(*) FILTER (WHERE intake_type IN ('IRQ', 'SRRF') AND type != 'PCR') AS prev_projects,
        COUNT(*) FILTER (WHERE intake_type = 'GCG Ad-Hoc')                       AS prev_adhoc,
        COALESCE(SUM(nna), 0)                                                    AS prev_nna
      FROM engagements ${prevAndClause}
    `, prevParams),
    // In-progress count (respects all active filters except status)
    query<Record<string, unknown>>(`
      SELECT COUNT(*) AS count FROM engagements ${inProgressAndClause}
    `, ipParams),
    // Weekly in-progress sparkline (last 8 weeks, same filters)
    query<Record<string, unknown>>(`
      SELECT
        strftime(date_started, '%Y-W%W') AS week_key,
        COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress_count
      FROM engagements ${sparklineAndClause}
      GROUP BY week_key
      ORDER BY week_key
    `, ipParams),
  ]);

  // -------------------------------------------------------------------------
  // Compute metrics from query results
  // -------------------------------------------------------------------------
  const p = projectRows[0];
  const prev = prevRows[0];
  const inProgressCount = Number(inProgressRows[0]?.count ?? 0);

  const projectCount = Number(p?.project_count ?? 0);
  const prevProjects = Number(prev?.prev_projects ?? 0);
  const projectChangePercent = prevProjects > 0
    ? Math.round(((projectCount - prevProjects) / prevProjects) * 100)
    : projectCount > 0 ? 100 : 0;

  const irqCount = Number(p?.irq_count ?? 0);
  const srrfCount = Number(p?.srrf_count ?? 0);
  const eligibleCount = Number(p?.eligible_count ?? 0);
  const portfoliosLogged = Number(p?.portfolios_logged ?? 0);
  const totalProjects = irqCount + srrfCount;

  const adhocCount = Number(p?.adhoc_count ?? 0);
  const prevAdhoc = Number(prev?.prev_adhoc ?? 0);
  const adhocChangePercent = prevAdhoc > 0
    ? Math.round(((adhocCount - prevAdhoc) / prevAdhoc) * 100)
    : adhocCount > 0 ? 100 : 0;

  const adhocInPerson = Number(p?.adhoc_in_person ?? 0);
  const adhocEmail = Number(p?.adhoc_email ?? 0);
  const adhocTeams = Number(p?.adhoc_teams ?? 0);

  const totalNNA = Number(p?.total_nna ?? 0);
  const nnaProjectCount = Number(p?.nna_project_count ?? 0);
  const prevNNA = Number(prev?.prev_nna ?? 0);
  const nnaChangePercent = prevNNA > 0
    ? Math.round(((totalNNA - prevNNA) / prevNNA) * 100)
    : totalNNA > 0 ? 100 : 0;

  // Build sparkline: weekly in-progress start counts, gap-filled with 0
  const sparklineValues = sparklineRows.map(r => ({ value: Number(r.in_progress_count ?? 0) }));
  while (sparklineValues.length < 8) {
    sparklineValues.unshift({ value: 0 });
  }
  const inProgressChange = sparklineValues.length >= 2
    ? sparklineValues[sparklineValues.length - 1].value - sparklineValues[sparklineValues.length - 2].value
    : 0;

  const INTAKE_COLORS: Record<string, string> = {
    'In-Person': '#a5f3fc',
    'Email': '#22d3ee',
    'Teams': '#0e7490',
  };

  return {
    clientProjects: {
      count: projectCount,
      changePercent: projectChangePercent,
      periodLabel: prevDates.label,
      intakeSourceBreakdown: {
        irqCount,
        irqPercent: totalProjects > 0 ? Math.round((irqCount / totalProjects) * 100) : 0,
        srrfCount,
        srrfPercent: totalProjects > 0 ? Math.round((srrfCount / totalProjects) * 100) : 0,
        portfoliosLogged,
        portfoliosTotal: eligibleCount,
        portfoliosPercent: eligibleCount > 0 ? Math.round((portfoliosLogged / eligibleCount) * 100) : 0,
      },
    },
    gcgAdHoc: {
      count: adhocCount,
      changePercent: adhocChangePercent,
      periodLabel: prevDates.label,
      intakeBreakdown: [
        { intake: 'In-Person', count: adhocInPerson, percent: adhocCount > 0 ? Math.round((adhocInPerson / adhocCount) * 100) : 0, color: INTAKE_COLORS['In-Person'] },
        { intake: 'Email', count: adhocEmail, percent: adhocCount > 0 ? Math.round((adhocEmail / adhocCount) * 100) : 0, color: INTAKE_COLORS['Email'] },
        { intake: 'Teams', count: adhocTeams, percent: adhocCount > 0 ? Math.round((adhocTeams / adhocCount) * 100) : 0, color: INTAKE_COLORS['Teams'] },
      ],
    },
    inProgress: {
      count: inProgressCount,
      change: inProgressChange,
      sparklineData: sparklineValues,
    },
    nna: {
      total: totalNNA,
      projectCount: nnaProjectCount,
      changePercent: nnaChangePercent,
      tiers: [
        { label: '<$50M', count: Number(p?.nna_tier1 ?? 0), color: '#0e7490' },
        { label: '$50-200M', count: Number(p?.nna_tier2 ?? 0), color: '#22d3ee' },
        { label: '$200M+', count: Number(p?.nna_tier3 ?? 0), color: '#39FF14' },
      ],
    },
  };
}

// =============================================================================
// DEPARTMENT BREAKDOWN
// =============================================================================

export async function computeDepartmentBreakdown(filters: EngagementFilters, serverConstraints: ServerConstraints = {}): Promise<DepartmentBreakdown> {
  if (!process.env.DUCKDB_DIR) return getMockDepartmentBreakdown(filters);

  const { whereClause, params } = buildFilterClause(filters, '', serverConstraints);

  const rows = await query<Record<string, unknown>>(`
    SELECT internal_client_dept AS dept, COUNT(*) AS cnt
    FROM engagements ${whereClause}
    GROUP BY internal_client_dept
  `, params);

  const DEPT_COLORS: Record<string, string> = {
    IAG: '#a5f3fc',
    'Broker-Dealer': '#22d3ee',
    Institutional: '#0e7490',
  };

  const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
  const safeTotal = total || 1;

  // Ensure all three departments appear even if count is 0
  const deptMap: Record<string, number> = { IAG: 0, 'Broker-Dealer': 0, Institutional: 0 };
  rows.forEach(r => {
    const dept = r.dept as string;
    deptMap[dept] = Number(r.cnt);
  });

  return {
    departments: Object.entries(deptMap).map(([name, count]) => ({
      name,
      value: Math.round((count / safeTotal) * 100),
      count,
      color: DEPT_COLORS[name] || '#71717a',
    })),
    total,
  };
}

// =============================================================================
// CONTRIBUTION (HEATMAP) DATA
// =============================================================================

export async function computeContributionData(filters: EngagementFilters, serverConstraints: ServerConstraints = {}): Promise<ContributionDataResponse> {
  if (!process.env.DUCKDB_DIR) return getMockContributionData(filters);

  // Apply all filters EXCEPT period — heatmap always shows a rolling 104-week window
  const heatmapFilters = { ...filters, period: undefined };
  const { whereClause, params } = buildFilterClause(heatmapFilters, '', serverConstraints);

  const heatmapStart = new Date();
  heatmapStart.setDate(heatmapStart.getDate() - 104 * 7);
  const heatmapStartISO = heatmapStart.toISOString().split('T')[0];

  const dateFilter = whereClause
    ? `${whereClause} AND date_finished IS NOT NULL AND date_finished >= ?`
    : `WHERE date_finished IS NOT NULL AND date_finished >= ?`;

  const rows = await query<Record<string, unknown>>(`
    SELECT
      CAST(date_finished AS VARCHAR) AS finish_date,
      COUNT(*) FILTER (WHERE intake_type != 'GCG Ad-Hoc') AS project_count,
      COUNT(*) FILTER (WHERE intake_type = 'GCG Ad-Hoc')  AS ad_hoc_count
    FROM engagements ${dateFilter}
    GROUP BY CAST(date_finished AS VARCHAR)
    ORDER BY finish_date
  `, [...params, heatmapStartISO]);

  // Build a lookup map from ISO date string to counts
  const completionsByDate = new Map<string, { projects: number; adHoc: number }>();
  for (const row of rows) {
    const dateStr = (row.finish_date as string).split('T')[0]; // strip any time component
    completionsByDate.set(dateStr, {
      projects: Number(row.project_count ?? 0),
      adHoc: Number(row.ad_hoc_count ?? 0),
    });
  }

  // Build 104-week weekday grid (same logic as existing generateContributionData)
  const startDate = new Date(heatmapStartISO + 'T00:00:00');
  // Align to nearest Monday on or after startDate
  const dayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? 1 : dayOfWeek === 6 ? 2 : 1 - dayOfWeek;
  const anchorMonday = new Date(startDate);
  anchorMonday.setDate(startDate.getDate() + mondayOffset);

  const weeks: DayData[][] = [];
  let maxCount = 0;
  let totalDays = 0;

  for (let week = 0; week < 105; week++) {
    const days: DayData[] = [];
    for (let day = 0; day < 5; day++) {
      const d = new Date(anchorMonday);
      d.setDate(anchorMonday.getDate() + week * 7 + day);
      const key = d.toISOString().split('T')[0];
      const completions = completionsByDate.get(key) ?? { projects: 0, adHoc: 0 };
      const totalCount = completions.projects + completions.adHoc;

      let level: number;
      if (totalCount === 0) level = 0;
      else if (totalCount === 1) level = 1;
      else if (totalCount === 2) level = 2;
      else if (totalCount <= 4) level = 3;
      else level = 4;

      if (totalCount > maxCount) maxCount = totalCount;
      totalDays++;

      days.push({
        date: d,
        level,
        count: totalCount,
        projectCount: completions.projects,
        adHocCount: completions.adHoc,
      });
    }
    weeks.push(days);
  }

  return { weeks, totalDays, maxCount };
}

// =============================================================================
// ENGAGEMENTS LIST (paginated)
// =============================================================================

export async function computeEngagementsList(filters: EngagementFilters, serverConstraints: ServerConstraints = {}): Promise<EngagementsResponse> {
  if (!process.env.DUCKDB_DIR) return getMockEngagementsList(filters);

  const { whereClause, params } = buildFilterClause(filters, '', serverConstraints);
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const offset = (page - 1) * pageSize;

  const sortCol = SORT_COLUMN_MAP[filters.sortColumn || ''] || 'date_started';
  const sortDir = filters.sortDirection === 'asc' ? 'ASC' : 'DESC';

  const [countRows, dataRows] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT COUNT(*) AS total FROM engagements ${whereClause}`,
      params
    ),
    query<Record<string, unknown>>(
      `SELECT *,
         (SELECT COUNT(*) FROM engagement_notes WHERE engagement_id = engagements.id) AS note_count
       FROM engagements ${whereClause}
       ORDER BY ${sortCol} ${sortDir} NULLS LAST
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ),
  ]);

  const total = Number(countRows[0]?.total ?? 0);

  return {
    engagements: dataRows.map(r => rowToEngagement(r)),
    total,
    page,
    pageSize,
    hasMore: offset + pageSize < total,
  };
}

// =============================================================================
// PERIOD START HELPER (re-export for routes)
// =============================================================================
export { getPeriodStartISO };

/**
 * Server-side aggregation functions for the KPI dashboard.
 *
 * Scope model: 'all' (cross-team aggregate) or 'team:<name>' (single team
 * aggregate). There is no individual-level attribution anywhere in this
 * module — team privacy is a hard constraint.
 *
 * DATA SOURCE:
 * - If DUCKDB_DIR is set → queries DuckDB.
 * - Otherwise returns empty/zero stubs (dev-without-db mode).
 */
import { query } from './index';
import type { ServerConstraints } from './queries';
import { getPeriodStartISO, getPreviousPeriodDates } from './dateUtils';
import { SQL_COMPLETED, SQL_OPEN } from '../statusHelpers';
import type {
  KpiFilters,
  HeroKpis,
  JourneySankeyData,
  JourneyTemplate,
  GcgDeptRow,
  NnaConcentration,
  ActivityHeatmap,
  ActivityHeatmapCell,
  InProgressTrendPoint,
  IntakeYieldRow,
  AdHocChannelRow,
  StaleEngagement,
  DormantClient,
} from '../api/kpi';

// =============================================================================
// SHARED HELPERS
// =============================================================================

type SqlClause = { whereClause: string; params: unknown[] };

/**
 * Builds a WHERE clause for KPI queries. Unlike buildFilterClause in
 * queries.ts, this is self-contained and only handles the KPI filter shape.
 *
 * `periodOverride` lets callers skip the period filter (e.g. for dormant-
 * client lookups where period is inherent to the metric's definition).
 */
function buildKpiWhere(
  filters: KpiFilters,
  constraints: ServerConstraints,
  opts: { includePeriod?: boolean; tableAlias?: string } = {}
): SqlClause {
  const { includePeriod = true, tableAlias } = opts;
  const col = (c: string) => (tableAlias ? `${tableAlias}.${c}` : c);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (constraints.team) {
    conditions.push(`${col('team')} = ?`);
    params.push(constraints.team);
  }

  if (includePeriod && filters.period) {
    const startISO = getPeriodStartISO(filters.period);
    if (startISO) {
      conditions.push(`${col('date_started')} >= ?`);
      params.push(startISO);
    }
  }

  if (filters.gcgDepts && filters.gcgDepts.length > 0) {
    const placeholders = filters.gcgDepts.map(() => '?').join(', ');
    conditions.push(`${col('internal_client_dept')} IN (${placeholders})`);
    params.push(...filters.gcgDepts);
  }

  if (filters.intakeTypes && filters.intakeTypes.length > 0) {
    const placeholders = filters.intakeTypes.map(() => '?').join(', ');
    conditions.push(`${col('intake_type')} IN (${placeholders})`);
    params.push(...filters.intakeTypes);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

function hasDb(): boolean {
  return Boolean(process.env.DUCKDB_DIR);
}

function pct(num: number, denom: number): number {
  if (!denom) return 0;
  return Math.round((num / denom) * 1000) / 10;
}

function deltaPercent(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 100);
}

// =============================================================================
// 1. HERO KPIs
// =============================================================================

export async function computeHeroKpis(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<HeroKpis> {
  const periodLabel = getPreviousPeriodDates(filters.period || '1Y').label;

  if (!hasDb()) {
    return {
      interactions: { value: 0, deltaPercent: 0 },
      inProgress: { value: 0, deltaPercent: 0 },
      nna: { value: 0, deltaPercent: 0 },
      avgNnaPerInteraction: { value: 0, deltaPercent: 0 },
      completionRate: { value: 0, deltaPercent: 0 },
      zeroNnaRate: { value: 0, deltaPercent: 0 },
      periodLabel,
    };
  }

  // Current period
  const curr = buildKpiWhere(filters, constraints);

  // Previous period — same filters but with the prior period's date range
  const prev = buildKpiWhere(filters, constraints, { includePeriod: false });
  const prevDates = getPreviousPeriodDates(filters.period || '1Y');
  const prevWhere = prev.whereClause
    ? `${prev.whereClause} AND date_started >= ? AND date_started <= ?`
    : 'WHERE date_started >= ? AND date_started <= ?';
  const prevParams = [...prev.params, prevDates.start, prevDates.end];

  const [currRows, prevRows] = await Promise.all([
    query<Record<string, unknown>>(
      `
        SELECT
          COUNT(*)                                                          AS interactions,
          COUNT(*) FILTER (WHERE ${SQL_OPEN})                               AS in_progress,
          COALESCE(SUM(nna), 0)                                             AS total_nna,
          COUNT(*) FILTER (WHERE ${SQL_COMPLETED})                          AS completed,
          COUNT(*) FILTER (WHERE status = 'Completed')                      AS strict_completed,
          COUNT(*) FILTER (WHERE status = 'Completed' AND (nna IS NULL OR nna = 0)) AS zero_nna
        FROM engagements
        ${curr.whereClause}
      `,
      curr.params
    ),
    query<Record<string, unknown>>(
      `
        SELECT
          COUNT(*)                                                          AS interactions,
          COUNT(*) FILTER (WHERE ${SQL_OPEN})                               AS in_progress,
          COALESCE(SUM(nna), 0)                                             AS total_nna,
          COUNT(*) FILTER (WHERE ${SQL_COMPLETED})                          AS completed,
          COUNT(*) FILTER (WHERE status = 'Completed')                      AS strict_completed,
          COUNT(*) FILTER (WHERE status = 'Completed' AND (nna IS NULL OR nna = 0)) AS zero_nna
        FROM engagements
        ${prevWhere}
      `,
      prevParams
    ),
  ]);

  const c = currRows[0] ?? {};
  const p = prevRows[0] ?? {};

  const currInteractions = Number(c.interactions ?? 0);
  const prevInteractions = Number(p.interactions ?? 0);
  const currInProgress = Number(c.in_progress ?? 0);
  const prevInProgress = Number(p.in_progress ?? 0);
  const currNna = Number(c.total_nna ?? 0);
  const prevNna = Number(p.total_nna ?? 0);
  const currCompleted = Number(c.completed ?? 0);
  const prevCompleted = Number(p.completed ?? 0);
  const currStrictCompleted = Number(c.strict_completed ?? 0);
  const prevStrictCompleted = Number(p.strict_completed ?? 0);
  const currZeroNna = Number(c.zero_nna ?? 0);
  const prevZeroNna = Number(p.zero_nna ?? 0);

  const currAvgNna = currInteractions > 0 ? currNna / currInteractions : 0;
  const prevAvgNna = prevInteractions > 0 ? prevNna / prevInteractions : 0;

  const currCompletionRate = pct(currCompleted, currInteractions);
  const prevCompletionRate = pct(prevCompleted, prevInteractions);

  const currZeroNnaRate = pct(currZeroNna, currStrictCompleted);
  const prevZeroNnaRate = pct(prevZeroNna, prevStrictCompleted);

  return {
    interactions: { value: currInteractions, deltaPercent: deltaPercent(currInteractions, prevInteractions) },
    inProgress: { value: currInProgress, deltaPercent: deltaPercent(currInProgress, prevInProgress) },
    nna: { value: currNna, deltaPercent: deltaPercent(currNna, prevNna) },
    avgNnaPerInteraction: { value: Math.round(currAvgNna), deltaPercent: deltaPercent(currAvgNna, prevAvgNna) },
    completionRate: { value: currCompletionRate, deltaPercent: Math.round(currCompletionRate - prevCompletionRate) },
    zeroNnaRate: { value: currZeroNnaRate, deltaPercent: Math.round(currZeroNnaRate - prevZeroNnaRate) },
    periodLabel,
  };
}

// =============================================================================
// 2a. JOURNEY SANKEY (Intake Type → Project Type → Outcome)
// =============================================================================

export async function computeJourneySankey(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<JourneySankeyData> {
  if (!hasDb()) return { nodes: [], links: [] };

  const { whereClause, params } = buildKpiWhere(filters, constraints);

  const outcomeExpr = `
    CASE
      WHEN ${SQL_COMPLETED} AND nna IS NOT NULL AND nna > 0 THEN 'Completed w/ NNA'
      WHEN ${SQL_COMPLETED} THEN 'Completed no NNA'
      WHEN NOT (${SQL_COMPLETED}) AND date_started < CURRENT_DATE - INTERVAL '60 days' THEN 'Stalled'
      ELSE 'Still Open'
    END
  `;

  const [intakeToType, typeToOutcome] = await Promise.all([
    query<Record<string, unknown>>(
      `
        SELECT intake_type AS src, type AS tgt, COUNT(*) AS cnt
        FROM engagements
        ${whereClause}
        GROUP BY intake_type, type
      `,
      params
    ),
    query<Record<string, unknown>>(
      `
        SELECT type AS src, ${outcomeExpr} AS tgt, COUNT(*) AS cnt
        FROM engagements
        ${whereClause}
        GROUP BY type, tgt
      `,
      params
    ),
  ]);

  // Build dedup node index with stable kind labels for coloring
  const nodeIndex = new Map<string, number>();
  const nodes: JourneySankeyData['nodes'] = [];
  const addNode = (name: string, kind: 'intake' | 'project' | 'outcome'): number => {
    const key = `${kind}|${name}`;
    const existing = nodeIndex.get(key);
    if (existing !== undefined) return existing;
    const idx = nodes.length;
    nodes.push({ name, kind });
    nodeIndex.set(key, idx);
    return idx;
  };

  const links: JourneySankeyData['links'] = [];
  for (const r of intakeToType) {
    const src = String(r.src ?? '');
    const tgt = String(r.tgt ?? '');
    const value = Number(r.cnt ?? 0);
    if (!src || !tgt || value <= 0) continue;
    links.push({ source: addNode(src, 'intake'), target: addNode(tgt, 'project'), value });
  }
  for (const r of typeToOutcome) {
    const src = String(r.src ?? '');
    const tgt = String(r.tgt ?? '');
    const value = Number(r.cnt ?? 0);
    if (!src || !tgt || value <= 0) continue;
    links.push({ source: addNode(src, 'project'), target: addNode(tgt, 'outcome'), value });
  }

  return { nodes, links };
}

// =============================================================================
// 2b. JOURNEY TEMPLATES (recursive walk over linked_from_id)
// =============================================================================

export async function computeJourneyTemplates(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<JourneyTemplate[]> {
  if (!hasDb()) return [];

  const { whereClause, params } = buildKpiWhere(filters, constraints, { tableAlias: 'e' });
  const rootAndExtras = whereClause
    ? `AND ${whereClause.slice(6)}` // strip leading "WHERE "
    : '';

  const rows = await query<Record<string, unknown>>(
    `
      WITH RECURSIVE journey AS (
        SELECT
          e.id                     AS root_id,
          e.id                     AS id,
          e.intake_type            AS intake_type,
          CAST(e.type AS VARCHAR)  AS path,
          e.type                   AS leaf_type,
          e.status                 AS leaf_status,
          e.nna                    AS leaf_nna,
          e.date_started           AS leaf_started,
          e.date_finished          AS leaf_finished,
          0                        AS depth
        FROM engagements e
        WHERE e.linked_from_id IS NULL
          ${rootAndExtras}

        UNION ALL

        SELECT
          j.root_id,
          c.id,
          j.intake_type,
          j.path || ' → ' || c.type AS path,
          c.type,
          c.status,
          c.nna,
          c.date_started,
          c.date_finished,
          j.depth + 1
        FROM engagements c
        JOIN journey j ON c.linked_from_id = j.id
        WHERE j.depth < 6
      ),
      terminal AS (
        -- For each root, take the deepest leaf as the signature's endpoint
        SELECT root_id, intake_type, path, leaf_status, leaf_nna, leaf_started, leaf_finished, depth,
               ROW_NUMBER() OVER (PARTITION BY root_id ORDER BY depth DESC) AS rn
        FROM journey
      )
      SELECT
        intake_type || ' → ' || path || ' → ' ||
          CASE
            WHEN leaf_status IN ('Completed', 'Follow Up') AND leaf_nna IS NOT NULL AND leaf_nna > 0 THEN 'Completed w/ NNA'
            WHEN leaf_status IN ('Completed', 'Follow Up') THEN 'Completed no NNA'
            WHEN leaf_status NOT IN ('Completed', 'Follow Up') AND leaf_started < CURRENT_DATE - INTERVAL '60 days' THEN 'Stalled'
            ELSE 'Still Open'
          END AS signature,
        COUNT(*) AS journeys,
        AVG(CAST(leaf_nna AS DOUBLE)) AS avg_nna,
        AVG(CAST(leaf_finished - leaf_started AS DOUBLE)) AS avg_days,
        COUNT(*) FILTER (WHERE leaf_status IN ('Completed', 'Follow Up')) AS completed_count
      FROM terminal
      WHERE rn = 1
      GROUP BY signature
      ORDER BY journeys DESC
      LIMIT 10
    `,
    params
  );

  const totalJourneys = rows.reduce((s, r) => s + Number(r.journeys ?? 0), 0);
  return rows.map(r => {
    const count = Number(r.journeys ?? 0);
    const completed = Number(r.completed_count ?? 0);
    const avgDays = r.avg_days != null ? Math.round(Number(r.avg_days)) : null;
    return {
      signature: String(r.signature ?? ''),
      count,
      percentOfTotal: pct(count, totalJourneys),
      avgNna: Math.round(Number(r.avg_nna ?? 0)),
      avgDays,
      completionRate: pct(completed, count),
    };
  });
}

// =============================================================================
// 3a. GCG DEPT BREAKDOWN
// =============================================================================

export async function computeGcgDeptBreakdown(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<GcgDeptRow[]> {
  if (!hasDb()) return [];
  const { whereClause, params } = buildKpiWhere(filters, constraints);

  const rows = await query<Record<string, unknown>>(
    `
      SELECT
        internal_client_dept  AS dept,
        COUNT(*)              AS interactions,
        COALESCE(SUM(nna), 0) AS total_nna
      FROM engagements
      ${whereClause}
      GROUP BY internal_client_dept
      ORDER BY interactions DESC
    `,
    params
  );

  return rows.map(r => {
    const interactions = Number(r.interactions ?? 0);
    const nna = Number(r.total_nna ?? 0);
    return {
      dept: String(r.dept ?? ''),
      interactions,
      nna,
      nnaPerInteraction: interactions > 0 ? Math.round(nna / interactions) : 0,
    };
  });
}

// =============================================================================
// 3b. NNA CONCENTRATION (Pareto)
// =============================================================================

export async function computeNnaConcentration(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<NnaConcentration> {
  if (!hasDb()) {
    return { totalNna: 0, clients: [], top5Share: 0, clientsForEightyPercent: 0 };
  }
  const { whereClause, params } = buildKpiWhere(filters, constraints);

  const rows = await query<Record<string, unknown>>(
    `
      SELECT
        internal_client_name AS client,
        internal_client_dept AS dept,
        COALESCE(SUM(nna), 0) AS total_nna
      FROM engagements
      ${whereClause
        ? `${whereClause} AND nna IS NOT NULL AND nna > 0`
        : `WHERE nna IS NOT NULL AND nna > 0`}
      GROUP BY internal_client_name, internal_client_dept
      ORDER BY total_nna DESC
      LIMIT 15
    `,
    params
  );

  const totalNna = rows.reduce((s, r) => s + Number(r.total_nna ?? 0), 0);
  let cumulative = 0;
  const clients = rows.map((r, i) => {
    const nna = Number(r.total_nna ?? 0);
    cumulative += nna;
    return {
      rank: i + 1,
      clientName: String(r.client ?? ''),
      gcgDept: String(r.dept ?? ''),
      nna,
      cumulativeShare: pct(cumulative, totalNna),
    };
  });

  const top5 = clients.slice(0, 5).reduce((s, c) => s + c.nna, 0);
  const eightyPercentMark = clients.findIndex(c => c.cumulativeShare >= 80);

  return {
    totalNna,
    clients,
    top5Share: pct(top5, totalNna),
    clientsForEightyPercent: eightyPercentMark >= 0 ? eightyPercentMark + 1 : clients.length,
  };
}

// =============================================================================
// 4a. ACTIVITY HEATMAP (day-of-week × week grid, started-based)
// =============================================================================

export async function computeActivityHeatmap(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<ActivityHeatmap> {
  if (!hasDb()) return { weeks: [], totalDays: 0, maxCount: 0 };

  // Rolling 52-week window of started dates, irrespective of period filter
  const { whereClause, params } = buildKpiWhere(filters, constraints, { includePeriod: false });
  const heatmapStart = new Date();
  heatmapStart.setDate(heatmapStart.getDate() - 52 * 7);
  const heatmapStartISO = heatmapStart.toISOString().split('T')[0];

  const dateFilter = whereClause
    ? `${whereClause} AND date_started >= ?`
    : 'WHERE date_started >= ?';

  const rows = await query<Record<string, unknown>>(
    `
      SELECT CAST(date_started AS VARCHAR) AS d, COUNT(*) AS cnt
      FROM engagements
      ${dateFilter}
      GROUP BY CAST(date_started AS VARCHAR)
      ORDER BY d
    `,
    [...params, heatmapStartISO]
  );

  const byDate = new Map<string, number>();
  for (const r of rows) {
    const key = String(r.d ?? '').split('T')[0];
    byDate.set(key, Number(r.cnt ?? 0));
  }

  // Align to nearest Monday on or after start
  const start = new Date(heatmapStartISO + 'T00:00:00');
  const dow = start.getDay();
  const mondayOffset = dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow;
  const anchor = new Date(start);
  anchor.setDate(start.getDate() + mondayOffset);

  const weeks: ActivityHeatmapCell[][] = [];
  let maxCount = 0;
  let totalDays = 0;

  for (let w = 0; w < 53; w++) {
    const days: ActivityHeatmapCell[] = [];
    for (let d = 0; d < 5; d++) {
      const cell = new Date(anchor);
      cell.setDate(anchor.getDate() + w * 7 + d);
      const key = cell.toISOString().split('T')[0];
      const count = byDate.get(key) ?? 0;
      let level: ActivityHeatmapCell['level'] = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count <= 4) level = 3;
      else if (count > 4) level = 4;
      if (count > maxCount) maxCount = count;
      totalDays++;
      days.push({ date: key, count, level });
    }
    weeks.push(days);
  }

  return { weeks, totalDays, maxCount };
}

// =============================================================================
// 4b. IN-PROGRESS TREND (weekly new-open count)
// =============================================================================

export async function computeInProgressTrend(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<InProgressTrendPoint[]> {
  if (!hasDb()) return [];
  const { whereClause, params } = buildKpiWhere(filters, constraints);

  const rows = await query<Record<string, unknown>>(
    `
      SELECT
        CAST(date_trunc('week', date_started) AS VARCHAR) AS week_start,
        COUNT(*) AS cnt
      FROM engagements
      ${whereClause
        ? `${whereClause} AND ${SQL_OPEN}`
        : `WHERE ${SQL_OPEN}`}
      GROUP BY week_start
      ORDER BY week_start
    `,
    params
  );

  return rows.map(r => ({
    weekStart: String(r.week_start ?? '').split(' ')[0],
    count: Number(r.cnt ?? 0),
  }));
}

// =============================================================================
// 5a. INTAKE TYPE YIELD
// =============================================================================

export async function computeIntakeYield(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<IntakeYieldRow[]> {
  if (!hasDb()) return [];
  const { whereClause, params } = buildKpiWhere(filters, constraints);

  const rows = await query<Record<string, unknown>>(
    `
      SELECT
        intake_type AS intake,
        COUNT(*) AS cnt,
        COUNT(*) FILTER (WHERE ${SQL_COMPLETED}) AS completed,
        COUNT(*) FILTER (WHERE status = 'Completed') AS strict_completed,
        COALESCE(AVG(CAST(nna AS DOUBLE)) FILTER (WHERE nna IS NOT NULL), 0) AS avg_nna,
        COUNT(*) FILTER (WHERE status = 'Completed' AND (nna IS NULL OR nna = 0)) AS zero_nna
      FROM engagements
      ${whereClause}
      GROUP BY intake_type
      ORDER BY cnt DESC
    `,
    params
  );

  return rows.map(r => {
    const count = Number(r.cnt ?? 0);
    const completed = Number(r.completed ?? 0);
    const strictCompleted = Number(r.strict_completed ?? 0);
    return {
      intakeType: String(r.intake ?? ''),
      count,
      completionRate: pct(completed, count),
      avgNna: Math.round(Number(r.avg_nna ?? 0)),
      zeroNnaRate: pct(Number(r.zero_nna ?? 0), strictCompleted),
    };
  });
}

// =============================================================================
// 5b. AD-HOC CHANNEL HEALTH
// =============================================================================

export async function computeAdHocChannelHealth(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<AdHocChannelRow[]> {
  if (!hasDb()) return [];
  const { whereClause, params } = buildKpiWhere(filters, constraints, { tableAlias: 'e' });
  const conditions = whereClause ? `${whereClause} AND e.intake_type = 'GCG Ad-Hoc'` : `WHERE e.intake_type = 'GCG Ad-Hoc'`;

  const rows = await query<Record<string, unknown>>(
    `
      SELECT
        COALESCE(e.ad_hoc_channel, 'Unknown') AS channel,
        COUNT(*) AS cnt,
        COUNT(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM engagements c WHERE c.linked_from_id = e.id
        )) AS with_child,
        COALESCE(SUM(e.nna), 0) AS total_nna
      FROM engagements e
      ${conditions}
      GROUP BY e.ad_hoc_channel
      ORDER BY cnt DESC
    `,
    params
  );

  return rows.map(r => {
    const count = Number(r.cnt ?? 0);
    const withChild = Number(r.with_child ?? 0);
    return {
      channel: String(r.channel ?? ''),
      count,
      linkedChildPercent: pct(withChild, count),
      totalNna: Number(r.total_nna ?? 0),
    };
  });
}

// =============================================================================
// 6a. STALE IN-PROGRESS ENGAGEMENTS
// =============================================================================

export async function computeStaleEngagements(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<StaleEngagement[]> {
  if (!hasDb()) return [];
  // Period-independent: stale is defined by absolute age, not selected window
  const { whereClause, params } = buildKpiWhere(filters, constraints, { includePeriod: false });

  const rows = await query<Record<string, unknown>>(
    `
      SELECT
        id,
        internal_client_dept AS dept,
        internal_client_name AS client,
        type,
        status,
        CAST(CURRENT_DATE - date_started AS INTEGER) AS days_open,
        CAST(date_started AS VARCHAR) AS date_started
      FROM engagements
      ${whereClause
        ? `${whereClause} AND ${SQL_OPEN}`
        : `WHERE ${SQL_OPEN}`}
      ORDER BY date_started ASC
      LIMIT 10
    `,
    params
  );

  return rows.map(r => ({
    id: Number(r.id ?? 0),
    gcgDept: String(r.dept ?? ''),
    clientName: String(r.client ?? ''),
    type: String(r.type ?? ''),
    status: String(r.status ?? ''),
    daysOpen: Number(r.days_open ?? 0),
    dateStarted: String(r.date_started ?? '').split('T')[0],
  }));
}

// =============================================================================
// 6b. DORMANT GCG CONTACTS
// =============================================================================

export async function computeDormantClients(
  filters: KpiFilters,
  constraints: ServerConstraints
): Promise<DormantClient[]> {
  if (!hasDb()) return [];
  // Period-independent — dormancy uses all-time history
  const { whereClause, params } = buildKpiWhere(filters, constraints, { includePeriod: false });

  const rows = await query<Record<string, unknown>>(
    `
      SELECT
        internal_client_name AS client,
        internal_client_dept AS dept,
        COUNT(*)             AS total_count,
        MAX(date_started)    AS last_started,
        CAST(CURRENT_DATE - MAX(date_started) AS INTEGER) AS days_since
      FROM engagements
      ${whereClause}
      GROUP BY internal_client_name, internal_client_dept
      HAVING COUNT(*) >= 3
         AND MAX(date_started) < CURRENT_DATE - INTERVAL '60 days'
      ORDER BY days_since DESC
      LIMIT 10
    `,
    params
  );

  return rows.map(r => ({
    clientName: String(r.client ?? ''),
    gcgDept: String(r.dept ?? ''),
    historicalCount: Number(r.total_count ?? 0),
    lastEngagedDate: String(r.last_started ?? '').split('T')[0],
    daysSinceLast: Number(r.days_since ?? 0),
  }));
}

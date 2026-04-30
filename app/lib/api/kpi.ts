/**
 * =============================================================================
 * KPI DASHBOARD API
 * =============================================================================
 *
 * Team-oriented KPI dashboard. Scope is always team-level or cross-team —
 * no individual-level views. No team-vs-team competitive comparisons.
 */

const API_BASE_URL = '/api';

// =============================================================================
// TYPES
// =============================================================================

export type KpiScope = 'all' | `team:${string}`;

export interface KpiFilters {
  scope: KpiScope;
  period: string;
  gcgDepts?: string[];
  intakeTypes?: string[];
}

export interface KpiDelta {
  value: number;
  deltaPercent: number;
}

export interface HeroKpis {
  interactions: KpiDelta;
  inProgress: KpiDelta;
  nna: KpiDelta;
  avgNnaPerInteraction: KpiDelta;
  completionRate: KpiDelta;
  zeroNnaRate: KpiDelta;
  periodLabel: string;
}

export interface JourneySankeyData {
  nodes: { name: string; kind: 'intake' | 'project' | 'outcome' }[];
  links: { source: number; target: number; value: number }[];
}

export interface JourneyTemplate {
  signature: string;
  count: number;
  percentOfTotal: number;
  avgNna: number;
  avgDays: number | null;
  completionRate: number;
}

export interface GcgDeptRow {
  dept: string;
  interactions: number;
  nna: number;
  nnaPerInteraction: number;
}

export interface NnaConcentrationPoint {
  rank: number;
  clientName: string;
  gcgDept: string;
  nna: number;
  cumulativeShare: number;
}

export interface NnaConcentration {
  totalNna: number;
  clients: NnaConcentrationPoint[];
  top5Share: number;
  clientsForEightyPercent: number;
}

export interface ActivityHeatmapCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityHeatmap {
  weeks: ActivityHeatmapCell[][];
  totalDays: number;
  maxCount: number;
}

export interface InProgressTrendPoint {
  weekStart: string;
  count: number;
}

export interface IntakeYieldRow {
  intakeType: string;
  count: number;
  completionRate: number;
  avgNna: number;
  zeroNnaRate: number;
}

export interface AdHocChannelRow {
  channel: string;
  count: number;
  linkedChildPercent: number;
  totalNna: number;
}

export interface StaleEngagement {
  id: number;
  gcgDept: string;
  clientName: string;
  type: string;
  status: string;
  daysOpen: number;
  dateStarted: string;
}

export interface DormantClient {
  clientName: string;
  gcgDept: string;
  historicalCount: number;
  lastEngagedDate: string;
  daysSinceLast: number;
}

export interface KpiDashboardData {
  scope: { kind: 'all' | 'team'; team?: string };
  periodLabel: string;
  heroKpis: HeroKpis;
  journeySankey: JourneySankeyData;
  journeyTemplates: JourneyTemplate[];
  gcgDepts: GcgDeptRow[];
  nnaConcentration: NnaConcentration;
  activityHeatmap: ActivityHeatmap;
  inProgressTrend: InProgressTrendPoint[];
  intakeYield: IntakeYieldRow[];
  adHocChannels: AdHocChannelRow[];
  staleEngagements: StaleEngagement[];
  dormantClients: DormantClient[];
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

export async function getKpiDashboardData(
  filters: KpiFilters,
  signal?: AbortSignal
): Promise<KpiDashboardData> {
  const response = await fetch(`${API_BASE_URL}/kpi/dashboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scope: filters.scope,
      period: filters.period,
      gcgDepts: filters.gcgDepts ?? [],
      intakeTypes: filters.intakeTypes ?? [],
    }),
    signal,
  });
  if (!response.ok) {
    if (response.status === 400) throw new Error('Invalid KPI scope.');
    throw new Error('Failed to load KPI dashboard data.');
  }
  return response.json();
}

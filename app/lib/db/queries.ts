import { toDisplayDate } from './dateUtils';
import { getPeriodStartISO } from './dateUtils';
import type { Engagement } from '../types/engagements';
import type { EngagementFilters } from '../api/client-interactions';

// Team member → office mapping (mirrors app/lib/data/engagements.ts teamMemberOffices)
const TEAM_MEMBER_OFFICES: Record<string, 'Charlotte' | 'Austin'> = {
  'Eli F.': 'Charlotte',
  'Sarah K.': 'Charlotte',
  'Mike R.': 'Charlotte',
  'Lisa M.': 'Charlotte',
  'James T.': 'Charlotte',
  'David L.': 'Austin',
  'Rachel W.': 'Austin',
  'Chris B.': 'Austin',
  'Amanda P.': 'Austin',
  'Kevin H.': 'Austin',
  'Nicole S.': 'Austin',
  'Brandon T.': 'Austin',
};

const CHARLOTTE_MEMBERS = Object.entries(TEAM_MEMBER_OFFICES)
  .filter(([, o]) => o === 'Charlotte')
  .map(([n]) => n);

const AUSTIN_MEMBERS = Object.entries(TEAM_MEMBER_OFFICES)
  .filter(([, o]) => o === 'Austin')
  .map(([n]) => n);

// Allowlist for ORDER BY columns to prevent SQL injection
export const SORT_COLUMN_MAP: Record<string, string> = {
  dateStarted: 'date_started',
  dateFinished: 'date_finished',
  externalClient: 'external_client',
  status: 'status',
  department: 'department',
  type: 'type',
  intakeType: 'intake_type',
};

export interface ServerConstraints {
  team?: string;
}

/**
 * Builds a parameterized WHERE clause from EngagementFilters.
 * All user-supplied values go through params — no string interpolation of user data.
 * serverConstraints are enforced server-side and cannot be overridden by clients.
 */
export function buildFilterClause(
  filters: EngagementFilters,
  tableAlias = '',
  serverConstraints: ServerConstraints = {}
): { whereClause: string; params: unknown[] } {
  const col = (c: string) => (tableAlias ? `${tableAlias}.${c}` : c);
  const conditions: string[] = [];
  const params: unknown[] = [];

  // Server-enforced team isolation — applied before all client filters
  if (serverConstraints.team) {
    conditions.push(`${col('team')} = ?`);
    params.push(serverConstraints.team);
  }

  // Period filter: applies to date_started
  if (filters.period) {
    const startISO = getPeriodStartISO(filters.period);
    if (startISO) {
      conditions.push(`${col('date_started')} >= ?`);
      params.push(startISO);
    }
  }

  // Department filter (multi-select)
  if (filters.departments && filters.departments.length > 0) {
    const placeholders = filters.departments.map(() => '?').join(', ');
    conditions.push(`${col('internal_client_dept')} IN (${placeholders})`);
    params.push(...filters.departments);
  }

  // Intake type filter (multi-select)
  if (filters.intakeTypes && filters.intakeTypes.length > 0) {
    const placeholders = filters.intakeTypes.map(() => '?').join(', ');
    conditions.push(`${col('intake_type')} IN (${placeholders})`);
    params.push(...filters.intakeTypes);
  }

  // Project type filter (multi-select)
  if (filters.projectTypes && filters.projectTypes.length > 0) {
    const placeholders = filters.projectTypes.map(() => '?').join(', ');
    conditions.push(`${col('type')} IN (${placeholders})`);
    params.push(...filters.projectTypes);
  }

  // Status filter
  if (filters.status) {
    conditions.push(`${col('status')} = ?`);
    params.push(filters.status);
  }

  // Team member filter: check if JSON array contains the member name(s)
  // json_contains(col, '"Name"') checks for exact JSON string match in a JSON array
  if (filters.teamMember && filters.teamMember !== 'All Team Members') {
    let members: string[];
    if (filters.teamMember === 'Charlotte Office') {
      members = CHARLOTTE_MEMBERS;
    } else if (filters.teamMember === 'Austin Office') {
      members = AUSTIN_MEMBERS;
    } else {
      members = [filters.teamMember];
    }

    const memberConditions = members.map(() => `json_contains(${col('team_members')}, ?)`);
    // JSON-encode the member name so it matches the JSON string value in the array
    members.forEach(m => params.push(JSON.stringify(m)));
    conditions.push(`(${memberConditions.join(' OR ')})`);
  }

  // Full-text search across key string columns
  if (filters.search && filters.search.trim()) {
    const s = `%${filters.search.toLowerCase()}%`;
    conditions.push(`(
      lower(${col('external_client')}) LIKE ?
      OR lower(${col('internal_client_name')}) LIKE ?
      OR lower(${col('intake_type')}) LIKE ?
      OR lower(${col('type')}) LIKE ?
      OR lower(${col('department')}) LIKE ?
    )`);
    params.push(s, s, s, s, s);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

/**
 * Maps a raw DuckDB row object to the typed Engagement interface.
 * Parses JSON array columns and converts dates to display format.
 */
export function rowToEngagement(row: Record<string, unknown>): Engagement {
  return {
    id: Number(row.id),
    externalClient: (row.external_client as string | null) ?? null,
    internalClient: {
      name: row.internal_client_name as string,
      gcgDepartment: row.internal_client_dept as 'IAG' | 'Broker-Dealer' | 'Institutional',
    },
    intakeType: row.intake_type as 'IRQ' | 'SERF' | 'GCG Ad-Hoc',
    adHocChannel: (row.ad_hoc_channel as string | undefined) as import('../types/engagements').GCGAdHocChannel | undefined,
    type: row.type as string,
    teamMembers: JSON.parse((row.team_members as string) || '[]') as string[],
    department: row.department as string,
    dateStarted: toDisplayDate(row.date_started as string),
    dateFinished: toDisplayDate(row.date_finished as string | null),
    status: row.status as string,
    portfolioLogged: Boolean(row.portfolio_logged),
    portfolio: row.portfolio
      ? JSON.parse(row.portfolio as string)
      : undefined,
    nna: row.nna != null ? Number(row.nna) : undefined,
    notes: (row.notes as string | undefined) || undefined,
    noteCount: Number(row.note_count ?? 0),
    version: Number(row.version ?? 1),
    tickersMentioned: row.tickers_mentioned
      ? (JSON.parse(row.tickers_mentioned as string) as string[])
      : undefined,
    createdById: (row.created_by_id as string | undefined) || undefined,
    createdByName: (row.created_by_name as string | undefined) || undefined,
    linkedFromId: row.linked_from_id != null ? Number(row.linked_from_id) : null,
  };
}

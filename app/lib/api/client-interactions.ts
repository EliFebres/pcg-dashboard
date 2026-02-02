/**
 * =============================================================================
 * CLIENT INTERACTIONS API
 * =============================================================================
 *
 * API functions for the Client Interactions Dashboard.
 *
 * STRUCTURE:
 * 1. Configuration & Toggle
 * 2. TypeScript Interfaces
 * 3. API Fetch Functions (real API calls)
 * 4. Mock Data Functions (dummy data for development)
 * 5. Helper Functions
 */

import type {
  Engagement,
  DayData,
  DepartmentData,
  IntakeBreakdown,
  IntakeSourceBreakdown,
  NNATier,
} from '../types/engagements';
import {
  engagements as mockEngagements,
  generateContributionData,
  teamMemberOffices,
} from '../data/engagements';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * DATA SOURCE TOGGLE
 *
 * Set to `true` to use the real FastAPI backend
 * Set to `false` to use mock data (for development without backend)
 */
const USE_REAL_API = false; // <-- TOGGLE THIS TO SWITCH BETWEEN MOCK AND REAL API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Simulate network delay for mock data (set to 0 for faster testing)
const SIMULATED_DELAY = process.env.NODE_ENV === 'development' ? 200 : 0;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Converts snake_case API response keys to camelCase for TypeScript
 */
function toCamelCase<T>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
    }
    return result as T;
  }
  return obj as T;
}

// =============================================================================
// TYPESCRIPT INTERFACES
// =============================================================================

/** Filters for fetching engagements */
export interface EngagementFilters {
  search?: string;                 // Text search across multiple fields
  teamMember?: string;             // 'All Team Members', 'Austin Office', 'Charlotte Office', or member name
  departments?: string[];          // Multi-select: ['IAG', 'Broker-Dealer', 'Institution']
  intakeTypes?: string[];          // Multi-select: ['IRQ', 'GRRF', 'GCG Ad-Hoc']
  projectTypes?: string[];         // Multi-select: ['Meeting', 'Follow-Up', 'Data Request', 'PCR', 'Other']
  period?: string;                 // '1W', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'
  status?: string;                 // 'In Progress', 'Pending', 'Completed'
  page?: number;                   // Pagination: page number (1-indexed)
  pageSize?: number;               // Pagination: items per page (default 50)
  sortColumn?: string;             // Column to sort by
  sortDirection?: 'asc' | 'desc';  // Sort direction
}

/** Paginated engagements response */
export interface EngagementsResponse {
  engagements: Engagement[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Pre-computed metrics for dashboard cards */
export interface DashboardMetrics {
  clientProjects: {
    count: number;
    changePercent: number;
    periodLabel: string;
    intakeSourceBreakdown: IntakeSourceBreakdown;
  };
  gcgAdHoc: {
    count: number;
    changePercent: number;
    periodLabel: string;
    intakeBreakdown: IntakeBreakdown[];
  };
  inProgress: {
    count: number;
    change: number;
    sparklineData: { value: number }[];
  };
  nna: {
    total: number;
    projectCount: number;
    changePercent: number;
    tiers: NNATier[];
  };
}

/** Department breakdown for chart */
export interface DepartmentBreakdown {
  departments: DepartmentData[];
  total: number;
}

/** Contribution heatmap data (GitHub-style activity graph) */
export interface ContributionDataResponse {
  weeks: DayData[][];
  totalDays: number;
  maxCount: number;
}

/** Combined dashboard data for initial load */
export interface DashboardData {
  metrics: DashboardMetrics;
  departments: DepartmentBreakdown;
  contributionData: ContributionDataResponse;
  engagements: EngagementsResponse;
  filterOptions: FilterOptions;
}

/** Available filter options derived from data */
export interface FilterOptions {
  teamMembers: string[];
  teamMemberGroups: { label: string; options: string[] }[];
  departments: string[];
  intakeTypes: string[];
  projectTypes: string[];
  statuses: string[];
}

// =============================================================================
// API FETCH FUNCTIONS
// =============================================================================

/**
 * GET DASHBOARD DATA
 *
 * Fetches all dashboard data in a single optimized call for initial page load.
 * Includes metrics, department chart, contribution heatmap, table data, and filter options.
 *
 * @param filters - Optional filters to apply
 * @param filters.period - Time period: '1W', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'
 * @param filters.teamMember - Team member or office filter
 * @param filters.departments - Array of department names to filter by
 * @param filters.intakeTypes - Array of intake types to filter by
 * @param filters.projectTypes - Array of project types to filter by
 * @param filters.page - Page number for engagements table
 * @param filters.pageSize - Items per page (default 50)
 *
 * @returns Promise<DashboardData> - Combined dashboard data
 *
 * Endpoint: POST /api/client-interactions/dashboard
 */
export async function getDashboardData(filters: EngagementFilters = {}): Promise<DashboardData> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_BASE_URL}/client-interactions/dashboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period: filters.period || '1Y',
        team_member: filters.teamMember,
        departments: filters.departments || [],
        intake_types: filters.intakeTypes || [],
        project_types: filters.projectTypes || [],
        search: filters.search,
        status: filters.status,
        page: filters.page || 1,
        page_size: filters.pageSize || 50,
        sort_column: filters.sortColumn,
        sort_direction: filters.sortDirection || 'desc',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch dashboard data' }));
      throw new Error(error.detail || 'Failed to fetch dashboard data');
    }

    const data = await response.json();
    return toCamelCase<DashboardData>(data);
  }

  // Use mock data
  return getMockDashboardData(filters);
}
// Response snippet:
// {
//   "metrics": {
//     "clientProjects": {
//       "count": 156,
//       "changePercent": 12,
//       "periodLabel": "YoY",
//       "intakeSourceBreakdown": {
//         "irqCount": 98,
//         "irqPercent": 63,
//         "grffCount": 58,
//         "grffPercent": 37,
//         "portfoliosLogged": 142,
//         "portfoliosTotal": 156,
//         "portfoliosPercent": 91
//       }
//     },
//     "gcgAdHoc": {
//       "count": 234,
//       "changePercent": 8,
//       "periodLabel": "YoY",
//       "intakeBreakdown": [
//         { "intake": "In-Person", "count": 78, "percent": 33, "color": "#a5f3fc" },
//         { "intake": "Email", "count": 98, "percent": 42, "color": "#22d3ee" },
//         { "intake": "Teams", "count": 58, "percent": 25, "color": "#0e7490" }
//       ]
//     },
//     "inProgress": {
//       "count": 12,
//       "change": 2,
//       "sparklineData": [{ "value": 8 }, { "value": 10 }, { "value": 9 }, { "value": 12 }]
//     },
//     "nna": {
//       "total": 245000000,
//       "projectCount": 18,
//       "changePercent": 15,
//       "tiers": [
//         { "label": "<$50M", "count": 10, "color": "#0e7490" },
//         { "label": "$50-200M", "count": 6, "color": "#22d3ee" },
//         { "label": "$200M+", "count": 2, "color": "#39FF14" }
//       ]
//     }
//   },
//   "departments": {
//     "departments": [
//       { "name": "IAG", "value": 55, "count": 89, "color": "#a5f3fc" },
//       { "name": "Broker-Dealer", "value": 33, "count": 53, "color": "#22d3ee" },
//       { "name": "Institution", "value": 12, "count": 20, "color": "#0e7490" }
//     ],
//     "total": 162
//   },
//   "contributionData": {
//     "weeks": [[
//       { "date": "2024-01-29", "level": 2, "count": 3, "projectCount": 1, "adHocCount": 2 },
//       { "date": "2024-01-30", "level": 1, "count": 1, "projectCount": 0, "adHocCount": 1 }
//     ]],
//     "totalDays": 260,
//     "maxCount": 8
//   },
//   "engagements": {
//     "engagements": [{
//       "id": 1234,
//       "externalClient": "Vanguard Advisors",
//       "internalClient": { "name": "Jennifer Martinez", "gcgDepartment": "IAG" },
//       "intakeType": "GCG Ad-Hoc",
//       "adHocChannel": "In-Person",
//       "type": "Meeting",
//       "teamMembers": ["Eli F.", "Sarah K."],
//       "department": "IAG",
//       "dateStarted": "Jan 15, 2025",
//       "dateFinished": "Jan 15, 2025",
//       "status": "Completed",
//       "portfolioLogged": false,
//       "nna": null,
//       "notes": "Discussed portfolio rebalancing strategy.",
//       "tickersMentioned": ["VOO", "DFAC", "AAPL"]
//     }],
//     "total": 162,
//     "page": 1,
//     "pageSize": 50,
//     "hasMore": true
//   },
//   "filterOptions": {
//     "teamMembers": ["All Team Members", "Austin Office", "Charlotte Office"],
//     "teamMemberGroups": [{ "label": "Office", "options": ["Austin Office", "Charlotte Office"] }],
//     "departments": ["IAG", "Broker-Dealer", "Institution"],
//     "intakeTypes": ["IRQ", "GRRF", "GCG Ad-Hoc"],
//     "projectTypes": ["Meeting", "Follow-Up", "Data Request", "PCR", "Other"],
//     "statuses": ["In Progress", "Completed", "On Hold"]
//   }
// }


/**
 * GET ENGAGEMENTS (Paginated)
 *
 * Fetches paginated engagements with filtering and sorting.
 * Use for table pagination after initial dashboard load.
 *
 * @param filters.search - Text search across client names, types, departments
 * @param filters.period - Time period filter
 * @param filters.teamMember - Team member or office filter
 * @param filters.departments - Department filter (multi-select)
 * @param filters.intakeTypes - Intake type filter (multi-select)
 * @param filters.projectTypes - Project type filter (multi-select)
 * @param filters.status - Status filter
 * @param filters.page - Page number (1-indexed)
 * @param filters.pageSize - Items per page
 * @param filters.sortColumn - Column to sort by
 * @param filters.sortDirection - 'asc' or 'desc'
 *
 * @returns Promise<EngagementsResponse> - Paginated engagements
 *
 * Endpoint: GET /api/client-interactions/engagements?page=1&page_size=50&...
 */
export async function getEngagements(filters: EngagementFilters = {}): Promise<EngagementsResponse> {
  if (USE_REAL_API) {
    const params = new URLSearchParams();
    params.set('page', String(filters.page || 1));
    params.set('page_size', String(filters.pageSize || 50));
    if (filters.period) params.set('period', filters.period);
    if (filters.search) params.set('search', filters.search);
    if (filters.teamMember) params.set('team_member', filters.teamMember);
    if (filters.status) params.set('status', filters.status);
    if (filters.sortColumn) params.set('sort_column', filters.sortColumn);
    if (filters.sortDirection) params.set('sort_direction', filters.sortDirection);
    filters.departments?.forEach(d => params.append('departments', d));
    filters.intakeTypes?.forEach(t => params.append('intake_types', t));
    filters.projectTypes?.forEach(t => params.append('project_types', t));

    const response = await fetch(`${API_BASE_URL}/client-interactions/engagements?${params}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch engagements' }));
      throw new Error(error.detail || 'Failed to fetch engagements');
    }

    const data = await response.json();
    return toCamelCase<EngagementsResponse>(data);
  }

  return getMockEngagements(filters);
}
// Response snippet:
// {
//   "engagements": [{
//     "id": 1234,
//     "externalClient": "Vanguard Advisors",
//     "internalClient": { "name": "Jennifer Martinez", "gcgDepartment": "IAG" },
//     "intakeType": "GCG Ad-Hoc",
//     "adHocChannel": "Email",
//     "type": "Follow-Up",
//     "teamMembers": ["Eli F.", "Sarah K."],
//     "department": "IAG",
//     "dateStarted": "Jan 20, 2025",
//     "dateFinished": "Jan 21, 2025",
//     "status": "Completed",
//     "portfolioLogged": false,
//     "nna": null,
//     "notes": "Client requested additional breakdowns by sector.",
//     "tickersMentioned": ["MSFT", "GOOGL"]
//   }],
//   "total": 162,
//   "page": 1,
//   "pageSize": 50,
//   "hasMore": true
// }


/**
 * GET METRICS
 *
 * Fetches only the 4 metric cards data.
 * Use for refreshing metrics without reloading entire dashboard.
 *
 * @param filters - Same filters as getDashboardData
 * @returns Promise<DashboardMetrics> - Metric card data
 *
 * Endpoint: POST /api/client-interactions/metrics
 */
export async function getMetrics(filters: EngagementFilters = {}): Promise<DashboardMetrics> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_BASE_URL}/client-interactions/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period: filters.period || '1Y',
        team_member: filters.teamMember,
        departments: filters.departments || [],
        intake_types: filters.intakeTypes || [],
        project_types: filters.projectTypes || [],
        search: filters.search,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch metrics' }));
      throw new Error(error.detail || 'Failed to fetch metrics');
    }

    const data = await response.json();
    return toCamelCase<DashboardMetrics>(data);
  }

  return getMockMetrics(filters);
}
// Response snippet:
// {
//   "clientProjects": {
//     "count": 156,
//     "changePercent": 12,
//     "periodLabel": "YoY",
//     "intakeSourceBreakdown": {
//       "irqCount": 98,
//       "irqPercent": 63,
//       "grffCount": 58,
//       "grffPercent": 37,
//       "portfoliosLogged": 142,
//       "portfoliosTotal": 156,
//       "portfoliosPercent": 91
//     }
//   },
//   "gcgAdHoc": {
//     "count": 234,
//     "changePercent": -5,
//     "periodLabel": "YoY",
//     "intakeBreakdown": [
//       { "intake": "In-Person", "count": 78, "percent": 33, "color": "#a5f3fc" },
//       { "intake": "Email", "count": 98, "percent": 42, "color": "#22d3ee" },
//       { "intake": "Teams", "count": 58, "percent": 25, "color": "#0e7490" }
//     ]
//   },
//   "inProgress": {
//     "count": 12,
//     "change": 2,
//     "sparklineData": [{ "value": 8 }, { "value": 10 }, { "value": 9 }, { "value": 11 }, { "value": 12 }]
//   },
//   "nna": {
//     "total": 245000000,
//     "projectCount": 18,
//     "changePercent": 15,
//     "tiers": [
//       { "label": "<$50M", "count": 10, "color": "#0e7490" },
//       { "label": "$50-200M", "count": 6, "color": "#22d3ee" },
//       { "label": "$200M+", "count": 2, "color": "#39FF14" }
//     ]
//   }
// }


/**
 * GET DEPARTMENT BREAKDOWN
 *
 * Fetches department breakdown for the horizontal bar chart.
 *
 * @param filters - Same filters as getDashboardData
 * @returns Promise<DepartmentBreakdown> - Department chart data
 *
 * Endpoint: POST /api/client-interactions/departments
 */
export async function getDepartmentBreakdown(filters: EngagementFilters = {}): Promise<DepartmentBreakdown> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_BASE_URL}/client-interactions/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period: filters.period || '1Y',
        team_member: filters.teamMember,
        departments: filters.departments || [],
        intake_types: filters.intakeTypes || [],
        project_types: filters.projectTypes || [],
        search: filters.search,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch department breakdown' }));
      throw new Error(error.detail || 'Failed to fetch department breakdown');
    }

    const data = await response.json();
    return toCamelCase<DepartmentBreakdown>(data);
  }

  return getMockDepartmentBreakdown(filters);
}
// Response snippet:
// {
//   "departments": [
//     { "name": "IAG", "value": 55, "count": 89, "color": "#a5f3fc" },
//     { "name": "Broker-Dealer", "value": 33, "count": 53, "color": "#22d3ee" },
//     { "name": "Institution", "value": 12, "count": 20, "color": "#0e7490" }
//   ],
//   "total": 162
// }


/**
 * GET CONTRIBUTION DATA
 *
 * Fetches GitHub-style contribution heatmap data.
 * Returns 52 weeks x 5 weekdays (Mon-Fri) with activity levels 0-4.
 *
 * @param filters - Same filters as getDashboardData
 * @returns Promise<ContributionDataResponse> - Heatmap data
 *
 * Endpoint: POST /api/client-interactions/contribution-data
 */
export async function getContributionData(filters: EngagementFilters = {}): Promise<ContributionDataResponse> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_BASE_URL}/client-interactions/contribution-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period: filters.period || '1Y',
        team_member: filters.teamMember,
        departments: filters.departments || [],
        intake_types: filters.intakeTypes || [],
        project_types: filters.projectTypes || [],
        search: filters.search,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch contribution data' }));
      throw new Error(error.detail || 'Failed to fetch contribution data');
    }

    const data = await response.json();
    return toCamelCase<ContributionDataResponse>(data);
  }

  return getMockContributionData(filters);
}
// Response snippet:
// {
//   "weeks": [
//     [
//       { "date": "2024-01-29", "level": 2, "count": 3, "projectCount": 1, "adHocCount": 2 },
//       { "date": "2024-01-30", "level": 1, "count": 1, "projectCount": 0, "adHocCount": 1 },
//       { "date": "2024-01-31", "level": 0, "count": 0, "projectCount": 0, "adHocCount": 0 },
//       { "date": "2024-02-01", "level": 3, "count": 5, "projectCount": 2, "adHocCount": 3 },
//       { "date": "2024-02-02", "level": 4, "count": 7, "projectCount": 3, "adHocCount": 4 }
//     ]
//   ],
//   "totalDays": 260,
//   "maxCount": 8
// }


/**
 * CREATE ENGAGEMENT
 *
 * Creates a new engagement record.
 *
 * @param engagement - Engagement data without ID (backend generates ID)
 * @param engagement.externalClient - Optional external client name
 * @param engagement.internalClient - Required: { name, gcgDepartment }
 * @param engagement.intakeType - 'IRQ', 'GRRF', or 'GCG Ad-Hoc'
 * @param engagement.adHocChannel - Required if intakeType is 'GCG Ad-Hoc': 'In-Person', 'Email', 'Teams'
 * @param engagement.type - Project type: 'Meeting', 'Follow-Up', 'Data Request', 'PCR', 'Other'
 * @param engagement.teamMembers - Array of team member names
 * @param engagement.dateStarted - Date string like "Jan 28, 2025"
 * @param engagement.dateFinished - Date string or "—"
 * @param engagement.status - 'In Progress', 'Pending', or 'Completed'
 * @param engagement.tickersMentioned - Optional array of tickers discussed (GCG Ad-Hoc only, for Ticker Trends)
 *
 * @returns Promise<Engagement> - Created engagement with generated ID
 *
 * Endpoint: POST /api/client-interactions/engagements
 */
export async function createEngagement(engagement: Omit<Engagement, 'id'>): Promise<Engagement> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_BASE_URL}/client-interactions/engagements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_client: engagement.externalClient,
        internal_client: {
          name: engagement.internalClient.name,
          gcg_department: engagement.internalClient.gcgDepartment,
        },
        intake_type: engagement.intakeType,
        ad_hoc_channel: engagement.adHocChannel || null,
        type: engagement.type,
        team_members: engagement.teamMembers,
        date_started: engagement.dateStarted,
        date_finished: engagement.dateFinished,
        status: engagement.status,
        portfolio_logged: engagement.portfolioLogged,
        portfolio: engagement.portfolio || null,
        nna: engagement.nna || null,
        notes: engagement.notes || null,
        tickers_mentioned: engagement.tickersMentioned || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to create engagement' }));
      throw new Error(error.detail || 'Failed to create engagement');
    }

    const data = await response.json();
    return toCamelCase<Engagement>(data);
  }

  return getMockCreateEngagement(engagement);
}
// Response snippet (201 Created):
// {
//   "id": 1234,
//   "externalClient": "Vanguard Advisors",
//   "internalClient": { "name": "Jennifer Martinez", "gcgDepartment": "IAG" },
//   "intakeType": "GCG Ad-Hoc",
//   "adHocChannel": "In-Person",
//   "type": "Meeting",
//   "teamMembers": ["Eli F.", "Sarah K."],
//   "department": "IAG",
//   "dateStarted": "Jan 28, 2025",
//   "dateFinished": "—",
//   "status": "In Progress",
//   "portfolioLogged": false,
//   "portfolio": null,
//   "nna": null,
//   "notes": null,
//   "tickersMentioned": ["AAPL", "MSFT", "VOO"]
// }


/**
 * UPDATE ENGAGEMENT
 *
 * Updates an existing engagement with partial data (PATCH).
 * Only sends fields that are being updated.
 *
 * @param id - Engagement ID to update
 * @param updates - Partial engagement data to update
 *
 * @returns Promise<Engagement> - Updated engagement
 *
 * Endpoint: PATCH /api/client-interactions/engagements/:id
 */
export async function updateEngagement(
  id: number,
  updates: Partial<Omit<Engagement, 'id'>>
): Promise<Engagement> {
  if (USE_REAL_API) {
    const body: Record<string, unknown> = {};
    if (updates.externalClient !== undefined) body.external_client = updates.externalClient;
    if (updates.internalClient) {
      body.internal_client = {
        name: updates.internalClient.name,
        gcg_department: updates.internalClient.gcgDepartment,
      };
    }
    if (updates.intakeType !== undefined) body.intake_type = updates.intakeType;
    if (updates.adHocChannel !== undefined) body.ad_hoc_channel = updates.adHocChannel;
    if (updates.type !== undefined) body.type = updates.type;
    if (updates.teamMembers !== undefined) body.team_members = updates.teamMembers;
    if (updates.dateStarted !== undefined) body.date_started = updates.dateStarted;
    if (updates.dateFinished !== undefined) body.date_finished = updates.dateFinished;
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.portfolioLogged !== undefined) body.portfolio_logged = updates.portfolioLogged;
    if (updates.portfolio !== undefined) body.portfolio = updates.portfolio;
    if (updates.nna !== undefined) body.nna = updates.nna;
    if (updates.notes !== undefined) body.notes = updates.notes;
    if (updates.tickersMentioned !== undefined) body.tickers_mentioned = updates.tickersMentioned;

    const response = await fetch(`${API_BASE_URL}/client-interactions/engagements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update engagement' }));
      throw new Error(error.detail || 'Failed to update engagement');
    }

    const data = await response.json();
    return toCamelCase<Engagement>(data);
  }

  return getMockUpdateEngagement(id, updates);
}
// Response snippet:
// {
//   "id": 1234,
//   "externalClient": "Vanguard Advisors",
//   "internalClient": { "name": "Jennifer Martinez", "gcgDepartment": "IAG" },
//   "intakeType": "GCG Ad-Hoc",
//   "adHocChannel": "In-Person",
//   "type": "Meeting",
//   "teamMembers": ["Eli F.", "Sarah K."],
//   "department": "IAG",
//   "dateStarted": "Jan 28, 2025",
//   "dateFinished": "Jan 30, 2025",
//   "status": "Completed",
//   "portfolioLogged": false,
//   "portfolio": null,
//   "nna": 25000000,
//   "notes": "Client approved new allocation.",
//   "tickersMentioned": ["AAPL", "MSFT", "VOO"]
// }


/**
 * UPDATE ENGAGEMENT STATUS
 *
 * Optimized endpoint for quick status changes.
 * Backend auto-sets dateFinished when status becomes "Completed".
 *
 * @param id - Engagement ID
 * @param status - New status: 'In Progress', 'Pending', or 'Completed'
 *
 * @returns Promise<{ id, status, dateFinished }> - Updated fields
 *
 * Endpoint: PATCH /api/client-interactions/engagements/:id/status
 */
export async function updateEngagementStatus(
  id: number,
  status: string
): Promise<{ id: number; status: string; dateFinished: string }> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_BASE_URL}/client-interactions/engagements/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update status' }));
      throw new Error(error.detail || 'Failed to update status');
    }

    const data = await response.json();
    return toCamelCase<{ id: number; status: string; dateFinished: string }>(data);
  }

  return getMockUpdateEngagementStatus(id, status);
}
// Response snippet:
// { "id": 1234, "status": "Completed", "dateFinished": "Jan 30, 2025" }


/**
 * UPDATE ENGAGEMENT NNA
 *
 * Optimized endpoint for quick NNA (Net New Assets) updates.
 *
 * @param id - Engagement ID
 * @param nna - NNA amount in dollars, or undefined to clear
 *
 * @returns Promise<{ id, nna }> - Updated fields
 *
 * Endpoint: PATCH /api/client-interactions/engagements/:id/nna
 */
export async function updateEngagementNNA(
  id: number,
  nna: number | undefined
): Promise<{ id: number; nna: number | undefined }> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_BASE_URL}/client-interactions/engagements/${id}/nna`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nna: nna ?? null }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update NNA' }));
      throw new Error(error.detail || 'Failed to update NNA');
    }

    const data = await response.json();
    return toCamelCase<{ id: number; nna: number | undefined }>(data);
  }

  return getMockUpdateEngagementNNA(id, nna);
}
// Response snippet:
// { "id": 1234, "nna": 50000000 }


/**
 * UPDATE ENGAGEMENT NOTES
 *
 * Optimized endpoint for quick notes updates.
 *
 * @param id - Engagement ID
 * @param notes - Notes text, or empty string to clear
 *
 * @returns Promise<{ id, notes }> - Updated fields
 *
 * Endpoint: PATCH /api/client-interactions/engagements/:id/notes
 */
export async function updateEngagementNotes(
  id: number,
  notes: string
): Promise<{ id: number; notes: string }> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_BASE_URL}/client-interactions/engagements/${id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notes || null }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update notes' }));
      throw new Error(error.detail || 'Failed to update notes');
    }

    const data = await response.json();
    return toCamelCase<{ id: number; notes: string }>(data);
  }

  return getMockUpdateEngagementNotes(id, notes);
}
// Response snippet:
// { "id": 1234, "notes": "Client interested in ESG funds" }


/**
 * DELETE ENGAGEMENT
 *
 * Deletes an engagement record permanently.
 *
 * @param id - Engagement ID to delete
 *
 * @returns Promise<void>
 *
 * Endpoint: DELETE /api/client-interactions/engagements/:id
 * Response: 204 No Content
 */
export async function deleteEngagement(id: number): Promise<void> {
  if (USE_REAL_API) {
    const response = await fetch(`${API_BASE_URL}/client-interactions/engagements/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete engagement' }));
      throw new Error(error.detail || 'Failed to delete engagement');
    }

    return;
  }

  return getMockDeleteEngagement(id);
}
// Response: 204 No Content (empty body)


/**
 * EXPORT ENGAGEMENTS TO CSV
 *
 * Downloads a CSV file with all filtered engagements.
 *
 * @param filters - Same filters as getEngagements
 *
 * @returns Promise<Blob> - CSV file as blob
 *
 * Endpoint: GET /api/client-interactions/engagements/export?...
 * Response: text/csv file
 */
export async function exportEngagements(filters: EngagementFilters = {}): Promise<Blob> {
  if (USE_REAL_API) {
    const params = new URLSearchParams();
    if (filters.period) params.set('period', filters.period);
    if (filters.search) params.set('search', filters.search);
    if (filters.teamMember) params.set('team_member', filters.teamMember);
    if (filters.status) params.set('status', filters.status);
    filters.departments?.forEach(d => params.append('departments', d));
    filters.intakeTypes?.forEach(t => params.append('intake_types', t));
    filters.projectTypes?.forEach(t => params.append('project_types', t));

    const response = await fetch(`${API_BASE_URL}/client-interactions/engagements/export?${params}`);

    if (!response.ok) {
      throw new Error('Failed to export engagements');
    }

    return response.blob();
  }

  return getMockExportEngagements(filters);
}
// Response: CSV file (Content-Type: text/csv)
// ID,External Client,Internal Client,Department,Intake Type,Ad Hoc Channel,Type,Team Members,Date Started,Date Finished,Status,Portfolio Logged,NNA,Notes,Tickers Mentioned
// 1234,"Vanguard Advisors","Jennifer Martinez","IAG","GCG Ad-Hoc","In-Person","Meeting","Eli F., Sarah K.","Jan 15, 2025","Jan 15, 2025","Completed",false,,"Discussed portfolio strategy.","AAPL, MSFT, VOO"
// 1235,"Fidelity Wealth","Robert Chen","IAG","IRQ","","Data Request","Mike R.","Jan 16, 2025","Jan 18, 2025","Completed",true,25000000,"Client approved allocation.",""


// =============================================================================
// MOCK DATA FUNCTIONS
// =============================================================================

async function getMockDashboardData(filters: EngagementFilters): Promise<DashboardData> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const period = filters.period || '1Y';
  const allFiltered = applyFilters(mockEngagements, { ...filters, period });

  const metrics = calculateMetrics(allFiltered, mockEngagements, period);
  const departments = calculateDepartmentBreakdown(allFiltered);
  const contributionData = generateContributionDataResponse(allFiltered);

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const startIndex = (page - 1) * pageSize;
  const paginatedEngagements = allFiltered.slice(startIndex, startIndex + pageSize);

  const filterOptions = extractFilterOptions(mockEngagements);

  return {
    metrics,
    departments,
    contributionData,
    engagements: {
      engagements: paginatedEngagements,
      total: allFiltered.length,
      page,
      pageSize,
      hasMore: startIndex + pageSize < allFiltered.length,
    },
    filterOptions,
  };
}

async function getMockEngagements(filters: EngagementFilters): Promise<EngagementsResponse> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const filtered = applyFilters(mockEngagements, filters);

  let sorted = [...filtered];
  if (filters.sortColumn) {
    const direction = filters.sortDirection === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      const aVal = a[filters.sortColumn as keyof Engagement];
      const bVal = b[filters.sortColumn as keyof Engagement];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * direction;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * direction;
      }
      return 0;
    });
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const startIndex = (page - 1) * pageSize;
  const paginated = sorted.slice(startIndex, startIndex + pageSize);

  return {
    engagements: paginated,
    total: filtered.length,
    page,
    pageSize,
    hasMore: startIndex + pageSize < filtered.length,
  };
}

async function getMockMetrics(filters: EngagementFilters): Promise<DashboardMetrics> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const period = filters.period || '1Y';
  const filtered = applyFilters(mockEngagements, { ...filters, period });

  return calculateMetrics(filtered, mockEngagements, period);
}

async function getMockDepartmentBreakdown(filters: EngagementFilters): Promise<DepartmentBreakdown> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const filtered = applyFilters(mockEngagements, filters);
  return calculateDepartmentBreakdown(filtered);
}

async function getMockContributionData(filters: EngagementFilters): Promise<ContributionDataResponse> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const filtered = applyFilters(mockEngagements, filters);
  return generateContributionDataResponse(filtered);
}

async function getMockCreateEngagement(engagement: Omit<Engagement, 'id'>): Promise<Engagement> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const newEngagement: Engagement = {
    ...engagement,
    id: Date.now(),
  };

  console.log('Created engagement:', newEngagement);
  return newEngagement;
}

async function getMockUpdateEngagement(
  id: number,
  updates: Partial<Omit<Engagement, 'id'>>
): Promise<Engagement> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const existing = mockEngagements.find(e => e.id === id);
  if (!existing) {
    throw new Error(`Engagement with id ${id} not found`);
  }

  const updated: Engagement = { ...existing, ...updates };
  console.log('Updated engagement:', updated);

  return updated;
}

async function getMockUpdateEngagementStatus(
  id: number,
  status: string
): Promise<{ id: number; status: string; dateFinished: string }> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY / 2);

  const dateFinished = status === 'Completed'
    ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return { id, status, dateFinished };
}

async function getMockUpdateEngagementNNA(
  id: number,
  nna: number | undefined
): Promise<{ id: number; nna: number | undefined }> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY / 2);

  return { id, nna };
}

async function getMockUpdateEngagementNotes(
  id: number,
  notes: string
): Promise<{ id: number; notes: string }> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY / 2);

  return { id, notes };
}

async function getMockDeleteEngagement(id: number): Promise<void> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  console.log('Deleted engagement:', id);
}

async function getMockExportEngagements(filters: EngagementFilters): Promise<Blob> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const filtered = applyFilters(mockEngagements, filters);

  const headers = [
    'ID', 'External Client', 'Internal Client', 'Department', 'Intake Type',
    'Project Type', 'Team Members', 'Date Started', 'Date Finished', 'Status',
    'Portfolio Logged', 'NNA', 'Notes'
  ];

  const rows = filtered.map(e => [
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
    e.nna ? formatNNA(e.nna) : '',
    e.notes || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getPeriodCutoffDate(period: string, referenceDate: Date = new Date('2025-01-28')): Date | null {
  switch (period) {
    case '1W':
      return new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '1M':
      return new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, referenceDate.getDate());
    case '3M':
      return new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 3, referenceDate.getDate());
    case '6M':
      return new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 6, referenceDate.getDate());
    case 'YTD':
      return new Date(referenceDate.getFullYear(), 0, 1);
    case '1Y':
      return new Date(referenceDate.getFullYear() - 1, referenceDate.getMonth(), referenceDate.getDate());
    case 'ALL':
      return null;
    default:
      return new Date(referenceDate.getFullYear() - 1, referenceDate.getMonth(), referenceDate.getDate());
  }
}

function getPeriodDates(period: string, referenceDate: Date = new Date('2025-01-28')) {
  switch (period) {
    case '1W': {
      const currentStart = new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { currentStart, previousStart, previousEnd, label: 'vs prev week' };
    }
    case '1M': {
      const currentStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, referenceDate.getDate());
      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 2, referenceDate.getDate());
      return { currentStart, previousStart, previousEnd, label: 'vs prev month' };
    }
    case '3M': {
      const currentStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 3, referenceDate.getDate());
      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 6, referenceDate.getDate());
      return { currentStart, previousStart, previousEnd, label: 'vs prev 3M' };
    }
    case '6M': {
      const currentStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 6, referenceDate.getDate());
      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 12, referenceDate.getDate());
      return { currentStart, previousStart, previousEnd, label: 'vs prev 6M' };
    }
    case 'YTD': {
      const currentStart = new Date(referenceDate.getFullYear(), 0, 1);
      const previousEnd = new Date(referenceDate.getFullYear() - 1, referenceDate.getMonth(), referenceDate.getDate());
      const previousStart = new Date(referenceDate.getFullYear() - 1, 0, 1);
      return { currentStart, previousStart, previousEnd, label: 'vs prev YTD' };
    }
    case '1Y':
    default: {
      const currentStart = new Date(referenceDate.getFullYear() - 1, referenceDate.getMonth(), referenceDate.getDate());
      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(referenceDate.getFullYear() - 2, referenceDate.getMonth(), referenceDate.getDate());
      return { currentStart, previousStart, previousEnd, label: 'YoY' };
    }
    case 'ALL': {
      const currentStart = new Date(2000, 0, 1);
      return { currentStart, previousStart: new Date(1990, 0, 1), previousEnd: new Date(1999, 11, 31), label: 'All Time' };
    }
  }
}

function formatNNA(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(0)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value}`;
}

function applyFilters(engagements: Engagement[], filters: EngagementFilters): Engagement[] {
  let filtered = [...engagements];

  if (filters.period) {
    const cutoffDate = getPeriodCutoffDate(filters.period);
    if (cutoffDate) {
      filtered = filtered.filter(e => new Date(e.dateStarted) >= cutoffDate);
    }
  }

  if (filters.teamMember && filters.teamMember !== 'All Team Members') {
    if (filters.teamMember === 'Charlotte Office') {
      filtered = filtered.filter(e => e.teamMembers.some(m => teamMemberOffices[m] === 'Charlotte'));
    } else if (filters.teamMember === 'Austin Office') {
      filtered = filtered.filter(e => e.teamMembers.some(m => teamMemberOffices[m] === 'Austin'));
    } else {
      filtered = filtered.filter(e => e.teamMembers.includes(filters.teamMember!));
    }
  }

  if (filters.departments && filters.departments.length > 0) {
    filtered = filtered.filter(e => filters.departments!.includes(e.internalClient.gcgDepartment));
  }

  if (filters.intakeTypes && filters.intakeTypes.length > 0) {
    filtered = filtered.filter(e => filters.intakeTypes!.includes(e.intakeType));
  }

  if (filters.projectTypes && filters.projectTypes.length > 0) {
    filtered = filtered.filter(e => filters.projectTypes!.includes(e.type));
  }

  if (filters.status) {
    filtered = filtered.filter(e => e.status === filters.status);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(e => {
      const officeMatch = e.teamMembers.some(member =>
        teamMemberOffices[member]?.toLowerCase().includes(searchLower)
      );
      return (
        (e.externalClient?.toLowerCase().includes(searchLower) ?? false) ||
        e.internalClient.name.toLowerCase().includes(searchLower) ||
        e.intakeType.toLowerCase().includes(searchLower) ||
        e.type.toLowerCase().includes(searchLower) ||
        e.internalClient.gcgDepartment.toLowerCase().includes(searchLower) ||
        officeMatch
      );
    });
  }

  return filtered;
}

function calculateMetrics(
  filtered: Engagement[],
  allEngagements: Engagement[],
  period: string
): DashboardMetrics {
  const periodDates = getPeriodDates(period);

  const grffsAndIrqs = filtered.filter(e => e.intakeType === 'GRRF' || e.intakeType === 'IRQ');
  const pcrsFromGrffsAndIrqs = grffsAndIrqs.filter(e => e.type === 'PCR').length;
  const clientProjects = grffsAndIrqs.length - pcrsFromGrffsAndIrqs;

  const prevPeriodGrffsAndIrqs = allEngagements.filter(e => {
    const startDate = new Date(e.dateStarted);
    return (e.intakeType === 'GRRF' || e.intakeType === 'IRQ') &&
      startDate >= periodDates.previousStart && startDate <= periodDates.previousEnd;
  });
  const prevClientProjects = prevPeriodGrffsAndIrqs.length - prevPeriodGrffsAndIrqs.filter(e => e.type === 'PCR').length;
  const clientProjectsChangePercent = prevClientProjects > 0
    ? Math.round(((clientProjects - prevClientProjects) / prevClientProjects) * 100)
    : (clientProjects > 0 ? 100 : 0);

  const nonPcrProjects = grffsAndIrqs.filter(e => e.type !== 'PCR');
  const irqCount = nonPcrProjects.filter(e => e.intakeType === 'IRQ').length;
  const grffCount = nonPcrProjects.filter(e => e.intakeType === 'GRRF').length;
  const totalProjects = irqCount + grffCount;
  const eligibleForPortfolio = filtered.filter(e =>
    (e.intakeType === 'GRRF' || e.intakeType === 'IRQ') && e.type !== 'PCR'
  );
  const portfoliosLogged = eligibleForPortfolio.filter(e => e.portfolioLogged).length;

  const gcgAdHocEngagements = filtered.filter(e => e.intakeType === 'GCG Ad-Hoc');
  const gcgAdHoc = gcgAdHocEngagements.length;

  const prevGcgAdHoc = allEngagements.filter(e => {
    const startDate = new Date(e.dateStarted);
    return e.intakeType === 'GCG Ad-Hoc' &&
      startDate >= periodDates.previousStart && startDate <= periodDates.previousEnd;
  }).length;
  const gcgAdHocChangePercent = prevGcgAdHoc > 0
    ? Math.round(((gcgAdHoc - prevGcgAdHoc) / prevGcgAdHoc) * 100)
    : (gcgAdHoc > 0 ? 100 : 0);

  const intakeCounts: Record<string, number> = { 'In-Person': 0, 'Email': 0, 'Teams': 0 };
  gcgAdHocEngagements.forEach(e => {
    if (e.adHocChannel && e.adHocChannel in intakeCounts) {
      intakeCounts[e.adHocChannel]++;
    }
  });
  const intakeColors: Record<string, string> = {
    'In-Person': '#a5f3fc',
    'Email': '#22d3ee',
    'Teams': '#0e7490',
  };

  const inProgress = filtered.filter(e => e.status === 'In Progress').length;
  const sparklinePoints = 8;
  const baseInProgress = Math.max(inProgress - 3, 5);
  const sparklineData = Array.from({ length: sparklinePoints }, (_, i) => ({
    value: baseInProgress + Math.floor(Math.random() * 4) + (i < sparklinePoints / 2 ? 0 : Math.floor(i / 2))
  }));
  sparklineData[sparklinePoints - 1] = { value: inProgress };
  const inProgressChange = inProgress - sparklineData[sparklinePoints - 2].value;

  const totalNNA = filtered.reduce((sum, e) => sum + (e.nna || 0), 0);
  const nnaProjectCount = filtered.filter(e => e.nna && e.nna > 0).length;
  const nnaEngagements = filtered.filter(e => e.nna && e.nna > 0);

  const prevPeriodNNA = allEngagements
    .filter(e => {
      const startDate = new Date(e.dateStarted);
      return startDate >= periodDates.previousStart && startDate <= periodDates.previousEnd;
    })
    .reduce((sum, e) => sum + (e.nna || 0), 0);
  const nnaChangePercent = prevPeriodNNA > 0
    ? Math.round(((totalNNA - prevPeriodNNA) / prevPeriodNNA) * 100)
    : (totalNNA > 0 ? 100 : 0);

  return {
    clientProjects: {
      count: clientProjects,
      changePercent: clientProjectsChangePercent,
      periodLabel: periodDates.label,
      intakeSourceBreakdown: {
        irqCount,
        irqPercent: totalProjects > 0 ? Math.round((irqCount / totalProjects) * 100) : 0,
        grffCount,
        grffPercent: totalProjects > 0 ? Math.round((grffCount / totalProjects) * 100) : 0,
        portfoliosLogged,
        portfoliosTotal: eligibleForPortfolio.length,
        portfoliosPercent: eligibleForPortfolio.length > 0 ? Math.round((portfoliosLogged / eligibleForPortfolio.length) * 100) : 0,
      },
    },
    gcgAdHoc: {
      count: gcgAdHoc,
      changePercent: gcgAdHocChangePercent,
      periodLabel: periodDates.label,
      intakeBreakdown: Object.entries(intakeCounts).map(([intake, count]) => ({
        intake,
        count,
        percent: gcgAdHoc > 0 ? Math.round((count / gcgAdHoc) * 100) : 0,
        color: intakeColors[intake] || '#71717a',
      })),
    },
    inProgress: {
      count: inProgress,
      change: inProgressChange,
      sparklineData,
    },
    nna: {
      total: totalNNA,
      projectCount: nnaProjectCount,
      changePercent: nnaChangePercent,
      tiers: [
        { label: '<$50M', count: nnaEngagements.filter(e => e.nna! < 50_000_000).length, color: '#0e7490' },
        { label: '$50-200M', count: nnaEngagements.filter(e => e.nna! >= 50_000_000 && e.nna! < 200_000_000).length, color: '#22d3ee' },
        { label: '$200M+', count: nnaEngagements.filter(e => e.nna! >= 200_000_000).length, color: '#39FF14' },
      ],
    },
  };
}

function calculateDepartmentBreakdown(filtered: Engagement[]): DepartmentBreakdown {
  const deptCounts: Record<string, number> = { IAG: 0, 'Broker-Dealer': 0, Institution: 0 };
  filtered.forEach(e => {
    deptCounts[e.internalClient.gcgDepartment]++;
  });

  const total = filtered.length || 1;
  const colors: Record<string, string> = { IAG: '#a5f3fc', 'Broker-Dealer': '#22d3ee', Institution: '#0e7490' };

  return {
    departments: Object.entries(deptCounts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count,
      color: colors[name] || '#71717a',
    })),
    total: filtered.length,
  };
}

function generateContributionDataResponse(filtered: Engagement[]): ContributionDataResponse {
  const weeks = generateContributionData(filtered);

  let maxCount = 0;
  let totalDays = 0;
  weeks.forEach(week => {
    week.forEach(day => {
      totalDays++;
      if (day.count > maxCount) maxCount = day.count;
    });
  });

  return { weeks, totalDays, maxCount };
}

function extractFilterOptions(engagements: Engagement[]): FilterOptions {
  const departments = new Set<string>();
  const intakeTypes = new Set<string>();
  const projectTypes = new Set<string>();
  const statuses = new Set<string>();

  engagements.forEach(e => {
    departments.add(e.internalClient.gcgDepartment);
    intakeTypes.add(e.intakeType);
    projectTypes.add(e.type);
    statuses.add(e.status);
  });

  return {
    teamMembers: ['All Team Members', 'Austin Office', 'Charlotte Office'],
    teamMemberGroups: [
      { label: 'Office', options: ['Austin Office', 'Charlotte Office'] },
    ],
    departments: Array.from(departments).sort(),
    intakeTypes: Array.from(intakeTypes).sort(),
    projectTypes: Array.from(projectTypes).sort(),
    statuses: Array.from(statuses).sort(),
  };
}

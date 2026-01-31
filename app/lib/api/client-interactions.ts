// API functions for Client Interactions Dashboard
// Optimized for minimal data transfer and maximum performance
// When connecting to FastAPI backend, replace mock implementations with fetch() calls

import type {
  Engagement,
  DayData,
  EngagementMetric,
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
// API Configuration
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Simulate network delay for development (set to 0 for production)
const SIMULATED_DELAY = process.env.NODE_ENV === 'development' ? 200 : 0;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// =============================================================================
// Request/Response Types
// =============================================================================

/** Filters for fetching engagements */
export interface EngagementFilters {
  search?: string;
  teamMember?: string;           // Single select: 'All Team Members', 'Austin Office', 'Charlotte Office', or member name
  departments?: string[];        // Multi-select filter
  intakeTypes?: string[];        // Multi-select filter
  projectTypes?: string[];       // Multi-select filter
  period?: string;               // '1W', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'
  status?: string;
  page?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
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

/** Contribution heatmap data */
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
// Helper Functions
// =============================================================================

/** Get cutoff date based on period filter */
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

/** Get period date ranges for comparison calculations */
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

/** Format NNA value for display */
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

/** Apply filters to engagements array (mock implementation) */
function applyFilters(engagements: Engagement[], filters: EngagementFilters): Engagement[] {
  let filtered = [...engagements];

  // Period filter
  if (filters.period) {
    const cutoffDate = getPeriodCutoffDate(filters.period);
    if (cutoffDate) {
      filtered = filtered.filter(e => new Date(e.dateStarted) >= cutoffDate);
    }
  }

  // Team member filter
  if (filters.teamMember && filters.teamMember !== 'All Team Members') {
    if (filters.teamMember === 'Charlotte Office') {
      filtered = filtered.filter(e => e.teamMembers.some(m => teamMemberOffices[m] === 'Charlotte'));
    } else if (filters.teamMember === 'Austin Office') {
      filtered = filtered.filter(e => e.teamMembers.some(m => teamMemberOffices[m] === 'Austin'));
    } else {
      filtered = filtered.filter(e => e.teamMembers.includes(filters.teamMember!));
    }
  }

  // Department filter (multi-select)
  if (filters.departments && filters.departments.length > 0) {
    filtered = filtered.filter(e => filters.departments!.includes(e.internalClient.gcgDepartment));
  }

  // Intake type filter (multi-select)
  if (filters.intakeTypes && filters.intakeTypes.length > 0) {
    filtered = filtered.filter(e => filters.intakeTypes!.includes(e.intakeType));
  }

  // Project type filter (multi-select)
  if (filters.projectTypes && filters.projectTypes.length > 0) {
    filtered = filtered.filter(e => filters.projectTypes!.includes(e.type));
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter(e => e.status === filters.status);
  }

  // Search filter
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

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch all dashboard data in a single optimized call
 * This is the primary endpoint for initial page load
 *
 * FastAPI endpoint: GET /api/client-interactions/dashboard
 *
 * @param filters - Optional filters to apply
 * @returns Combined dashboard data with metrics, charts, and paginated engagements
 */
export async function getDashboardData(filters: EngagementFilters = {}): Promise<DashboardData> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  // TODO: Replace with fetch(`${API_BASE_URL}/client-interactions/dashboard`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(filters),
  // })

  const period = filters.period || '1Y';
  const allFiltered = applyFilters(mockEngagements, { ...filters, period });

  // Calculate metrics
  const metrics = calculateMetrics(allFiltered, mockEngagements, period);

  // Calculate department breakdown
  const departments = calculateDepartmentBreakdown(allFiltered);

  // Generate contribution data
  const contributionData = generateContributionDataResponse(allFiltered);

  // Paginate engagements
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const startIndex = (page - 1) * pageSize;
  const paginatedEngagements = allFiltered.slice(startIndex, startIndex + pageSize);

  // Extract filter options
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

/**
 * Fetch paginated engagements with filters
 * Use this for table pagination and filtering after initial load
 *
 * FastAPI endpoint: GET /api/client-interactions/engagements
 */
export async function getEngagements(filters: EngagementFilters = {}): Promise<EngagementsResponse> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  // TODO: Replace with fetch(`${API_BASE_URL}/client-interactions/engagements?${params}`)

  const filtered = applyFilters(mockEngagements, filters);

  // Sort if specified
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

  // Paginate
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

/**
 * Fetch dashboard metrics only (for refreshing metrics without full reload)
 *
 * FastAPI endpoint: GET /api/client-interactions/metrics
 */
export async function getMetrics(filters: EngagementFilters = {}): Promise<DashboardMetrics> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const period = filters.period || '1Y';
  const filtered = applyFilters(mockEngagements, { ...filters, period });

  return calculateMetrics(filtered, mockEngagements, period);
}

/**
 * Fetch department breakdown only
 *
 * FastAPI endpoint: GET /api/client-interactions/departments
 */
export async function getDepartmentBreakdown(filters: EngagementFilters = {}): Promise<DepartmentBreakdown> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const filtered = applyFilters(mockEngagements, filters);
  return calculateDepartmentBreakdown(filtered);
}

/**
 * Fetch contribution heatmap data
 *
 * FastAPI endpoint: GET /api/client-interactions/contribution-data
 */
export async function getContributionData(filters: EngagementFilters = {}): Promise<ContributionDataResponse> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  const filtered = applyFilters(mockEngagements, filters);
  return generateContributionDataResponse(filtered);
}

/**
 * Create a new engagement
 *
 * FastAPI endpoint: POST /api/client-interactions/engagements
 */
export async function createEngagement(engagement: Omit<Engagement, 'id'>): Promise<Engagement> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  // TODO: Replace with fetch(`${API_BASE_URL}/client-interactions/engagements`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(engagement),
  // })

  const newEngagement: Engagement = {
    ...engagement,
    id: Date.now(),
  };

  // In production, the backend would persist this
  console.log('Created engagement:', newEngagement);

  return newEngagement;
}

/**
 * Update an existing engagement
 *
 * FastAPI endpoint: PATCH /api/client-interactions/engagements/:id
 */
export async function updateEngagement(
  id: number,
  updates: Partial<Omit<Engagement, 'id'>>
): Promise<Engagement> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  // TODO: Replace with fetch(`${API_BASE_URL}/client-interactions/engagements/${id}`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(updates),
  // })

  const existing = mockEngagements.find(e => e.id === id);
  if (!existing) {
    throw new Error(`Engagement with id ${id} not found`);
  }

  const updated: Engagement = { ...existing, ...updates };
  console.log('Updated engagement:', updated);

  return updated;
}

/**
 * Update engagement status (optimized endpoint for quick status changes)
 *
 * FastAPI endpoint: PATCH /api/client-interactions/engagements/:id/status
 */
export async function updateEngagementStatus(
  id: number,
  status: string
): Promise<{ id: number; status: string; dateFinished: string }> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY / 2); // Faster for status updates

  const dateFinished = status === 'Completed'
    ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : status === 'In Progress' ? '—' : '—';

  return { id, status, dateFinished };
}

/**
 * Update engagement NNA (optimized endpoint for quick NNA updates)
 *
 * FastAPI endpoint: PATCH /api/client-interactions/engagements/:id/nna
 */
export async function updateEngagementNNA(
  id: number,
  nna: number | undefined
): Promise<{ id: number; nna: number | undefined }> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY / 2);

  return { id, nna };
}

/**
 * Update engagement notes (optimized endpoint for quick notes updates)
 *
 * FastAPI endpoint: PATCH /api/client-interactions/engagements/:id/notes
 */
export async function updateEngagementNotes(
  id: number,
  notes: string
): Promise<{ id: number; notes: string }> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY / 2);

  return { id, notes };
}

/**
 * Delete an engagement
 *
 * FastAPI endpoint: DELETE /api/client-interactions/engagements/:id
 */
export async function deleteEngagement(id: number): Promise<void> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  console.log('Deleted engagement:', id);
}

/**
 * Export engagements to CSV
 *
 * FastAPI endpoint: GET /api/client-interactions/engagements/export
 */
export async function exportEngagements(filters: EngagementFilters = {}): Promise<Blob> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  // TODO: Replace with fetch for server-generated CSV
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
// Internal Calculation Functions (would be on backend in production)
// =============================================================================

function calculateMetrics(
  filtered: Engagement[],
  allEngagements: Engagement[],
  period: string
): DashboardMetrics {
  const periodDates = getPeriodDates(period);

  // Client Projects = GRRFs + IRQs - PCRs
  const grffsAndIrqs = filtered.filter(e => e.intakeType === 'GRRF' || e.intakeType === 'IRQ');
  const pcrsFromGrffsAndIrqs = grffsAndIrqs.filter(e => e.type === 'PCR').length;
  const clientProjects = grffsAndIrqs.length - pcrsFromGrffsAndIrqs;

  // Previous period client projects
  const prevPeriodGrffsAndIrqs = allEngagements.filter(e => {
    const startDate = new Date(e.dateStarted);
    return (e.intakeType === 'GRRF' || e.intakeType === 'IRQ') &&
      startDate >= periodDates.previousStart && startDate <= periodDates.previousEnd;
  });
  const prevClientProjects = prevPeriodGrffsAndIrqs.length - prevPeriodGrffsAndIrqs.filter(e => e.type === 'PCR').length;
  const clientProjectsChangePercent = prevClientProjects > 0
    ? Math.round(((clientProjects - prevClientProjects) / prevClientProjects) * 100)
    : (clientProjects > 0 ? 100 : 0);

  // Intake source breakdown
  const nonPcrProjects = grffsAndIrqs.filter(e => e.type !== 'PCR');
  const irqCount = nonPcrProjects.filter(e => e.intakeType === 'IRQ').length;
  const grffCount = nonPcrProjects.filter(e => e.intakeType === 'GRRF').length;
  const totalProjects = irqCount + grffCount;
  const eligibleForPortfolio = filtered.filter(e =>
    (e.intakeType === 'GRRF' || e.intakeType === 'IRQ') && e.type !== 'PCR'
  );
  const portfoliosLogged = eligibleForPortfolio.filter(e => e.portfolioLogged).length;

  // GCG Ad-Hoc
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

  // Intake breakdown for GCG Ad-Hoc
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

  // In Progress
  const inProgress = filtered.filter(e => e.status === 'In Progress').length;
  const sparklinePoints = 8;
  const baseInProgress = Math.max(inProgress - 3, 5);
  const sparklineData = Array.from({ length: sparklinePoints }, (_, i) => ({
    value: baseInProgress + Math.floor(Math.random() * 4) + (i < sparklinePoints / 2 ? 0 : Math.floor(i / 2))
  }));
  sparklineData[sparklinePoints - 1] = { value: inProgress };
  const inProgressChange = inProgress - sparklineData[sparklinePoints - 2].value;

  // NNA
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

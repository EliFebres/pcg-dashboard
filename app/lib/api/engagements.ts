// API functions for Client Engagements Dashboard
// When connecting to FastAPI, replace the mock data imports with fetch() calls

import {
  engagementMetrics,
  departmentBreakdown,
  engagements,
  generateContributionData,
} from '../data/engagements';
import type {
  EngagementMetric,
  DepartmentData,
  Engagement,
  DayData,
} from '../types/engagements';

// Simulate network delay (remove when connecting to real API)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Configure simulated delay (set to 0 for instant loading, or remove delays for production)
const SIMULATED_DELAY = 300;

export interface EngagementsFilters {
  search?: string;
  department?: string;
  type?: string;
  status?: string;
  teamMember?: string;
}

/**
 * Fetch engagement metrics (KPIs)
 * FastAPI endpoint: GET /api/engagements/metrics
 */
export async function getEngagementMetrics(): Promise<EngagementMetric[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/engagements/metrics')
  return engagementMetrics;
}

/**
 * Fetch department breakdown data for charts
 * FastAPI endpoint: GET /api/engagements/departments
 */
export async function getDepartmentBreakdown(): Promise<DepartmentData[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/engagements/departments')
  return departmentBreakdown;
}

/**
 * Fetch engagements list with optional filters
 * FastAPI endpoint: GET /api/engagements?search=...&department=...
 */
export async function getEngagements(filters?: EngagementsFilters): Promise<Engagement[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch(`/api/engagements?${new URLSearchParams(filters)}`)

  let filtered = [...engagements];

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(e =>
      e.client.toLowerCase().includes(searchLower) ||
      e.teamMembers.some(m => m.toLowerCase().includes(searchLower))
    );
  }

  if (filters?.department) {
    filtered = filtered.filter(e => e.department === filters.department);
  }

  if (filters?.type) {
    filtered = filtered.filter(e => e.type === filters.type);
  }

  if (filters?.status) {
    filtered = filtered.filter(e => e.status === filters.status);
  }

  return filtered;
}

/**
 * Fetch contribution graph data (GitHub-style heatmap)
 * FastAPI endpoint: GET /api/engagements/contribution-data
 */
export async function getContributionData(): Promise<DayData[][]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/engagements/contribution-data')
  return generateContributionData();
}

/**
 * Fetch all engagements dashboard data in one call (for initial load)
 * FastAPI endpoint: GET /api/engagements/dashboard
 */
export async function getEngagementsDashboardData() {
  // Fetch all data in parallel for faster loading
  const [metrics, departments, engagementsList, contributionData] = await Promise.all([
    getEngagementMetrics(),
    getDepartmentBreakdown(),
    getEngagements(),
    getContributionData(),
  ]);

  return {
    metrics,
    departments,
    engagements: engagementsList,
    contributionData,
  };
}

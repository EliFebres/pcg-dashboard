// API functions for Client Engagements Dashboard
// When connecting to FastAPI, replace the mock data imports with fetch() calls

import {
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
 * Calculates metrics dynamically from engagements data
 * FastAPI endpoint: GET /api/engagements/metrics
 */
export async function getEngagementMetrics(): Promise<EngagementMetric[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/engagements/metrics')

  // Calculate metrics from actual engagements data
  // Projects = all engagements EXCEPT Touch Points
  const projects = engagements.filter(e => e.intakeType !== 'Touch Points');
  const projectCount = projects.length;

  // In Progress = projects (non-Touch Points) with status "In Progress"
  const inProgressCount = projects.filter(e => e.status === 'In Progress').length;

  // Portfolios Logged = projects (non-Touch Points) where portfolioLogged is true
  const portfoliosLoggedCount = projects.filter(e => e.portfolioLogged).length;
  const portfoliosLoggedPct = projectCount > 0
    ? Math.round((portfoliosLoggedCount / projectCount) * 100)
    : 0;

  // Touch Points = engagements with intakeType "Touch Points"
  const touchPointsCount = engagements.filter(e => e.intakeType === 'Touch Points').length;

  return [
    {
      label: 'Projects',
      sublabel: '1YR',
      value: projectCount.toString(),
      change: '+12%',
      isPositive: true,
      icon: 'FileText'
    },
    {
      label: 'In Progress',
      sublabel: 'Current',
      value: inProgressCount.toString(),
      change: `+${inProgressCount}`,
      isPositive: true,
      icon: 'PlayCircle'
    },
    {
      label: 'Portfolios Logged',
      sublabel: '1YR',
      value: portfoliosLoggedCount.toString(),
      change: `${portfoliosLoggedPct}%`,
      isPositive: portfoliosLoggedPct >= 80,
      icon: 'CheckCircle2'
    },
    {
      label: 'Touch Points',
      sublabel: '1YR',
      value: touchPointsCount.toString(),
      change: '+18%',
      isPositive: true,
      icon: 'MessageSquare'
    },
  ];
}

/**
 * Fetch department breakdown data for charts
 * Calculates breakdown dynamically from engagements data
 * FastAPI endpoint: GET /api/engagements/departments
 */
export async function getDepartmentBreakdown(): Promise<DepartmentData[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/engagements/departments')

  // Count engagements by department (excluding Touch Points to match Projects metric)
  const departmentCounts: Record<string, number> = {
    'IAG': 0,
    'Broker-Dealer': 0,
    'Institution': 0,
  };

  for (const engagement of engagements) {
    if (engagement.intakeType !== 'Touch Points') {
      const dept = engagement.department;
      if (dept in departmentCounts) {
        departmentCounts[dept]++;
      }
    }
  }

  // Calculate total for percentage
  const total = Object.values(departmentCounts).reduce((sum, count) => sum + count, 0);

  // Department colors matching the existing theme
  const departmentColors: Record<string, string> = {
    'IAG': '#22d3ee',
    'Broker-Dealer': '#a78bfa',
    'Institution': '#fb923c',
  };

  // Return both percentage (for bar width) and count (for display)
  return Object.entries(departmentCounts).map(([name, count]) => ({
    name,
    value: total > 0 ? Math.round((count / total) * 100) : 0,
    count,
    color: departmentColors[name] || '#71717a',
  }));
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
      (e.externalClient?.toLowerCase().includes(searchLower) ?? false) ||
      e.internalClient.name.toLowerCase().includes(searchLower) ||
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

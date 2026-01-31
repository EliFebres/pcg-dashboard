// API functions for Client Engagements Dashboard
// When connecting to FastAPI, replace the mock data imports with fetch() calls

import {
  engagements,
  generateContributionData,
  teamMemberOffices,
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
  // Projects = all engagements EXCEPT GCG Ad-Hoc
  const projects = engagements.filter(e => e.intakeType !== 'GCG Ad-Hoc');
  const projectCount = projects.length;

  // In Progress = projects (non-GCG Ad-Hoc) with status "In Progress"
  const inProgressCount = projects.filter(e => e.status === 'In Progress').length;

  // NNA (Net New Assets) = sum of all NNA values across all engagements
  const totalNNA = engagements.reduce((sum, e) => sum + (e.nna || 0), 0);
  const nnaCount = engagements.filter(e => e.nna && e.nna > 0).length;

  // GCG Ad-Hoc = engagements with intakeType "GCG Ad-Hoc"
  const gcgAdHocCount = engagements.filter(e => e.intakeType === 'GCG Ad-Hoc').length;

  // Format NNA as currency string
  const formatNNA = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(0)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

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
      label: 'NNA',
      sublabel: '1YR',
      value: formatNNA(totalNNA),
      change: `${nnaCount} projects`,
      isPositive: true,
      icon: 'DollarSign'
    },
    {
      label: 'GCG Ad-Hoc',
      sublabel: '1YR',
      value: gcgAdHocCount.toString(),
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

  // Count engagements by department (excluding GCG Ad-Hoc to match Projects metric)
  const departmentCounts: Record<string, number> = {
    'IAG': 0,
    'Broker-Dealer': 0,
    'Institution': 0,
  };

  for (const engagement of engagements) {
    if (engagement.intakeType !== 'GCG Ad-Hoc') {
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
    // Note: Team members are intentionally excluded from search for privacy
    // Users can only filter by team member using the dedicated dropdown
    // But office location IS searchable
    filtered = filtered.filter(e => {
      // Check if any team member's office matches the search
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

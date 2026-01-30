// Types for Client Engagements Dashboard

export interface DayData {
  date: Date;
  level: number;
  count: number;
  projectCount: number;
  touchPointCount: number;
}

export interface EngagementMetric {
  label: string;
  sublabel: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string; // Icon name as string - component will map to actual icon
  percent?: number; // Optional percentage for progress bar visualization
  sparklineData?: { value: number }[]; // Optional sparkline data for trend visualization
  pieData?: { name: string; value: number; color: string }[]; // Optional pie chart data for breakdown visualization
  stackedBarData?: { month: string; IAG: number; 'Broker-Dealer': number; Institution: number }[]; // Optional stacked bar data
}

export interface DepartmentData {
  name: string;
  value: number; // Percentage for bar width (sums to 100)
  count: number; // Raw count for display
  color: string;
}

export interface InternalClient {
  name: string;
  gcgDepartment: 'IAG' | 'Broker-Dealer' | 'Institution';
}

export interface Engagement {
  id: number;
  externalClient: string | null; // Optional - Touch Points may not have an external client
  internalClient: InternalClient; // Contact/relationship owner/salesperson
  intakeType: 'IRQ' | 'GRRF' | 'Touch Points';
  type: string; // Project Type
  teamMembers: string[];
  department: string;
  dateStarted: string;
  dateFinished: string;
  status: string;
  portfolioLogged: boolean;
  hasNotes: boolean;
}

export interface ContributionData {
  weeks: DayData[][];
}

// API Response types (for future FastAPI integration)
export interface EngagementsResponse {
  engagements: Engagement[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MetricsResponse {
  metrics: EngagementMetric[];
}

export interface DepartmentBreakdownResponse {
  departments: DepartmentData[];
}

export interface ContributionDataResponse {
  data: ContributionData;
}

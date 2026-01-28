// Types for Client Engagements Dashboard

export interface DayData {
  date: Date;
  level: number;
  count: number;
}

export interface EngagementMetric {
  label: string;
  sublabel: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string; // Icon name as string - component will map to actual icon
}

export interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

export interface Engagement {
  id: number;
  client: string;
  type: string;
  teamMembers: string[];
  department: string;
  dateStarted: string;
  dateFinished: string;
  status: string;
  portfolioLogged: boolean;
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

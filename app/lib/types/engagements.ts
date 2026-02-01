// Types for Client Engagements Dashboard

export type GCGAdHocChannel = 'In-Person' | 'Email' | 'Teams';

export interface DayData {
  date: Date;
  level: number;
  count: number;
  projectCount: number;
  adHocCount: number;
}

export interface IntakeBreakdown {
  intake: string;
  count: number;
  percent: number;
  color: string;
}

export interface IntakeSourceBreakdown {
  irqCount: number;
  irqPercent: number;
  grffCount: number;
  grffPercent: number;
  portfoliosLogged: number;
  portfoliosTotal: number;
  portfoliosPercent: number;
}

export interface NNATier {
  label: string;
  count: number;
  color: string;
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
  intakeBreakdown?: IntakeBreakdown[]; // Optional intake breakdown for GCG Ad-Hoc
  intakeSourceBreakdown?: IntakeSourceBreakdown; // Optional intake source breakdown for Client Projects
  nnaTiers?: NNATier[]; // Optional NNA distribution tiers
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

export type AssetClass = 'Equity' | 'Fixed Income' | 'Alternatives';

export interface PortfolioHolding {
  identifier: string; // Ticker, ISIN, or CUSIP
  assetClass: AssetClass;
  weight: number; // Normalized weight (0-1, sums to 1)
}

export interface Engagement {
  id: number;
  externalClient: string | null; // Optional - GCG Ad-Hoc may not have an external client
  internalClient: InternalClient; // Contact/relationship owner/salesperson
  intakeType: 'IRQ' | 'GRRF' | 'GCG Ad-Hoc';
  adHocChannel?: GCGAdHocChannel; // Only applicable when intakeType is 'GCG Ad-Hoc'
  type: string; // Project Type
  teamMembers: string[];
  department: string;
  dateStarted: string;
  dateFinished: string;
  status: string;
  portfolioLogged: boolean;
  portfolio?: PortfolioHolding[]; // Optional client portfolio holdings
  nna?: number; // Net New Assets - dollar amount of AUM moved into funds (optional)
  notes?: string; // Optional notes field
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

// Types for Trends Dashboard

export interface PortfolioMetric {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  benchmark: string | null;
}

export interface BenchmarkComparison {
  metric: string;
  client: number;
  acwi: number;
  delta: number;
}

export interface HotTicker {
  rank: number;
  type: string;
  ticker: string;
  name: string;
  requests: number;
  trend: string;
  dfaCompetitor: string;
  dfaName: string;
  returnComparison: {
    competitor: number;
    dfa: number;
    delta: string;
  };
  expenseRatio: {
    competitor: number;
    dfa: number;
  };
  aum: {
    competitor: string;
    dfa: string;
  };
  hasNotes: boolean;
  hasTalkingPoints: boolean;
}

export interface PopularDFATicker {
  rank: number;
  ticker: string;
  name: string;
  holdings: number;
  pctModels: string;
  trend: string;
}

export interface TickerTrend {
  month: string;
  DFUS: number;
  DFAI: number;
  DFAE: number;
}

// API Response types (for future FastAPI integration)
export interface PortfolioMetricsResponse {
  equityMetrics: PortfolioMetric[];
  fixedIncomeMetrics: PortfolioMetric[];
}

export interface BenchmarkComparisonResponse {
  comparisons: BenchmarkComparison[];
}

export interface HotTickersResponse {
  tickers: HotTicker[];
}

export interface PopularDFATickersResponse {
  tickers: PopularDFATicker[];
}

export interface TickerTrendsResponse {
  trends: TickerTrend[];
}

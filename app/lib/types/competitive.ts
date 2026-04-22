// Types for Fund Intel / Competitive Landscape Dashboard

// ============================================================
// SHARED TYPES
// ============================================================

export interface PerformanceReturns {
  qtd?: number | null;
  ytd?: number | null;
  oneYear: number | null;
  threeYear: number | null;
  fiveYear: number | null;
  tenYear: number | null;
  sinceCommonInception?: number | null;
}

export interface FirmWins {
  expenseRatio: boolean;
  oneYear: boolean;
  threeYear: boolean;
  fiveYear: boolean;
  tenYear: boolean;
  holdings: boolean;
  priceToBook: boolean;    // Lower P/B = win for value funds
  dividendYield: boolean;  // Higher yield = win
  total: number;
  outOf: number;
}

export type FundCategory =
  | 'US Equity'
  | 'Dev Ex US Equity'
  | 'Emerging Markets Equity'
  | 'Global Equity'
  | 'Real Estate'
  | 'Fixed Income'
  | 'Core'
  | 'Short-Term';

export interface CompetitiveNoteEntry {
  id: number;
  fundId: string;
  noteText: string;
  authorName: string;
  authorId: string;
  createdAt: string;
}

// ============================================================
// EQUITY & FIXED INCOME COMPARISON
// ============================================================

export interface FundComparisonRow {
  id: string;
  rank: number;
  category: FundCategory;

  competitorTicker: string;
  competitorName: string;
  competitorExpenseRatio: number;
  competitorReturns: PerformanceReturns;
  competitorHoldings: number;
  competitorPriceToBook: number | null;
  competitorDividendYield: number | null;

  firmTicker: string;
  firmName: string;
  firmExpenseRatio: number;
  firmReturns: PerformanceReturns;
  firmHoldings: number;
  firmPriceToBook: number | null;
  firmDividendYield: number | null;

  firmWins: FirmWins;
  noteCount: number;
}

// ============================================================
// VS. COMPETITOR COMPARISON
// ============================================================

export interface FundCharacteristics {
  holdings: number | null;
  marketCap: string | null;        // e.g. "$85.2B"
  priceToBook: number | null;
  profitability: number | null;    // % of portfolio
  valueAllocation: number | null;  // % allocation
  growthAllocation: number | null; // % allocation
  // Fixed income
  duration?: number | null;        // years
  secYield?: number | null;        // percent
}

export interface CompetitorComparisonRow {
  id: string;
  category: FundCategory;

  competitorTicker: string;
  competitorName: string;
  competitorExpenseRatio: number;
  competitorReturns: PerformanceReturns;
  competitorCharacteristics?: FundCharacteristics;

  firmTicker: string;
  firmName: string;
  firmExpenseRatio: number;
  firmReturns: PerformanceReturns;
  firmCharacteristics?: FundCharacteristics;

  commonInceptionDate: string;

  firmWinsOneYear: boolean | null;
  firmWinsThreeYear: boolean | null;
  firmWinsFiveYear: boolean | null;
  firmWinsTenYear: boolean | null;
  firmWinsSinceInception: boolean | null;
  firmWinsExpenseRatio: boolean;

  noteCount: number;
}

export interface CompetitorSummary {
  totalComparisons: number;
  firmWinning: number;
  competitorWinning: number;
  tied: number;
}

export interface CompetitorTimeSeries {
  date: string;
  firmWins: number;
  competitorWins: number;
  delta: number;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface CompetitiveFundsResponse {
  funds: FundComparisonRow[];
  total: number;
  asOfDate: string;
}

export interface CompetitorComparisonResponse {
  funds: CompetitorComparisonRow[];
  summary: CompetitorSummary;
  timeSeries: CompetitorTimeSeries[];
  asOfDate: string;
}

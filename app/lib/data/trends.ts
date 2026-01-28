// Data and functions for Trends Dashboard

import type {
  PortfolioMetric,
  BenchmarkComparison,
  HotTicker,
  LoggedPortfolio,
  DFAAlternative,
  TickerCount,
  ComputedHotTicker,
  ComputedPopularDFATicker,
  ComputedTickerTrend,
  FilterOptions,
} from '../types/trends';

export const hotTickers: HotTicker[] = [
  {
    rank: 1,
    type: 'Challenging',
    ticker: 'IJR',
    name: 'iShares Core S&P Small-Cap',
    requests: 52,
    trend: '+18%',
    dfaCompetitor: 'DFAS',
    dfaName: 'US Small Cap',
    returnComparison: { competitor: 12.4, dfa: 9.8, delta: '-2.6%' },
    expenseRatio: { competitor: 0.06, dfa: 0.27 },
    aum: { competitor: '82B', dfa: '14B' },
    hasNotes: true,
    hasTalkingPoints: true
  },
  {
    rank: 2,
    type: 'Replacement',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    requests: 47,
    trend: '+12%',
    dfaCompetitor: 'DFUS',
    dfaName: 'US Core Equity 1',
    returnComparison: { competitor: 24.8, dfa: 25.1, delta: '+0.3%' },
    expenseRatio: { competitor: 0.03, dfa: 0.12 },
    aum: { competitor: '428B', dfa: '32B' },
    hasNotes: true,
    hasTalkingPoints: true
  },
  {
    rank: 3,
    type: 'Replacement',
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market',
    requests: 38,
    trend: '+8%',
    dfaCompetitor: 'DFUS',
    dfaName: 'US Core Equity 1',
    returnComparison: { competitor: 24.2, dfa: 25.1, delta: '+0.9%' },
    expenseRatio: { competitor: 0.03, dfa: 0.12 },
    aum: { competitor: '389B', dfa: '32B' },
    hasNotes: false,
    hasTalkingPoints: true
  },
  {
    rank: 4,
    type: 'Complement',
    ticker: 'VXUS',
    name: 'Vanguard Total Intl Stock',
    requests: 31,
    trend: '+15%',
    dfaCompetitor: 'DFAI',
    dfaName: 'Intl Core Equity',
    returnComparison: { competitor: 8.2, dfa: 9.1, delta: '+0.9%' },
    expenseRatio: { competitor: 0.08, dfa: 0.18 },
    aum: { competitor: '67B', dfa: '12B' },
    hasNotes: true,
    hasTalkingPoints: false
  },
  {
    rank: 5,
    type: 'Replacement',
    ticker: 'BND',
    name: 'Vanguard Total Bond Market',
    requests: 28,
    trend: '-3%',
    dfaCompetitor: 'DFCF',
    dfaName: 'Core Fixed Income',
    returnComparison: { competitor: 1.2, dfa: 1.8, delta: '+0.6%' },
    expenseRatio: { competitor: 0.03, dfa: 0.15 },
    aum: { competitor: '108B', dfa: '8B' },
    hasNotes: false,
    hasTalkingPoints: true
  },
  {
    rank: 6,
    type: 'Complement',
    ticker: 'VEA',
    name: 'Vanguard FTSE Developed',
    requests: 24,
    trend: '+5%',
    dfaCompetitor: 'DFAI',
    dfaName: 'Intl Core Equity',
    returnComparison: { competitor: 9.8, dfa: 9.1, delta: '-0.7%' },
    expenseRatio: { competitor: 0.06, dfa: 0.18 },
    aum: { competitor: '142B', dfa: '12B' },
    hasNotes: false,
    hasTalkingPoints: false
  },
];

// Logged Portfolios - Client portfolio data that has been logged
export const loggedPortfolios: LoggedPortfolio[] = [
  {
    id: 1,
    externalClient: 'Vanguard Advisors',
    internalClient: { name: 'Jennifer Martinez', gcgDepartment: 'IAG' },
    loggedBy: 'Eli F.',
    loggedAt: 'Jan 15, 2026',
    dataAsOf: 'Dec 31, 2025',
    positions: [
      { ticker: 'DFUS', name: 'DFA US Core Equity 1', weight: 0.35 },
      { ticker: 'DFAI', name: 'DFA Intl Core Equity', weight: 0.20 },
      { ticker: 'DFAE', name: 'DFA Emerging Core Equity', weight: 0.05 },
      { ticker: 'DFSV', name: 'DFA US Small Cap Value', weight: 0.10 },
      { ticker: 'DFIV', name: 'DFA Intl Small Cap Value', weight: 0.05 },
      { ticker: 'DFCF', name: 'DFA Core Fixed Income', weight: 0.15 },
      { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', weight: 0.10 },
    ],
    characteristics: {
      weightedAvgMarketCap: 285.4,
      weightedAvgPB: 2.8,
      weightedAvgProfitability: 0.42,
      valueAllocation: 48,
      growthAllocation: 52,
      usEquityAllocation: 55,
      devExUsAllocation: 25,
      emAllocation: 5,
      duration: 4.2,
      avgCreditQuality: 'AA',
      avgYield: 4.5,
    },
    returns: {
      oneYear: 18.4,
      threeYear: 8.2,
      fiveYear: 10.1,
      tenYear: 9.8,
      fifteenYear: null,
      twentyYear: null,
    },
  },
  {
    id: 2,
    externalClient: 'Fidelity Wealth Management',
    internalClient: { name: 'Michael Thompson', gcgDepartment: 'Broker-Dealer' },
    loggedBy: 'Sarah K.',
    loggedAt: 'Jan 12, 2026',
    dataAsOf: 'Dec 31, 2025',
    positions: [
      { ticker: 'DFUS', name: 'DFA US Core Equity 1', weight: 0.40 },
      { ticker: 'DFAI', name: 'DFA Intl Core Equity', weight: 0.25 },
      { ticker: 'DFAE', name: 'DFA Emerging Core Equity', weight: 0.10 },
      { ticker: 'DFCF', name: 'DFA Core Fixed Income', weight: 0.20 },
      { ticker: 'DFLV', name: 'DFA US Large Cap Value', weight: 0.05 },
    ],
    characteristics: {
      weightedAvgMarketCap: 320.1,
      weightedAvgPB: 3.1,
      weightedAvgProfitability: 0.45,
      valueAllocation: 42,
      growthAllocation: 58,
      usEquityAllocation: 45,
      devExUsAllocation: 25,
      emAllocation: 10,
      duration: 5.1,
      avgCreditQuality: 'A+',
      avgYield: 4.8,
    },
    returns: {
      oneYear: 16.8,
      threeYear: 7.5,
      fiveYear: 9.2,
      tenYear: 8.9,
      fifteenYear: 8.1,
      twentyYear: null,
    },
  },
  {
    id: 3,
    externalClient: 'Northern Trust Wealth',
    internalClient: { name: 'Christopher Lee', gcgDepartment: 'Institution' },
    loggedBy: 'Mike R.',
    loggedAt: 'Jan 10, 2026',
    dataAsOf: 'Dec 31, 2025',
    positions: [
      { ticker: 'DFUS', name: 'DFA US Core Equity 1', weight: 0.30 },
      { ticker: 'DFAC', name: 'DFA US Core Equity 2', weight: 0.15 },
      { ticker: 'DFAI', name: 'DFA Intl Core Equity', weight: 0.15 },
      { ticker: 'DFAE', name: 'DFA Emerging Core Equity', weight: 0.08 },
      { ticker: 'DFSV', name: 'DFA US Small Cap Value', weight: 0.12 },
      { ticker: 'DFCF', name: 'DFA Core Fixed Income', weight: 0.20 },
    ],
    characteristics: {
      weightedAvgMarketCap: 195.8,
      weightedAvgPB: 2.4,
      weightedAvgProfitability: 0.38,
      valueAllocation: 55,
      growthAllocation: 45,
      usEquityAllocation: 57,
      devExUsAllocation: 15,
      emAllocation: 8,
      duration: 5.5,
      avgCreditQuality: 'AA-',
      avgYield: 4.6,
    },
    returns: {
      oneYear: 19.2,
      threeYear: 9.1,
      fiveYear: 10.8,
      tenYear: 10.2,
      fifteenYear: 9.4,
      twentyYear: 8.8,
    },
  },
  {
    id: 4,
    externalClient: 'Raymond James Financial',
    internalClient: { name: 'Amanda Foster', gcgDepartment: 'IAG' },
    loggedBy: 'Lisa M.',
    loggedAt: 'Jan 8, 2026',
    dataAsOf: 'Dec 31, 2025',
    positions: [
      { ticker: 'DFUS', name: 'DFA US Core Equity 1', weight: 0.45 },
      { ticker: 'DFAI', name: 'DFA Intl Core Equity', weight: 0.20 },
      { ticker: 'DFSV', name: 'DFA US Small Cap Value', weight: 0.15 },
      { ticker: 'VTI', name: 'Vanguard Total Stock Market', weight: 0.10 },
      { ticker: 'BND', name: 'Vanguard Total Bond Market', weight: 0.10 },
    ],
    characteristics: {
      weightedAvgMarketCap: 310.5,
      weightedAvgPB: 3.0,
      weightedAvgProfitability: 0.44,
      valueAllocation: 46,
      growthAllocation: 54,
      usEquityAllocation: 70,
      devExUsAllocation: 20,
      emAllocation: 0,
      duration: 3.8,
      avgCreditQuality: 'A',
      avgYield: 4.2,
    },
    returns: {
      oneYear: 20.1,
      threeYear: 8.8,
      fiveYear: 10.5,
      tenYear: null,
      fifteenYear: null,
      twentyYear: null,
    },
  },
  {
    id: 5,
    externalClient: 'Morgan Stanley Private',
    internalClient: { name: 'Jessica Williams', gcgDepartment: 'Broker-Dealer' },
    loggedBy: 'James T.',
    loggedAt: 'Jan 5, 2026',
    dataAsOf: 'Dec 31, 2025',
    positions: [
      { ticker: 'DFUS', name: 'DFA US Core Equity 1', weight: 0.25 },
      { ticker: 'DFAI', name: 'DFA Intl Core Equity', weight: 0.15 },
      { ticker: 'DFAE', name: 'DFA Emerging Core Equity', weight: 0.05 },
      { ticker: 'DFIV', name: 'DFA Intl Small Cap Value', weight: 0.10 },
      { ticker: 'DFCF', name: 'DFA Core Fixed Income', weight: 0.30 },
      { ticker: 'DFSD', name: 'DFA Short Duration Fixed Income', weight: 0.15 },
    ],
    characteristics: {
      weightedAvgMarketCap: 245.2,
      weightedAvgPB: 2.6,
      weightedAvgProfitability: 0.40,
      valueAllocation: 50,
      growthAllocation: 50,
      usEquityAllocation: 25,
      devExUsAllocation: 25,
      emAllocation: 5,
      duration: 4.8,
      avgCreditQuality: 'AA+',
      avgYield: 5.1,
    },
    returns: {
      oneYear: 12.4,
      threeYear: 6.2,
      fiveYear: 7.8,
      tenYear: 7.5,
      fifteenYear: 7.2,
      twentyYear: null,
    },
  },
  {
    id: 6,
    externalClient: 'Goldman Sachs PWM',
    internalClient: { name: 'Rachel Goldman', gcgDepartment: 'Institution' },
    loggedBy: 'David L.',
    loggedAt: 'Jan 3, 2026',
    dataAsOf: 'Dec 31, 2025',
    positions: [
      { ticker: 'DFUS', name: 'DFA US Core Equity 1', weight: 0.35 },
      { ticker: 'DFAI', name: 'DFA Intl Core Equity', weight: 0.25 },
      { ticker: 'DFAE', name: 'DFA Emerging Core Equity', weight: 0.15 },
      { ticker: 'DFSV', name: 'DFA US Small Cap Value', weight: 0.08 },
      { ticker: 'DISV', name: 'DFA Intl Small Cap Value', weight: 0.07 },
      { ticker: 'DFCF', name: 'DFA Core Fixed Income', weight: 0.10 },
    ],
    characteristics: {
      weightedAvgMarketCap: 180.3,
      weightedAvgPB: 2.2,
      weightedAvgProfitability: 0.36,
      valueAllocation: 58,
      growthAllocation: 42,
      usEquityAllocation: 43,
      devExUsAllocation: 32,
      emAllocation: 15,
      duration: 4.0,
      avgCreditQuality: 'A+',
      avgYield: 4.4,
    },
    returns: {
      oneYear: 17.6,
      threeYear: 8.9,
      fiveYear: 11.2,
      tenYear: 10.5,
      fifteenYear: 9.8,
      twentyYear: 9.2,
    },
  },
  {
    id: 7,
    externalClient: 'Wells Fargo Advisors',
    internalClient: { name: 'Robert Chen', gcgDepartment: 'IAG' },
    loggedBy: 'Eli F.',
    loggedAt: 'Dec 28, 2025',
    dataAsOf: 'Nov 30, 2025',
    positions: [
      { ticker: 'DFUS', name: 'DFA US Core Equity 1', weight: 0.50 },
      { ticker: 'DFAI', name: 'DFA Intl Core Equity', weight: 0.20 },
      { ticker: 'DFCF', name: 'DFA Core Fixed Income', weight: 0.25 },
      { ticker: 'IJR', name: 'iShares Core S&P Small-Cap', weight: 0.05 },
    ],
    characteristics: {
      weightedAvgMarketCap: 350.2,
      weightedAvgPB: 3.2,
      weightedAvgProfitability: 0.46,
      valueAllocation: 40,
      growthAllocation: 60,
      usEquityAllocation: 55,
      devExUsAllocation: 20,
      emAllocation: 0,
      duration: 5.8,
      avgCreditQuality: 'AA',
      avgYield: 4.9,
    },
    returns: {
      oneYear: 15.8,
      threeYear: 7.2,
      fiveYear: 8.9,
      tenYear: 8.5,
      fifteenYear: null,
      twentyYear: null,
    },
  },
  {
    id: 8,
    externalClient: 'Ameriprise Financial',
    internalClient: { name: 'Daniel Park', gcgDepartment: 'Broker-Dealer' },
    loggedBy: 'Sarah K.',
    loggedAt: 'Dec 20, 2025',
    dataAsOf: 'Nov 30, 2025',
    positions: [
      { ticker: 'DFUS', name: 'DFA US Core Equity 1', weight: 0.30 },
      { ticker: 'DFAC', name: 'DFA US Core Equity 2', weight: 0.10 },
      { ticker: 'DFAI', name: 'DFA Intl Core Equity', weight: 0.18 },
      { ticker: 'DFAE', name: 'DFA Emerging Core Equity', weight: 0.07 },
      { ticker: 'DFSV', name: 'DFA US Small Cap Value', weight: 0.10 },
      { ticker: 'DFCF', name: 'DFA Core Fixed Income', weight: 0.15 },
      { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', weight: 0.10 },
    ],
    characteristics: {
      weightedAvgMarketCap: 275.8,
      weightedAvgPB: 2.7,
      weightedAvgProfitability: 0.41,
      valueAllocation: 47,
      growthAllocation: 53,
      usEquityAllocation: 50,
      devExUsAllocation: 18,
      emAllocation: 7,
      duration: 4.5,
      avgCreditQuality: 'A+',
      avgYield: 4.6,
    },
    returns: {
      oneYear: 17.2,
      threeYear: 7.8,
      fiveYear: 9.5,
      tenYear: 9.1,
      fifteenYear: 8.5,
      twentyYear: null,
    },
  },
  {
    id: 9,
    externalClient: 'LPL Financial',
    internalClient: { name: 'Andrew Mitchell', gcgDepartment: 'Institution' },
    loggedBy: 'Mike R.',
    loggedAt: 'Dec 15, 2025',
    dataAsOf: 'Nov 30, 2025',
    positions: [
      { ticker: 'DFUS', name: 'DFA US Core Equity 1', weight: 0.40 },
      { ticker: 'DFAI', name: 'DFA Intl Core Equity', weight: 0.22 },
      { ticker: 'DFAE', name: 'DFA Emerging Core Equity', weight: 0.08 },
      { ticker: 'DFCF', name: 'DFA Core Fixed Income', weight: 0.20 },
      { ticker: 'VXUS', name: 'Vanguard Total Intl Stock', weight: 0.10 },
    ],
    characteristics: {
      weightedAvgMarketCap: 298.5,
      weightedAvgPB: 2.9,
      weightedAvgProfitability: 0.43,
      valueAllocation: 44,
      growthAllocation: 56,
      usEquityAllocation: 40,
      devExUsAllocation: 32,
      emAllocation: 8,
      duration: 5.2,
      avgCreditQuality: 'AA-',
      avgYield: 4.7,
    },
    returns: {
      oneYear: 16.5,
      threeYear: 7.6,
      fiveYear: 9.3,
      tenYear: 8.8,
      fifteenYear: 8.2,
      twentyYear: 7.9,
    },
  },
  {
    id: 10,
    externalClient: 'Schwab Private Client',
    internalClient: { name: 'Jennifer Martinez', gcgDepartment: 'IAG' },
    loggedBy: 'Lisa M.',
    loggedAt: 'Dec 10, 2025',
    dataAsOf: 'Nov 30, 2025',
    positions: [
      { ticker: 'DFUS', name: 'DFA US Core Equity 1', weight: 0.35 },
      { ticker: 'DFAI', name: 'DFA Intl Core Equity', weight: 0.20 },
      { ticker: 'DFAE', name: 'DFA Emerging Core Equity', weight: 0.05 },
      { ticker: 'DFSV', name: 'DFA US Small Cap Value', weight: 0.12 },
      { ticker: 'DFIV', name: 'DFA Intl Small Cap Value', weight: 0.08 },
      { ticker: 'DFCF', name: 'DFA Core Fixed Income', weight: 0.20 },
    ],
    characteristics: {
      weightedAvgMarketCap: 220.4,
      weightedAvgPB: 2.5,
      weightedAvgProfitability: 0.39,
      valueAllocation: 52,
      growthAllocation: 48,
      usEquityAllocation: 47,
      devExUsAllocation: 28,
      emAllocation: 5,
      duration: 5.0,
      avgCreditQuality: 'A+',
      avgYield: 4.5,
    },
    returns: {
      oneYear: 18.8,
      threeYear: 8.5,
      fiveYear: 10.2,
      tenYear: 9.6,
      fifteenYear: 9.0,
      twentyYear: null,
    },
  },
];

// ==================== DFA ALTERNATIVES LOOKUP ====================
// Maps competitor tickers to their DFA alternatives

export const dfaAlternatives: DFAAlternative[] = [
  { competitorTicker: 'VOO', dfaTicker: 'DFUS', dfaName: 'US Core Equity 1', matchType: 'benchmark', overlapScore: 0.85 },
  { competitorTicker: 'VTI', dfaTicker: 'DFUS', dfaName: 'US Core Equity 1', matchType: 'benchmark', overlapScore: 0.82 },
  { competitorTicker: 'SPY', dfaTicker: 'DFUS', dfaName: 'US Core Equity 1', matchType: 'benchmark', overlapScore: 0.85 },
  { competitorTicker: 'IVV', dfaTicker: 'DFUS', dfaName: 'US Core Equity 1', matchType: 'benchmark', overlapScore: 0.85 },
  { competitorTicker: 'IJR', dfaTicker: 'DFAS', dfaName: 'US Small Cap', matchType: 'benchmark', overlapScore: 0.72 },
  { competitorTicker: 'VB', dfaTicker: 'DFAS', dfaName: 'US Small Cap', matchType: 'benchmark', overlapScore: 0.70 },
  { competitorTicker: 'VXUS', dfaTicker: 'DFAI', dfaName: 'Intl Core Equity', matchType: 'benchmark', overlapScore: 0.78 },
  { competitorTicker: 'VEA', dfaTicker: 'DFAI', dfaName: 'Intl Core Equity', matchType: 'benchmark', overlapScore: 0.80 },
  { competitorTicker: 'IEFA', dfaTicker: 'DFAI', dfaName: 'Intl Core Equity', matchType: 'benchmark', overlapScore: 0.79 },
  { competitorTicker: 'VWO', dfaTicker: 'DFAE', dfaName: 'Emerging Core Equity', matchType: 'benchmark', overlapScore: 0.75 },
  { competitorTicker: 'IEMG', dfaTicker: 'DFAE', dfaName: 'Emerging Core Equity', matchType: 'benchmark', overlapScore: 0.74 },
  { competitorTicker: 'BND', dfaTicker: 'DFCF', dfaName: 'Core Fixed Income', matchType: 'benchmark', overlapScore: 0.68 },
  { competitorTicker: 'AGG', dfaTicker: 'DFCF', dfaName: 'Core Fixed Income', matchType: 'benchmark', overlapScore: 0.70 },
  { competitorTicker: 'SCHD', dfaTicker: 'DFLV', dfaName: 'US Large Cap Value', matchType: 'overlap', overlapScore: 0.55 },
  { competitorTicker: 'VTV', dfaTicker: 'DFLV', dfaName: 'US Large Cap Value', matchType: 'benchmark', overlapScore: 0.65 },
];

// Lookup function to find DFA alternative for a competitor ticker
export function getDFAAlternative(competitorTicker: string): DFAAlternative | null {
  return dfaAlternatives.find(alt => alt.competitorTicker === competitorTicker) || null;
}

// ==================== TICKER CLASSIFICATION ====================
// DFA ticker prefixes for identification

const DFA_PREFIXES = ['DF', 'DI'];

export function isDFATicker(ticker: string): boolean {
  return DFA_PREFIXES.some(prefix => ticker.startsWith(prefix));
}

// ==================== FILTER HELPERS ====================

export function extractFilterOptions(portfolios: LoggedPortfolio[]): FilterOptions {
  const teamMembersSet = new Set<string>();
  const departmentsSet = new Set<string>();

  portfolios.forEach(portfolio => {
    teamMembersSet.add(portfolio.loggedBy);
    departmentsSet.add(portfolio.internalClient.gcgDepartment);
  });

  return {
    teamMembers: ['All Team Members', ...Array.from(teamMembersSet).sort()],
    departments: ['All Departments', ...Array.from(departmentsSet).sort()],
    periods: ['1M', '3M', '6M', '1Y', 'ALL'],
  };
}

// Parse date string like "Jan 15, 2025" to Date object
function parseLoggedDate(dateStr: string): Date {
  return new Date(dateStr);
}

// Get the start date for a period filter
function getPeriodStartDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case '1M':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3M':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6M':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1Y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case 'ALL':
    default:
      return null; // No date filter
  }
}

export function filterPortfolios(
  portfolios: LoggedPortfolio[],
  teamMember: string,
  department: string,
  period: string
): LoggedPortfolio[] {
  let filtered = [...portfolios];

  // Filter by team member
  if (teamMember && teamMember !== 'All Team Members') {
    filtered = filtered.filter(p => p.loggedBy === teamMember);
  }

  // Filter by department
  if (department && department !== 'All Departments') {
    filtered = filtered.filter(p => p.internalClient.gcgDepartment === department);
  }

  // Filter by period
  const periodStart = getPeriodStartDate(period);
  if (periodStart) {
    filtered = filtered.filter(p => {
      const loggedDate = parseLoggedDate(p.loggedAt);
      return loggedDate >= periodStart;
    });
  }

  return filtered;
}

// ==================== AGGREGATION FUNCTIONS ====================

// Compute ticker counts from portfolio positions
export function computeTickerCounts(portfolios: LoggedPortfolio[]): TickerCount[] {
  const tickerMap = new Map<string, { name: string; count: number; totalWeight: number }>();

  portfolios.forEach(portfolio => {
    portfolio.positions.forEach(position => {
      const existing = tickerMap.get(position.ticker);
      if (existing) {
        existing.count += 1;
        existing.totalWeight += position.weight;
      } else {
        tickerMap.set(position.ticker, {
          name: position.name,
          count: 1,
          totalWeight: position.weight,
        });
      }
    });
  });

  const counts: TickerCount[] = [];
  tickerMap.forEach((data, ticker) => {
    counts.push({
      ticker,
      name: data.name,
      count: data.count,
      totalWeight: data.totalWeight,
      avgWeight: data.totalWeight / data.count,
      isDFA: isDFATicker(ticker),
    });
  });

  // Sort by count descending
  return counts.sort((a, b) => b.count - a.count);
}

// Compute hot tickers (non-DFA tickers ranked by frequency)
export function computeHotTickers(portfolios: LoggedPortfolio[]): ComputedHotTicker[] {
  const tickerCounts = computeTickerCounts(portfolios);

  // Filter to non-DFA tickers only
  const nonDFATickers = tickerCounts.filter(tc => !tc.isDFA);

  // Map to hot ticker format with DFA alternatives
  return nonDFATickers.map((tc, index) => ({
    rank: index + 1,
    ticker: tc.ticker,
    name: tc.name,
    count: tc.count,
    trend: '+0%', // Placeholder - would compute from historical data
    dfaAlternative: getDFAAlternative(tc.ticker),
  }));
}

// Compute popular DFA tickers (DFA tickers ranked by portfolio inclusion)
export function computePopularDFATickers(portfolios: LoggedPortfolio[]): ComputedPopularDFATicker[] {
  const tickerCounts = computeTickerCounts(portfolios);
  const totalPortfolios = portfolios.length;

  // Filter to DFA tickers only
  const dfaTickers = tickerCounts.filter(tc => tc.isDFA);

  // Map to popular DFA ticker format
  return dfaTickers.map((tc, index) => ({
    rank: index + 1,
    ticker: tc.ticker,
    name: tc.name,
    count: tc.count,
    pctOfTotal: totalPortfolios > 0 ? Math.round((tc.count / totalPortfolios) * 100) : 0,
    avgWeight: Math.round(tc.avgWeight * 1000) / 10, // Convert to percentage with 1 decimal
    trend: '+0%', // Placeholder - would compute from historical data
  }));
}

// Compute ticker trends over time (monthly aggregation)
export function computeTickerTrendsOverTime(
  portfolios: LoggedPortfolio[],
  topN: number = 3
): ComputedTickerTrend[] {
  // Group portfolios by month
  const monthlyData = new Map<string, LoggedPortfolio[]>();

  portfolios.forEach(portfolio => {
    const date = parseLoggedDate(portfolio.loggedAt);
    const monthKey = date.toLocaleString('default', { month: 'short' });

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, []);
    }
    monthlyData.get(monthKey)!.push(portfolio);
  });

  // Get top N DFA tickers overall
  const overallCounts = computeTickerCounts(portfolios);
  const topDFATickers = overallCounts
    .filter(tc => tc.isDFA)
    .slice(0, topN)
    .map(tc => tc.ticker);

  // Build trend data for each month
  const trends: ComputedTickerTrend[] = [];
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']; // Fixed order for display

  months.forEach(month => {
    const monthPortfolios = monthlyData.get(month) || [];
    const monthCounts = computeTickerCounts(monthPortfolios);

    const trend: ComputedTickerTrend = { month };
    topDFATickers.forEach(ticker => {
      const tickerData = monthCounts.find(tc => tc.ticker === ticker);
      trend[ticker] = tickerData ? tickerData.count : 0;
    });
    trends.push(trend);
  });

  return trends;
}

// ==================== COMPUTED METRICS ====================

// Compute portfolio construction metrics from filtered portfolios
export function computePortfolioMetrics(portfolios: LoggedPortfolio[]): PortfolioMetric[] {
  if (portfolios.length === 0) {
    return [
      { label: 'Avg Line Items', value: '—', change: '—', isPositive: true, benchmark: null },
      { label: 'Avg Value Exposure', value: '—', change: '—', isPositive: true, benchmark: 'ACWI: 30%' },
      { label: 'Avg Growth Exposure', value: '—', change: '—', isPositive: true, benchmark: 'ACWI: 65%' },
      { label: 'Avg DFA Wallet Share', value: '—', change: '—', isPositive: true, benchmark: null },
    ];
  }

  // Calculate averages
  const avgLineItems = portfolios.reduce((sum, p) => sum + p.positions.length, 0) / portfolios.length;
  const avgValueExposure = portfolios.reduce((sum, p) => sum + p.characteristics.valueAllocation, 0) / portfolios.length;
  const avgGrowthExposure = portfolios.reduce((sum, p) => sum + p.characteristics.growthAllocation, 0) / portfolios.length;

  // Calculate DFA wallet share (sum of DFA ticker weights / total)
  let totalDFAWeight = 0;
  let totalWeight = 0;
  portfolios.forEach(p => {
    p.positions.forEach(pos => {
      totalWeight += pos.weight;
      if (isDFATicker(pos.ticker)) {
        totalDFAWeight += pos.weight;
      }
    });
  });
  const avgDFAWalletShare = totalWeight > 0 ? (totalDFAWeight / totalWeight) * 100 : 0;

  return [
    { label: 'Avg Line Items', value: avgLineItems.toFixed(1), change: '+0.8', isPositive: true, benchmark: null },
    { label: 'Avg Value Exposure', value: `${Math.round(avgValueExposure)}%`, change: '+2%', isPositive: true, benchmark: 'ACWI: 30%' },
    { label: 'Avg Growth Exposure', value: `${Math.round(avgGrowthExposure)}%`, change: '+1%', isPositive: true, benchmark: 'ACWI: 65%' },
    { label: 'Avg DFA Wallet Share', value: `${Math.round(avgDFAWalletShare)}%`, change: '+4%', isPositive: true, benchmark: null },
  ];
}

// Compute fixed income metrics from filtered portfolios
export function computeFixedIncomeMetrics(portfolios: LoggedPortfolio[]): PortfolioMetric[] {
  // Filter to portfolios with fixed income (duration > 0)
  const fiPortfolios = portfolios.filter(p => p.characteristics.duration > 0);

  if (fiPortfolios.length === 0) {
    return [
      { label: 'Avg Duration', value: '—', change: '—', isPositive: true, benchmark: 'Agg: 6.1 yrs' },
      { label: 'Avg Credit Quality', value: '—', change: '—', isPositive: true, benchmark: 'Agg: AA-' },
      { label: 'Avg Yield', value: '—', change: '—', isPositive: true, benchmark: 'Agg: 4.5%' },
    ];
  }

  const avgDuration = fiPortfolios.reduce((sum, p) => sum + p.characteristics.duration, 0) / fiPortfolios.length;
  const avgYield = fiPortfolios.reduce((sum, p) => sum + p.characteristics.avgYield, 0) / fiPortfolios.length;

  // For credit quality, we'll use the most common one (simplified)
  const creditQualities = fiPortfolios.map(p => p.characteristics.avgCreditQuality);
  const qualityCount = new Map<string, number>();
  creditQualities.forEach(q => qualityCount.set(q, (qualityCount.get(q) || 0) + 1));
  let mostCommonQuality = 'A+';
  let maxCount = 0;
  qualityCount.forEach((count, quality) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonQuality = quality;
    }
  });

  return [
    { label: 'Avg Duration', value: `${avgDuration.toFixed(1)} yrs`, change: '-0.3', isPositive: true, benchmark: 'Agg: 6.1 yrs' },
    { label: 'Avg Credit Quality', value: mostCommonQuality, change: '—', isPositive: true, benchmark: 'Agg: AA-' },
    { label: 'Avg Yield', value: `${avgYield.toFixed(1)}%`, change: '+0.2%', isPositive: true, benchmark: 'Agg: 4.5%' },
  ];
}

// Compute benchmark comparison from filtered portfolios
export function computeBenchmarkComparison(portfolios: LoggedPortfolio[]): BenchmarkComparison[] {
  if (portfolios.length === 0) {
    return [
      { metric: 'US Equity', client: 0, acwi: 62, delta: -62 },
      { metric: 'Intl Dev', client: 0, acwi: 27, delta: -27 },
      { metric: 'EM', client: 0, acwi: 11, delta: -11 },
    ];
  }

  const avgUS = portfolios.reduce((sum, p) => sum + p.characteristics.usEquityAllocation, 0) / portfolios.length;
  const avgIntlDev = portfolios.reduce((sum, p) => sum + p.characteristics.devExUsAllocation, 0) / portfolios.length;
  const avgEM = portfolios.reduce((sum, p) => sum + p.characteristics.emAllocation, 0) / portfolios.length;

  return [
    { metric: 'US Equity', client: Math.round(avgUS), acwi: 62, delta: Math.round(avgUS) - 62 },
    { metric: 'Intl Dev', client: Math.round(avgIntlDev), acwi: 27, delta: Math.round(avgIntlDev) - 27 },
    { metric: 'EM', client: Math.round(avgEM), acwi: 11, delta: Math.round(avgEM) - 11 },
  ];
}

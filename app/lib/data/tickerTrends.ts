// Data and functions for Ticker Trends Dashboard

import type {
  HotTicker,
  DFAAlternative,
  TickerCount,
  ComputedHotTicker,
  ComputedPopularDFATicker,
  ComputedTickerTrend,
  LoggedPortfolio,
} from '../types/trends';
import { isDFATicker } from './portfolioTrends';

// Static filter options for Ticker Trends (no portfolio dependency)
export function extractFilterOptions() {
  return {
    teamMembers: ['All Team Members', 'Eli F.'],
    departments: ['All Departments', 'IAG', 'Broker-Dealer', 'Institution'],
    periods: ['1M', '3M', '6M', '1Y', 'YTD', 'All'],
  };
}

// ==================== HOT TICKERS DATA ====================

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
    flows: { competitor: '+2.1B', dfa: '+0.8B' },
    notes: 'IJR tracks S&P 600 with profitability screens.',
    talkingPointsUrl: 'https://internal.dfa.com/talking-points/ijr-vs-dfas',
    pcrUrl: 'https://internal.dfa.com/pcr/ijr-vs-dfas',
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
    flows: { competitor: '+18.5B', dfa: '+3.2B' },
    notes: 'DFUS provides broader market exposure with factor tilts.',
    talkingPointsUrl: 'https://internal.dfa.com/talking-points/voo-vs-dfus',
    pcrUrl: 'https://internal.dfa.com/pcr/voo-vs-dfus',
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
    flows: { competitor: '+12.3B', dfa: '+3.2B' },
    notes: '',
    talkingPointsUrl: 'https://internal.dfa.com/talking-points/vti-vs-dfus',
    pcrUrl: '',
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
    flows: { competitor: '+4.2B', dfa: '+1.1B' },
    notes: 'Can complement DFAI for broader international coverage.',
    talkingPointsUrl: '',
    pcrUrl: '',
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
    flows: { competitor: '-1.8B', dfa: '+0.4B' },
    notes: '',
    talkingPointsUrl: 'https://internal.dfa.com/talking-points/bnd-vs-dfcf',
    pcrUrl: 'https://internal.dfa.com/pcr/bnd-vs-dfcf',
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
    flows: { competitor: '+5.6B', dfa: '+1.1B' },
    notes: '',
    talkingPointsUrl: '',
    pcrUrl: '',
  },
];

// ==================== DFA ALTERNATIVES LOOKUP ====================

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

// ==================== AGGREGATION FUNCTIONS ====================

// Parse date string like "Jan 15, 2025" to Date object
function parseLoggedDate(dateStr: string): Date {
  return new Date(dateStr);
}

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

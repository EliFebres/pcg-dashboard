// API functions for Ticker Trends Dashboard
// When connecting to FastAPI backend, replace mock implementations with fetch() calls

import type { HotTicker } from '../types/trends';

// =============================================================================
// API Configuration
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Simulate network delay for development (set to 0 for production)
const SIMULATED_DELAY = process.env.NODE_ENV === 'development' ? 200 : 0;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// =============================================================================
// Request/Response Types
// =============================================================================

export interface HotTickersFilters {
  teamMember?: string;
  department?: string;
  period?: string;
}

export interface HotTickersResponse {
  tickers: HotTicker[];
  total: number;
  asOfDate: string;
}

export interface FilterOptions {
  teamMembers: string[];
  departments: string[];
  periods: string[];
}

// =============================================================================
// Mock Data
// =============================================================================

const mockHotTickers: HotTicker[] = [
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
    notes: 'IJR tracks S&P 600 which has profitability screens. DFAS has deeper small-cap exposure with value/profitability tilts. Key differentiator is factor exposure, not just market cap.',
    hasTalkingPoints: true,
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
    notes: 'DFUS provides broader market exposure with systematic factor tilts. Similar large-cap core exposure but with DFA\'s research-driven approach.',
    hasTalkingPoints: true,
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
    notes: '',
    hasTalkingPoints: true,
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
    notes: 'Can be used alongside DFAI for broader international coverage. DFAI provides factor tilts while VXUS offers pure market-cap weighting.',
    hasTalkingPoints: false,
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
    notes: '',
    hasTalkingPoints: true,
  },
  {
    rank: 6,
    type: 'Complement',
    ticker: 'VEA',
    name: 'Vanguard FTSE Developed Markets',
    requests: 24,
    trend: '+5%',
    dfaCompetitor: 'DFAI',
    dfaName: 'Intl Core Equity',
    returnComparison: { competitor: 9.8, dfa: 9.1, delta: '-0.7%' },
    expenseRatio: { competitor: 0.06, dfa: 0.18 },
    aum: { competitor: '142B', dfa: '12B' },
    notes: '',
    hasTalkingPoints: false,
  },
  {
    rank: 7,
    type: 'Challenging',
    ticker: 'SCHD',
    name: 'Schwab US Dividend Equity',
    requests: 21,
    trend: '+22%',
    dfaCompetitor: 'DFLV',
    dfaName: 'US Large Cap Value',
    returnComparison: { competitor: 15.2, dfa: 12.8, delta: '-2.4%' },
    expenseRatio: { competitor: 0.06, dfa: 0.22 },
    aum: { competitor: '56B', dfa: '9B' },
    notes: 'SCHD focuses on dividend growth quality. DFLV uses value/profitability factors. Different approaches - dividend yield vs systematic value exposure.',
    hasTalkingPoints: true,
  },
  {
    rank: 8,
    type: 'Replacement',
    ticker: 'VWO',
    name: 'Vanguard FTSE Emerging Markets',
    requests: 19,
    trend: '+7%',
    dfaCompetitor: 'DFAE',
    dfaName: 'Emerging Core Equity',
    returnComparison: { competitor: 6.4, dfa: 7.2, delta: '+0.8%' },
    expenseRatio: { competitor: 0.08, dfa: 0.21 },
    aum: { competitor: '82B', dfa: '6B' },
    notes: '',
    hasTalkingPoints: true,
  },
  {
    rank: 9,
    type: 'Complement',
    ticker: 'AGG',
    name: 'iShares Core US Aggregate Bond',
    requests: 17,
    trend: '-1%',
    dfaCompetitor: 'DFCF',
    dfaName: 'Core Fixed Income',
    returnComparison: { competitor: 1.0, dfa: 1.8, delta: '+0.8%' },
    expenseRatio: { competitor: 0.03, dfa: 0.15 },
    aum: { competitor: '98B', dfa: '6B' },
    notes: '',
    hasTalkingPoints: false,
  },
  {
    rank: 10,
    type: 'Challenging',
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    requests: 15,
    trend: '+31%',
    dfaCompetitor: 'DFUS',
    dfaName: 'US Core Equity 1',
    returnComparison: { competitor: 32.1, dfa: 25.1, delta: '-7.0%' },
    expenseRatio: { competitor: 0.20, dfa: 0.12 },
    aum: { competitor: '245B', dfa: '32B' },
    notes: 'QQQ is Nasdaq-100 concentrated in tech. No direct DFA equivalent. DFUS is diversified core. Different risk profiles - sector bet vs broad market.',
    hasTalkingPoints: true,
  },
];

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch top 10 hot tickers with DFA competitors
 * Returns pre-computed data from the backend
 */
export async function getHotTickers(filters?: HotTickersFilters): Promise<HotTickersResponse> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  // In production, this would be:
  // const params = new URLSearchParams();
  // if (filters?.teamMember) params.set('teamMember', filters.teamMember);
  // if (filters?.department) params.set('department', filters.department);
  // if (filters?.period) params.set('period', filters.period);
  // const response = await fetch(`${API_BASE_URL}/ticker-trends/hot-tickers?${params}`);
  // return response.json();

  // Mock implementation - return static data
  // In production, filtering would be done server-side
  return {
    tickers: mockHotTickers,
    total: mockHotTickers.length,
    asOfDate: new Date().toISOString().split('T')[0],
  };
}

/**
 * Get filter options for the ticker trends dashboard
 */
export async function getTickerTrendsFilterOptions(): Promise<FilterOptions> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  return {
    teamMembers: ['All Team Members', 'Eli F.'],
    departments: ['All Departments', 'IAG', 'Broker-Dealer', 'Institution'],
    periods: ['1M', '3M', '6M', '1Y', 'YTD', 'All'],
  };
}

// =============================================================================
// Update Functions
// =============================================================================

export type TickerType = 'Replacement' | 'Challenging' | 'Complement';

export const TICKER_TYPE_OPTIONS: TickerType[] = ['Replacement', 'Challenging', 'Complement'];

/**
 * Update the type classification for a hot ticker
 * Returns the updated ticker on success
 */
export async function updateHotTickerType(
  ticker: string,
  newType: TickerType
): Promise<{ success: boolean; ticker: string; type: TickerType }> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  // In production, this would be:
  // const response = await fetch(`${API_BASE_URL}/ticker-trends/hot-tickers/${ticker}/type`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ type: newType }),
  // });
  // return response.json();

  // Mock implementation - just return success
  // In production, this would persist to the database
  return {
    success: true,
    ticker,
    type: newType,
  };
}

/**
 * Update the notes for a hot ticker
 * Returns the updated ticker on success
 */
export async function updateHotTickerNotes(
  ticker: string,
  notes: string
): Promise<{ success: boolean; ticker: string; notes: string }> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  // In production, this would be:
  // const response = await fetch(`${API_BASE_URL}/ticker-trends/hot-tickers/${ticker}/notes`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ notes }),
  // });
  // return response.json();

  // Mock implementation - just return success
  return {
    success: true,
    ticker,
    notes,
  };
}

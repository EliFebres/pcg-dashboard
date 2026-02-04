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
  department?: string;
  period?: string;
}

export interface HotTickersResponse {
  tickers: HotTicker[];
  total: number;
  asOfDate: string;
}

export interface FilterOptions {
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
    requestBreakdown: { pcrRequests: 24, pcrDownloads: 18, tickersMentioned: 7, clientModels: 3 },
    trend: '+18%',
    dfaCompetitor: 'DFAS',
    dfaName: 'US Small Cap',
    returnComparison: { competitor: 12.4, dfa: 9.8, delta: '-2.6%' },
    expenseRatio: { competitor: 0.06, dfa: 0.27 },
    aum: { competitor: '82B', dfa: '14B' },
    flows: { competitor: '+2.1B', dfa: '+0.8B' },
    notes: 'IJR tracks S&P 600 which has profitability screens. DFAS has deeper small-cap exposure with value/profitability tilts. Key differentiator is factor exposure, not just market cap.',
    talkingPointsUrl: 'https://internal.dfa.com/talking-points/ijr-vs-dfas',
    pcrUrl: 'https://internal.dfa.com/pcr/ijr-vs-dfas',
  },
  {
    rank: 2,
    type: 'Replacement',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    requests: 47,
    requestBreakdown: { pcrRequests: 6, pcrDownloads: 3, tickersMentioned: 28, clientModels: 10 },
    trend: '+12%',
    dfaCompetitor: 'DFUS',
    dfaName: 'US Core Equity 1',
    returnComparison: { competitor: 24.8, dfa: 25.1, delta: '+0.3%' },
    expenseRatio: { competitor: 0.03, dfa: 0.12 },
    aum: { competitor: '428B', dfa: '32B' },
    flows: { competitor: '+18.5B', dfa: '+3.2B' },
    notes: 'DFUS provides broader market exposure with systematic factor tilts. Similar large-cap core exposure but with DFA\'s research-driven approach.',
    talkingPointsUrl: 'https://internal.dfa.com/talking-points/voo-vs-dfus',
    pcrUrl: 'https://internal.dfa.com/pcr/voo-vs-dfus',
  },
  {
    rank: 3,
    type: 'Replacement',
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market',
    requests: 38,
    requestBreakdown: { pcrRequests: 10, pcrDownloads: 9, tickersMentioned: 10, clientModels: 9 },
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
    requestBreakdown: { pcrRequests: 9, pcrDownloads: 0, tickersMentioned: 17, clientModels: 5 },
    trend: '+15%',
    dfaCompetitor: 'DFAI',
    dfaName: 'Intl Core Equity',
    returnComparison: { competitor: 8.2, dfa: 9.1, delta: '+0.9%' },
    expenseRatio: { competitor: 0.08, dfa: 0.18 },
    aum: { competitor: '67B', dfa: '12B' },
    flows: { competitor: '+4.2B', dfa: '+1.1B' },
    notes: 'Can be used alongside DFAI for broader international coverage. DFAI provides factor tilts while VXUS offers pure market-cap weighting.',
    talkingPointsUrl: '',
    pcrUrl: '',
  },
  {
    rank: 5,
    type: 'Replacement',
    ticker: 'BND',
    name: 'Vanguard Total Bond Market',
    requests: 28,
    requestBreakdown: { pcrRequests: 2, pcrDownloads: 1, tickersMentioned: 4, clientModels: 21 },
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
    name: 'Vanguard FTSE Developed Markets',
    requests: 24,
    requestBreakdown: { pcrRequests: 16, pcrDownloads: 5, tickersMentioned: 3, clientModels: 0 },
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
  {
    rank: 7,
    type: 'Challenging',
    ticker: 'SCHD',
    name: 'Schwab US Dividend Equity',
    requests: 21,
    requestBreakdown: { pcrRequests: 6, pcrDownloads: 7, tickersMentioned: 0, clientModels: 8 },
    trend: '+22%',
    dfaCompetitor: 'DFLV',
    dfaName: 'US Large Cap Value',
    returnComparison: { competitor: 15.2, dfa: 12.8, delta: '-2.4%' },
    expenseRatio: { competitor: 0.06, dfa: 0.22 },
    aum: { competitor: '56B', dfa: '9B' },
    flows: { competitor: '+8.9B', dfa: '+0.6B' },
    notes: 'SCHD focuses on dividend growth quality. DFLV uses value/profitability factors. Different approaches - dividend yield vs systematic value exposure.',
    talkingPointsUrl: 'https://internal.dfa.com/talking-points/schd-vs-dflv',
    pcrUrl: 'https://internal.dfa.com/pcr/schd-vs-dflv',
  },
  {
    rank: 8,
    type: 'Replacement',
    ticker: 'VWO',
    name: 'Vanguard FTSE Emerging Markets',
    requests: 19,
    requestBreakdown: { pcrRequests: 2, pcrDownloads: 1, tickersMentioned: 14, clientModels: 2 },
    trend: '+7%',
    dfaCompetitor: 'DFAE',
    dfaName: 'Emerging Core Equity',
    returnComparison: { competitor: 6.4, dfa: 7.2, delta: '+0.8%' },
    expenseRatio: { competitor: 0.08, dfa: 0.21 },
    aum: { competitor: '82B', dfa: '6B' },
    flows: { competitor: '+2.4B', dfa: '+0.5B' },
    notes: '',
    talkingPointsUrl: 'https://internal.dfa.com/talking-points/vwo-vs-dfae',
    pcrUrl: '',
  },
  {
    rank: 9,
    type: 'Complement',
    ticker: 'AGG',
    name: 'iShares Core US Aggregate Bond',
    requests: 17,
    requestBreakdown: { pcrRequests: 0, pcrDownloads: 8, tickersMentioned: 2, clientModels: 7 },
    trend: '-1%',
    dfaCompetitor: 'DFCF',
    dfaName: 'Core Fixed Income',
    returnComparison: { competitor: 1.0, dfa: 1.8, delta: '+0.8%' },
    expenseRatio: { competitor: 0.03, dfa: 0.15 },
    aum: { competitor: '98B', dfa: '6B' },
    flows: { competitor: '-0.9B', dfa: '+0.4B' },
    notes: '',
    talkingPointsUrl: '',
    pcrUrl: '',
  },
  {
    rank: 10,
    type: 'Challenging',
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    requests: 15,
    requestBreakdown: { pcrRequests: 11, pcrDownloads: 3, tickersMentioned: 1, clientModels: 0 },
    trend: '+31%',
    dfaCompetitor: 'DFUS',
    dfaName: 'US Core Equity 1',
    returnComparison: { competitor: 32.1, dfa: 25.1, delta: '-7.0%' },
    expenseRatio: { competitor: 0.20, dfa: 0.12 },
    aum: { competitor: '245B', dfa: '32B' },
    flows: { competitor: '+21.3B', dfa: '+3.2B' },
    notes: 'QQQ is Nasdaq-100 concentrated in tech. No direct DFA equivalent. DFUS is diversified core. Different risk profiles - sector bet vs broad market.',
    talkingPointsUrl: 'https://internal.dfa.com/talking-points/qqq-vs-dfus',
    pcrUrl: 'https://internal.dfa.com/pcr/qqq-vs-dfus',
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

/**
 * Update the talking points URL for a hot ticker
 * Returns the updated ticker on success
 */
export async function updateHotTickerTalkingPoints(
  ticker: string,
  talkingPointsUrl: string
): Promise<{ success: boolean; ticker: string; talkingPointsUrl: string }> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  // In production, this would be:
  // const response = await fetch(`${API_BASE_URL}/ticker-trends/hot-tickers/${ticker}/talking-points`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ talkingPointsUrl }),
  // });
  // return response.json();

  // Mock implementation - just return success
  return {
    success: true,
    ticker,
    talkingPointsUrl,
  };
}

/**
 * Update the PCR URL for a hot ticker
 * Returns the updated ticker on success
 */
export async function updateHotTickerPCR(
  ticker: string,
  pcrUrl: string
): Promise<{ success: boolean; ticker: string; pcrUrl: string }> {
  if (SIMULATED_DELAY) await delay(SIMULATED_DELAY);

  // In production, this would be:
  // const response = await fetch(`${API_BASE_URL}/ticker-trends/hot-tickers/${ticker}/pcr`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ pcrUrl }),
  // });
  // return response.json();

  // Mock implementation - just return success
  return {
    success: true,
    ticker,
    pcrUrl,
  };
}

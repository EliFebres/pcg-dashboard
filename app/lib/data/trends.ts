// Mock data for Trends Dashboard
// This file will be replaced with real API calls when connecting to FastAPI

import type { PortfolioMetric, BenchmarkComparison, HotTicker, PopularDFATicker, TickerTrend } from '../types/trends';

export const portfolioMetrics: PortfolioMetric[] = [
  { label: 'Avg Line Items (1YR)', value: '12.4', change: '+0.8', isPositive: true, benchmark: null },
  { label: 'Avg Value Exposure (1YR)', value: '45%', change: '+2%', isPositive: true, benchmark: 'ACWI: 30%' },
  { label: 'Avg Growth Exposure (1YR)', value: '50%', change: '+1%', isPositive: true, benchmark: 'ACWI: 65%' },
  { label: 'Avg DFA Wallet Share (1YR)', value: '33%', change: '+4%', isPositive: true, benchmark: null },
];

export const fixedIncomeMetrics: PortfolioMetric[] = [
  { label: 'Avg Duration (1YR)', value: '5.2 yrs', change: '-0.3', isPositive: true, benchmark: 'Agg: 6.1 yrs' },
  { label: 'Avg Credit Quality (1YR)', value: 'A+', change: '—', isPositive: true, benchmark: 'Agg: AA-' },
  { label: 'Avg Yield (1YR)', value: '4.8%', change: '+0.2%', isPositive: true, benchmark: 'Agg: 4.5%' },
];

export const benchmarkComparison: BenchmarkComparison[] = [
  { metric: 'US Equity', client: 70, acwi: 62, delta: +8 },
  { metric: 'Intl Dev', client: 28, acwi: 27, delta: +1 },
  { metric: 'EM', client: 2, acwi: 11, delta: -9 },
];

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

export const popularDFATickers: PopularDFATicker[] = [
  { rank: 1, ticker: 'DFUS', name: 'US Core Equity 1', holdings: 312, pctModels: '78%', trend: '+5%' },
  { rank: 2, ticker: 'DFAI', name: 'Intl Core Equity', holdings: 287, pctModels: '72%', trend: '+8%' },
  { rank: 3, ticker: 'DFAE', name: 'Emerging Core Equity', holdings: 198, pctModels: '50%', trend: '+12%' },
  { rank: 4, ticker: 'DFCF', name: 'Core Fixed Income', holdings: 176, pctModels: '44%', trend: '+2%' },
  { rank: 5, ticker: 'DFSV', name: 'US Small Cap Value', holdings: 156, pctModels: '39%', trend: '+15%' },
  { rank: 6, ticker: 'DFIV', name: 'Intl Small Cap Value', holdings: 134, pctModels: '34%', trend: '+10%' },
  { rank: 7, ticker: 'DISV', name: 'Intl Small Cap Value', holdings: 112, pctModels: '28%', trend: '+7%' },
  { rank: 8, ticker: 'DFAC', name: 'US Core Equity 2', holdings: 98, pctModels: '25%', trend: '+3%' },
];

export const tickerTrends: TickerTrend[] = [
  { month: 'Aug', DFUS: 290, DFAI: 260, DFAE: 170 },
  { month: 'Sep', DFUS: 298, DFAI: 270, DFAE: 178 },
  { month: 'Oct', DFUS: 302, DFAI: 275, DFAE: 185 },
  { month: 'Nov', DFUS: 308, DFAI: 280, DFAE: 190 },
  { month: 'Dec', DFUS: 305, DFAI: 282, DFAE: 192 },
  { month: 'Jan', DFUS: 312, DFAI: 287, DFAE: 198 },
];

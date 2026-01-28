// API functions for Trends Dashboard
// When connecting to FastAPI, replace the mock data imports with fetch() calls

import {
  portfolioMetrics,
  fixedIncomeMetrics,
  benchmarkComparison,
  hotTickers,
  popularDFATickers,
  tickerTrends,
} from '../data/trends';
import type {
  PortfolioMetric,
  BenchmarkComparison,
  HotTicker,
  PopularDFATicker,
  TickerTrend,
} from '../types/trends';

// Simulate network delay (remove when connecting to real API)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Configure simulated delay (set to 0 for instant loading, or remove delays for production)
const SIMULATED_DELAY = 300;

/**
 * Fetch portfolio construction metrics (equity)
 * FastAPI endpoint: GET /api/trends/portfolio-metrics
 */
export async function getPortfolioMetrics(): Promise<PortfolioMetric[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/trends/portfolio-metrics')
  return portfolioMetrics;
}

/**
 * Fetch fixed income metrics
 * FastAPI endpoint: GET /api/trends/fixed-income-metrics
 */
export async function getFixedIncomeMetrics(): Promise<PortfolioMetric[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/trends/fixed-income-metrics')
  return fixedIncomeMetrics;
}

/**
 * Fetch benchmark comparison data
 * FastAPI endpoint: GET /api/trends/benchmark-comparison
 */
export async function getBenchmarkComparison(): Promise<BenchmarkComparison[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/trends/benchmark-comparison')
  return benchmarkComparison;
}

/**
 * Fetch hot tickers with DFA competitors
 * FastAPI endpoint: GET /api/trends/hot-tickers
 */
export async function getHotTickers(): Promise<HotTicker[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/trends/hot-tickers')
  return hotTickers;
}

/**
 * Fetch popular DFA tickers
 * FastAPI endpoint: GET /api/trends/popular-dfa-tickers
 */
export async function getPopularDFATickers(): Promise<PopularDFATicker[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/trends/popular-dfa-tickers')
  return popularDFATickers;
}

/**
 * Fetch ticker adoption trends over time
 * FastAPI endpoint: GET /api/trends/ticker-trends
 */
export async function getTickerTrends(): Promise<TickerTrend[]> {
  await delay(SIMULATED_DELAY);
  // TODO: Replace with fetch('/api/trends/ticker-trends')
  return tickerTrends;
}

/**
 * Fetch all trends dashboard data in one call (for initial load)
 * FastAPI endpoint: GET /api/trends/dashboard
 */
export async function getTrendsDashboardData() {
  // Fetch all data in parallel for faster loading
  const [
    portfolioMetricsData,
    fixedIncomeMetricsData,
    benchmarkComparisonData,
    hotTickersData,
    popularDFATickersData,
    tickerTrendsData,
  ] = await Promise.all([
    getPortfolioMetrics(),
    getFixedIncomeMetrics(),
    getBenchmarkComparison(),
    getHotTickers(),
    getPopularDFATickers(),
    getTickerTrends(),
  ]);

  return {
    portfolioMetrics: portfolioMetricsData,
    fixedIncomeMetrics: fixedIncomeMetricsData,
    benchmarkComparison: benchmarkComparisonData,
    hotTickers: hotTickersData,
    popularDFATickers: popularDFATickersData,
    tickerTrends: tickerTrendsData,
  };
}

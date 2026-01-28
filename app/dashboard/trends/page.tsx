'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Building2, ChevronDown, MoreHorizontal, ArrowUpRight, ArrowDownRight, Download, PieChart, Target, Flame, Award, FileText, ExternalLink, FileDown, Loader2 } from 'lucide-react';
import { XAxis, YAxis, ResponsiveContainer, Tooltip, ComposedChart, Line } from 'recharts';
import { getTrendsDashboardData } from '@/app/lib/api/trends';
import type { PortfolioMetric, BenchmarkComparison, HotTicker, PopularDFATicker, TickerTrend } from '@/app/lib/types/trends';
import Sidebar from '@/app/components/Sidebar';

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

export default function TrendsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetric[]>([]);
  const [fixedIncomeMetrics, setFixedIncomeMetrics] = useState<PortfolioMetric[]>([]);
  const [benchmarkComparison, setBenchmarkComparison] = useState<BenchmarkComparison[]>([]);
  const [hotTickers, setHotTickers] = useState<HotTicker[]>([]);
  const [popularDFATickers, setPopularDFATickers] = useState<PopularDFATicker[]>([]);
  const [tickerTrends, setTickerTrends] = useState<TickerTrend[]>([]);

  // Fetch all dashboard data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getTrendsDashboardData();
        setPortfolioMetrics(data.portfolioMetrics);
        setFixedIncomeMetrics(data.fixedIncomeMetrics);
        setBenchmarkComparison(data.benchmarkComparison);
        setHotTickers(data.hotTickers);
        setPopularDFATickers(data.popularDFATickers);
        setTickerTrends(data.tickerTrends);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 px-3 py-2 shadow-lg">
          <p className="text-zinc-400 text-xs mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar className="fixed top-0 left-0 h-screen" />

      {/* Main Content */}
      <main className="flex-1 ml-40">
        {/* Top Bar with Filters - Glassy */}
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-zinc-800/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Trends</h2>
                <p className="text-zinc-500 text-sm">Portfolio construction insights and ticker analytics</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="px-2 py-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/10 border border-cyan-500/20 backdrop-blur-sm">Viewing: 1YR</span>
              </div>
            </div>
            {/* Global Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tickers, funds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-colors">
                <Building2 className="w-4 h-4 text-zinc-500" />
                All Departments
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-colors">
                <Filter className="w-4 h-4 text-zinc-500" />
                All Asset Classes
                <ChevronDown className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-500 hover:to-cyan-400 transition-all">
                <Calendar className="w-4 h-4" />
                1YR
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-zinc-400 text-sm">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* ==================== SECTION 1: PORTFOLIO CONSTRUCTION ==================== */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Portfolio Construction Trends</h3>
                <span className="text-xs text-zinc-500 ml-2">How clients are building portfolios (1YR)</span>
              </div>

              {/* Charts Row: Style Map + Asset Class + Benchmark Delta */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Style Map - Market Cap vs P/B */}
                <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-white">Style Map</h4>
                        <p className="text-xs text-zinc-500">Avg client vs MSCI ACWI IMI (1YR)</p>
                      </div>
                      <Target className="w-4 h-4 text-zinc-500" />
                    </div>

                    <div className="flex">
                      <div className="flex items-center justify-center" style={{ width: '20px' }}>
                        <span className="-rotate-90 text-xs text-zinc-500 whitespace-nowrap">Wtd Avg Mkt Cap ($B)</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex">
                          <div className="flex flex-col justify-between text-right pr-2" style={{ width: '28px', height: '140px' }}>
                            <span className="text-xs text-zinc-600">600</span>
                            <span className="text-xs text-zinc-600">400</span>
                            <span className="text-xs text-zinc-600">200</span>
                          </div>

                          <div className="flex-1 relative border-l border-b border-zinc-700/50 overflow-hidden" style={{ height: '140px' }}>
                            <div className="absolute left-1/2 top-0 bottom-0 border-l border-zinc-800/30" />
                            <div className="absolute top-1/2 left-0 right-0 border-t border-zinc-800/30" />
                            <div className="absolute left-0 right-0 border-t border-zinc-500/50" style={{ top: '35%' }} />
                            <div className="absolute top-0 bottom-0 border-l border-zinc-500/50" style={{ left: '60%' }} />
                            <div
                              className="absolute w-4 h-4 rounded-full bg-zinc-500 border-2 border-zinc-400 z-10"
                              style={{ left: '60%', top: '35%', transform: 'translate(-50%, -50%)' }}
                            />
                            <div
                              className="absolute w-4 h-4 rounded-full bg-cyan-500 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 z-10"
                              style={{ left: '45%', top: '50%', transform: 'translate(-50%, -50%)' }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between pl-7 pr-0 mt-1">
                          <span className="text-xs text-zinc-600">2.0</span>
                          <span className="text-xs text-zinc-600">3.0</span>
                          <span className="text-xs text-zinc-600">4.0</span>
                        </div>

                        <div className="text-center mt-1">
                          <span className="text-xs text-zinc-500">Wtd Avg P/B</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-500 border border-zinc-400" />
                        <span className="text-xs text-zinc-400">MSCI ACWI IMI</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-400" />
                        <span className="text-xs text-zinc-400">Avg Client</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profitability Map */}
                <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-white">Profitability Map</h4>
                        <p className="text-xs text-zinc-500">Avg client vs MSCI ACWI IMI (1YR)</p>
                      </div>
                      <Target className="w-4 h-4 text-zinc-500" />
                    </div>

                    <div className="flex">
                      <div className="flex items-center justify-center" style={{ width: '20px' }}>
                        <span className="-rotate-90 text-xs text-zinc-500 whitespace-nowrap">Wtd Avg Profitability</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex">
                          <div className="flex flex-col justify-between text-right pr-2" style={{ width: '28px', height: '140px' }}>
                            <span className="text-xs text-zinc-600">.60</span>
                            <span className="text-xs text-zinc-600">.45</span>
                            <span className="text-xs text-zinc-600">.30</span>
                          </div>

                          <div className="flex-1 relative border-l border-b border-zinc-700/50 overflow-hidden" style={{ height: '140px' }}>
                            <div className="absolute left-1/2 top-0 bottom-0 border-l border-zinc-800/30" />
                            <div className="absolute top-1/2 left-0 right-0 border-t border-zinc-800/30" />
                            <div className="absolute left-0 right-0 border-t border-zinc-500/50" style={{ top: '40%' }} />
                            <div className="absolute top-0 bottom-0 border-l border-zinc-500/50" style={{ left: '55%' }} />
                            <div
                              className="absolute w-4 h-4 rounded-full bg-zinc-500 border-2 border-zinc-400 z-10"
                              style={{ left: '55%', top: '40%', transform: 'translate(-50%, -50%)' }}
                            />
                            <div
                              className="absolute w-4 h-4 rounded-full bg-cyan-500 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 z-10"
                              style={{ left: '42%', top: '35%', transform: 'translate(-50%, -50%)' }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between pl-7 pr-0 mt-1">
                          <span className="text-xs text-zinc-600">2.0</span>
                          <span className="text-xs text-zinc-600">3.0</span>
                          <span className="text-xs text-zinc-600">4.0</span>
                        </div>

                        <div className="text-center mt-1">
                          <span className="text-xs text-zinc-500">Wtd Avg P/B</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-500 border border-zinc-400" />
                        <span className="text-xs text-zinc-400">MSCI ACWI IMI</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-400" />
                        <span className="text-xs text-zinc-400">Avg Client</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benchmark Comparison */}
                <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-white">vs MSCI ACWI IMI</h4>
                        <p className="text-xs text-zinc-500">Regional delta to benchmark (1YR)</p>
                      </div>
                      <Target className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="space-y-3">
                      {benchmarkComparison.map((item) => (
                        <div key={item.metric} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">{item.metric}</span>
                            <span className={`font-medium font-mono ${item.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {item.delta >= 0 ? '+' : ''}{item.delta}%
                            </span>
                          </div>
                          <div className="flex gap-1 h-4">
                            <div
                              className="bg-cyan-500/80 rounded-sm"
                              style={{ width: `${item.client}%` }}
                              title={`Client: ${item.client}%`}
                            />
                            <div
                              className="bg-zinc-600/50 rounded-sm"
                              style={{ width: `${item.acwi}%` }}
                              title={`ACWI: ${item.acwi}%`}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Client: {item.client}%</span>
                            <span>ACWI: {item.acwi}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Equity Metrics Row */}
              <div className="grid grid-cols-4 gap-4 mt-4 mb-4">
                {portfolioMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-4 group hover:border-zinc-700/50 transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-zinc-400 text-xs mb-1">{metric.label}</p>
                          <p className="text-xl font-bold text-white">{metric.value}</p>
                        </div>
                        <div className="text-right">
                          <span className={`flex items-center gap-1 text-xs font-medium ${metric.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {metric.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {metric.change}
                          </span>
                          {metric.benchmark && (
                            <span className="text-xs text-zinc-500">{metric.benchmark}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fixed Income Metrics Row */}
              <div className="grid grid-cols-3 gap-4">
                {fixedIncomeMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-4 group hover:border-zinc-700/50 transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-zinc-400 text-xs mb-1">{metric.label}</p>
                          <p className="text-xl font-bold text-white">{metric.value}</p>
                        </div>
                        <div className="text-right">
                          <span className={`flex items-center gap-1 text-xs font-medium ${metric.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {metric.change !== '—' && (metric.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                            {metric.change}
                          </span>
                          <span className="text-xs text-zinc-500">{metric.benchmark}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ==================== SECTION 2: TICKER ANALYTICS ==================== */}
            <div>
              <div className="flex items-center gap-2 mb-4 mt-8">
                <Flame className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Ticker Analytics</h3>
                <span className="text-xs text-zinc-500 ml-2">Popular tickers and DFA comparisons</span>
              </div>

              {/* Hot Tickers Table */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 p-4 border-b border-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">Hot Tickers & DFA Competitors</h4>
                      <p className="text-xs text-zinc-500">Most requested non-DFA tickers with comparable DFA funds</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-cyan-400 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="relative z-10 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-zinc-800/30">
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">#</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Type</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Competitor Ticker</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Requests</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">DFA Alternative</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">1YR Return Δ</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">AUM</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Expense Ratio</th>
                        <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Notes</th>
                        <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Talking Pts</th>
                        <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Make PCR</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {hotTickers.map((ticker) => (
                        <tr key={ticker.rank} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-zinc-500">{ticker.rank}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 ${
                              ticker.type === 'Replacement'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : ticker.type === 'Challenging'
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                              {ticker.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <span className="text-sm font-bold text-cyan-400">{ticker.ticker}</span>
                              <p className="text-xs text-zinc-500">{ticker.name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-200">{ticker.requests}</span>
                              <span className={`text-xs ${ticker.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                {ticker.trend}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <span className="text-sm font-bold text-amber-400">{ticker.dfaCompetitor}</span>
                              <p className="text-xs text-zinc-500">{ticker.dfaName}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium font-mono ${
                              ticker.returnComparison.delta.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {ticker.returnComparison.delta}
                            </span>
                            <p className="text-xs text-zinc-500">
                              {ticker.returnComparison.competitor}% vs {ticker.returnComparison.dfa}%
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-zinc-300">
                              <span className="text-cyan-400">${ticker.aum.competitor}</span>
                              <span className="text-zinc-500"> vs </span>
                              <span className="text-amber-400">${ticker.aum.dfa}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-zinc-300">
                              <span className="text-cyan-400">{ticker.expenseRatio.competitor}%</span>
                              <span className="text-zinc-500"> vs </span>
                              <span className="text-amber-400">{ticker.expenseRatio.dfa}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {ticker.hasNotes ? (
                              <button className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors" title="View notes">
                                <FileText className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-zinc-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {ticker.hasTalkingPoints ? (
                              <button className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors" title="View talking points">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-zinc-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button className="p-1.5 bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-300 hover:text-white transition-colors" title="Generate Product Comparison PCR">
                              <FileDown className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button className="p-1.5 hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Row: Popular DFA Tickers + Trend Chart */}
              <div className="grid grid-cols-2 gap-4">
                {/* Most Popular DFA Tickers */}
                <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="relative z-10 p-4 border-b border-zinc-800/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white">Most Popular DFA Tickers</h4>
                        <p className="text-xs text-zinc-500">By number of client models</p>
                      </div>
                      <Award className="w-4 h-4 text-zinc-500" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-zinc-800/30">
                          <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-2">#</th>
                          <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-2">Ticker</th>
                          <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-2">Models</th>
                          <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-2">% of Total</th>
                          <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-2">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {popularDFATickers.map((ticker) => (
                          <tr key={ticker.rank} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-2">
                              <span className="text-xs font-medium text-zinc-500">{ticker.rank}</span>
                            </td>
                            <td className="px-4 py-2">
                              <div>
                                <span className="text-sm font-bold text-amber-400">{ticker.ticker}</span>
                                <p className="text-xs text-zinc-500">{ticker.name}</p>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-zinc-200 font-mono">{ticker.holdings}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-zinc-400">{ticker.pctModels}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`text-xs font-medium ${ticker.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                {ticker.trend}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ticker Adoption Trend */}
                <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 flex flex-col">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="relative z-10 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-white">Ticker Adoption Trend</h4>
                        <p className="text-xs text-zinc-500">Top 3 DFA tickers over time</p>
                      </div>
                      <button className="p-1.5 bg-zinc-800/50 backdrop-blur-sm text-zinc-400 hover:text-cyan-400 transition-colors" title="Download chart data">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-h-0" style={{ minHeight: '200px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={tickerTrends}>
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dx={-10} domain={[150, 350]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="DFUS" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', strokeWidth: 0, r: 3 }} />
                          <Line type="monotone" dataKey="DFAI" stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24', strokeWidth: 0, r: 3 }} />
                          <Line type="monotone" dataKey="DFAE" stroke="#fb923c" strokeWidth={2} dot={{ fill: '#fb923c', strokeWidth: 0, r: 3 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-cyan-400" />
                        <span className="text-xs text-zinc-400">DFUS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-amber-400" />
                        <span className="text-xs text-zinc-400">DFAI</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-orange-400" />
                        <span className="text-xs text-zinc-400">DFAE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

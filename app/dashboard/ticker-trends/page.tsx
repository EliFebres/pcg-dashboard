'use client';

import React, { useState, useMemo } from 'react';
import { Building2, MoreHorizontal, Download, Flame, Award, FileText, ExternalLink, FileDown, User } from 'lucide-react';
import { XAxis, YAxis, ResponsiveContainer, Tooltip, ComposedChart, Line } from 'recharts';
import {
  loggedPortfolios,
  hotTickers as staticHotTickers,
  extractFilterOptions,
  filterPortfolios,
  computePopularDFATickers,
  computeTickerTrendsOverTime,
} from '@/app/lib/data/trends';
import Sidebar from '@/app/components/Sidebar';
import DashboardHeader from '@/app/components/DashboardHeader';
import ClientOnlyChart from '@/app/components/ClientOnlyChart';

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

// Custom tooltip component for charts
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
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
}

export default function TickerTrendsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [teamMemberFilter, setTeamMemberFilter] = useState('All Team Members');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [period, setPeriod] = useState('1Y');

  // Extract filter options from portfolio data
  const filterOptions = useMemo(() => extractFilterOptions(loggedPortfolios), []);

  // Apply filters to get filtered portfolios
  const filteredPortfolios = useMemo(() => {
    return filterPortfolios(loggedPortfolios, teamMemberFilter, departmentFilter, period);
  }, [teamMemberFilter, departmentFilter, period]);

  // Compute ticker data from filtered portfolios
  const popularDFATickers = useMemo(() => computePopularDFATickers(filteredPortfolios), [filteredPortfolios]);
  const tickerTrends = useMemo(() => computeTickerTrendsOverTime(filteredPortfolios), [filteredPortfolios]);

  // Use static hot tickers for now (would be computed from all data sources in production)
  const hotTickers = staticHotTickers;

  // Get top 3 DFA tickers for the trend chart
  const topTrendTickers = useMemo(() => {
    return popularDFATickers.slice(0, 3).map(t => t.ticker);
  }, [popularDFATickers]);

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar className="fixed top-0 left-0 h-screen" />

      {/* Main Content */}
      <main className="flex-1 ml-52">
        {/* Top Bar with Filters */}
        <DashboardHeader
          title="Ticker Trends"
          subtitle="Popular tickers and DFA comparisons"
          searchPlaceholder="Search tickers, funds..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={[
            {
              id: 'teamMember',
              icon: User,
              label: 'Team Member',
              options: filterOptions.teamMembers,
              value: teamMemberFilter,
              onChange: setTeamMemberFilter,
            },
            {
              id: 'department',
              icon: Building2,
              label: 'Department',
              options: filterOptions.departments,
              value: departmentFilter,
              onChange: setDepartmentFilter,
            },
          ]}
          period={period}
          onPeriodChange={setPeriod}
          periodOptions={filterOptions.periods}
          className="sticky top-0 z-10"
        />

        <div className="p-6 space-y-6">
          {/* ==================== TICKER ANALYTICS ==================== */}
          <div>
            <div className="flex items-center gap-2 mb-4">
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
                      {popularDFATickers.slice(0, 8).map((ticker) => (
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
                            <span className="text-sm font-medium text-zinc-200 font-mono">{ticker.count}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-zinc-400">{ticker.pctOfTotal}%</span>
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
                    <ClientOnlyChart>
                      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                        <ComposedChart data={tickerTrends}>
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dx={-10} domain={[0, 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          {topTrendTickers[0] && <Line type="monotone" dataKey={topTrendTickers[0]} stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', strokeWidth: 0, r: 3 }} />}
                          {topTrendTickers[1] && <Line type="monotone" dataKey={topTrendTickers[1]} stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24', strokeWidth: 0, r: 3 }} />}
                          {topTrendTickers[2] && <Line type="monotone" dataKey={topTrendTickers[2]} stroke="#fb923c" strokeWidth={2} dot={{ fill: '#fb923c', strokeWidth: 0, r: 3 }} />}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </ClientOnlyChart>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-2">
                    {topTrendTickers[0] && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-cyan-400" />
                        <span className="text-xs text-zinc-400">{topTrendTickers[0]}</span>
                      </div>
                    )}
                    {topTrendTickers[1] && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-amber-400" />
                        <span className="text-xs text-zinc-400">{topTrendTickers[1]}</span>
                      </div>
                    )}
                    {topTrendTickers[2] && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-orange-400" />
                        <span className="text-xs text-zinc-400">{topTrendTickers[2]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { Building2, PieChart, User } from 'lucide-react';
import {
  loggedPortfolios,
  extractFilterOptions,
  filterPortfolios,
  computeBenchmarkComparison,
} from '@/app/lib/data/portfolioTrends';
import DashboardHeader from '@/app/components/dashboard/shared/DashboardHeader';

export default function PortfolioTrendsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [teamMemberFilter, setTeamMemberFilter] = useState('All Team Members');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [period, setPeriod] = useState('1Y');

  // Tooltip state for chart dots (Style Map, Profitability Map)
  const [dotTooltip, setDotTooltip] = useState<{ label: string; lines: string[]; x: number; y: number } | null>(null);

  const dotHoverHandlers = (label: string, lines: string[]) => ({
    onMouseEnter: (e: React.MouseEvent) => setDotTooltip({ label, lines, x: e.clientX, y: e.clientY }),
    onMouseMove: (e: React.MouseEvent) => setDotTooltip(prev => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev)),
    onMouseLeave: () => setDotTooltip(null),
  });

  const filterOptions = useMemo(() => extractFilterOptions(loggedPortfolios), []);

  const filteredPortfolios = useMemo(() => {
    return filterPortfolios(loggedPortfolios, teamMemberFilter, departmentFilter, period);
  }, [teamMemberFilter, departmentFilter, period]);

  const benchmarkComparison = useMemo(() => computeBenchmarkComparison(filteredPortfolios), [filteredPortfolios]);

  const dataQualityStats = useMemo(() => {
    const total = filteredPortfolios.length;
    const totalPositions = filteredPortfolios.reduce((sum, p) => sum + p.positions.length, 0);
    const avgPositions = total ? Math.round(totalPositions / total) : 0;
    const uniqueClients = new Set(filteredPortfolios.map(p => p.internalClient.name)).size;

    const equityCount = filteredPortfolios.filter(p => {
      const c = p.characteristics;
      return (c.usEquityAllocation + c.devExUsAllocation + c.emAllocation) >= 50;
    }).length;
    const fiCount = total - equityCount;

    const now = Date.now();
    const recent30 = filteredPortfolios.filter(p => {
      const days = (now - new Date(p.loggedAt).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 30;
    }).length;
    const recentPct = total ? Math.round((recent30 / total) * 100) : 0;

    return [
      { label: 'Unique Clients', value: uniqueClients.toLocaleString() },
      { label: 'Portfolios Logged', value: total.toLocaleString() },
      { label: 'Equity Portfolios', value: equityCount.toLocaleString() },
      { label: 'F.I. Portfolios', value: fiCount.toLocaleString() },
      { label: 'Avg Positions', value: avgPositions.toLocaleString() },
      { label: 'Recent Updates', value: `${recentPct}%` },
    ];
  }, [filteredPortfolios]);

  return (
    <>
        {/* Top Bar with Filters */}
        <DashboardHeader
          title="Portfolio Trends"
          subtitle="Portfolio construction insights and client analytics"
          searchPlaceholder="Search clients, portfolios..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={[
            {
              id: 'teamMember',
              icon: User,
              label: 'Team Member',
              options: filterOptions.teamMembers,
              value: teamMemberFilter,
              onChange: (v: string | string[]) => setTeamMemberFilter(v as string),
            },
            {
              id: 'department',
              icon: Building2,
              label: 'Department',
              options: filterOptions.departments,
              value: departmentFilter,
              onChange: (v: string | string[]) => setDepartmentFilter(v as string),
            },
          ]}
          period={period}
          onPeriodChange={setPeriod}
          periodOptions={filterOptions.periods}
          className="sticky top-0 z-10"
        />

        <div className="p-6 space-y-6">
          {/* Data Strip */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 px-5 py-3 rounded-xl">
            <div
              className="grid items-center gap-4"
              style={{ gridTemplateColumns: `10% repeat(${dataQualityStats.length}, minmax(0, 1fr))` }}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted font-medium">
                Data Metrics
              </span>
              {dataQualityStats.map((s) => (
                <div key={s.label} className="flex items-baseline justify-center gap-2 min-w-0">
                  <span className="text-sm font-mono font-semibold text-zinc-200 flex-shrink-0">{s.value}</span>
                  <span className="text-[11px] text-muted truncate">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ==================== SECTION 1: PORTFOLIO CONSTRUCTION ==================== */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Equity Portfolio Trends</h3>
              <span className="text-xs text-muted ml-2">Style, quality, and regional positioning vs benchmark</span>
            </div>

            {/* Charts Row: Style Map + Asset Class + Benchmark Delta */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Style Map - Market Cap vs P/B */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4 -mt-2 -ml-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">Style XY</h4>
                      <p className="text-xs text-muted">Avg client vs MSCI ACWI IMI (1YR)</p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex items-center justify-center" style={{ width: '20px' }}>
                      <span className="-rotate-90 text-xs text-muted whitespace-nowrap">Wtd Avg Mkt Cap ($B)</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex">
                        <div className="flex flex-col justify-between text-right pr-2" style={{ width: '28px', height: '140px' }}>
                          <span className="text-xs text-muted">600</span>
                          <span className="text-xs text-muted">400</span>
                          <span className="text-xs text-muted">200</span>
                        </div>

                        <div className="flex-1 relative border-l border-b border-zinc-700/50 overflow-hidden" style={{ height: '140px' }}>
                          <div className="absolute left-0 right-0 border-t border-zinc-500/50" style={{ top: '35%' }} />
                          <div className="absolute top-0 bottom-0 border-l border-zinc-500/50" style={{ left: '60%' }} />
                          <div
                            className="absolute w-4 h-4 rounded-full bg-zinc-500 border-2 border-zinc-400 z-10 cursor-pointer"
                            style={{ left: '60%', top: '35%', transform: 'translate(-50%, -50%)' }}
                            {...dotHoverHandlers('MSCI ACWI IMI', ['Mkt Cap: $460B', 'P/B: 3.2'])}
                          />
                          <div
                            className="absolute w-4 h-4 rounded-full bg-cyan-500 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 z-10 cursor-pointer"
                            style={{ left: '45%', top: '50%', transform: 'translate(-50%, -50%)' }}
                            {...dotHoverHandlers('Avg Client', ['Mkt Cap: $400B', 'P/B: 2.9'])}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between pl-7 pr-0 mt-1">
                        <span className="text-xs text-muted">2.0</span>
                        <span className="text-xs text-muted">3.0</span>
                        <span className="text-xs text-muted">4.0</span>
                      </div>

                      <div className="text-center mt-1">
                        <span className="text-xs text-muted">Wtd Avg P/B</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-zinc-500 border border-zinc-400" />
                      <span className="text-xs text-muted">MSCI ACWI IMI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-400" />
                      <span className="text-xs text-muted">Avg Client</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profitability Map */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4 -mt-2 -ml-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">Profitability XY</h4>
                      <p className="text-xs text-muted">Avg client vs MSCI ACWI IMI (1YR)</p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex items-center justify-center" style={{ width: '20px' }}>
                      <span className="-rotate-90 text-xs text-muted whitespace-nowrap">Wtd Avg Profitability</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex">
                        <div className="flex flex-col justify-between text-right pr-2" style={{ width: '28px', height: '140px' }}>
                          <span className="text-xs text-muted">.60</span>
                          <span className="text-xs text-muted">.45</span>
                          <span className="text-xs text-muted">.30</span>
                        </div>

                        <div className="flex-1 relative border-l border-b border-zinc-700/50 overflow-hidden" style={{ height: '140px' }}>
                          <div className="absolute left-0 right-0 border-t border-zinc-500/50" style={{ top: '40%' }} />
                          <div className="absolute top-0 bottom-0 border-l border-zinc-500/50" style={{ left: '55%' }} />
                          <div
                            className="absolute w-4 h-4 rounded-full bg-zinc-500 border-2 border-zinc-400 z-10 cursor-pointer"
                            style={{ left: '55%', top: '40%', transform: 'translate(-50%, -50%)' }}
                            {...dotHoverHandlers('MSCI ACWI IMI', ['Profitability: 0.48', 'P/B: 3.1'])}
                          />
                          <div
                            className="absolute w-4 h-4 rounded-full bg-cyan-500 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 z-10 cursor-pointer"
                            style={{ left: '42%', top: '35%', transform: 'translate(-50%, -50%)' }}
                            {...dotHoverHandlers('Avg Client', ['Profitability: 0.50', 'P/B: 2.84'])}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between pl-7 pr-0 mt-1">
                        <span className="text-xs text-muted">2.0</span>
                        <span className="text-xs text-muted">3.0</span>
                        <span className="text-xs text-muted">4.0</span>
                      </div>

                      <div className="text-center mt-1">
                        <span className="text-xs text-muted">Wtd Avg P/B</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-zinc-500 border border-zinc-400" />
                      <span className="text-xs text-muted">MSCI ACWI IMI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-400" />
                      <span className="text-xs text-muted">Avg Client</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benchmark Comparison */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4 -mt-2 -ml-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">vs MSCI ACWI IMI</h4>
                      <p className="text-xs text-muted">Regional delta to benchmark (1YR)</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {benchmarkComparison.map((item) => (
                      <div key={item.metric} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted">{item.metric}</span>
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
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>Client: {item.client}%</span>
                          <span>ACWI: {item.acwi}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Hover tooltip for Style Map / Profitability Map dots */}
        {dotTooltip && (
          <div
            className="fixed px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-md whitespace-nowrap pointer-events-none z-50 shadow-lg"
            style={{ left: dotTooltip.x + 14, top: dotTooltip.y + 4 }}
          >
            <div className="font-medium text-white">{dotTooltip.label}</div>
            {dotTooltip.lines.map(line => (
              <div key={line} className="text-muted font-mono">{line}</div>
            ))}
          </div>
        )}
    </>
  );
}

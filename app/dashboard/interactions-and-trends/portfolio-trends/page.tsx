'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Layers, PieChart, User } from 'lucide-react';
import {
  loggedPortfolios,
  filterPortfolios,
  computeBenchmarkComparison,
} from '@/app/lib/data/portfolioTrends';
import type { BenchmarkComparison } from '@/app/lib/types/trends';
import DashboardHeader from '@/app/components/dashboard/shared/DashboardHeader';
import { useCurrentUser } from '@/app/lib/auth/context';
import { toDisplayName } from '@/app/lib/auth/types';

// Static filter options — mirrors the Client Interactions dashboard's structure.
// Filter selection is purely cosmetic on this dashboard for now; the underlying
// portfolio data is dummy and not yet wired up.
const OFFICE_GROUP = { label: 'Office', options: ['Austin Office', 'Charlotte Office'] };
const DEPARTMENTS = ['Broker-Dealer', 'IAG', 'Institutional', 'Retirement Group'];

// Portfolios selector — drives which series render on the cards. Avg. Client is the
// default; Core+ Model is a firm-defined model portfolio.
const PORTFOLIO_OPTIONS = ['Avg. Client', 'Core+ Model'] as const;
type PortfolioName = typeof PORTFOLIO_OPTIONS[number];

// Color is tied to selection order, not portfolio name. Whichever portfolio is selected
// first gets palette[0], the next selection gets palette[1]. Avg. Client is the default
// first selection so it lands on palette[0] until the user reshuffles selections.
const PORTFOLIO_PALETTE: ReadonlyArray<{ hex: string; glow: string }> = [
  { hex: '#1398A4', glow: 'rgba(19, 152, 164, 0.45)' },
  { hex: '#BFD22B', glow: 'rgba(191, 210, 43, 0.3)' },
];

// Maps a value on a [min, max] axis to a CSS percentage offset.
// Use invert=true for the Y axis: top:0% is the top of the container, but the axis max sits at the top.
const pct = (value: number, min: number, max: number, invert = false) => {
  const ratio = (value - min) / (max - min);
  return `${(invert ? 1 - ratio : ratio) * 100}%`;
};

// Returns the N most recent completed quarter-end labels (e.g. "Q1 2026", "Q4 2025", ...).
function getRecentQuarterEnds(count: number): string[] {
  const now = new Date();
  let q = Math.floor(now.getMonth() / 3) + 1; // 1-4 for current (in-progress) quarter
  let y = now.getFullYear();
  // Step back to the most recent completed quarter
  q -= 1;
  if (q === 0) { q = 4; y -= 1; }

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(`Q${q} ${y}`);
    q -= 1;
    if (q === 0) { q = 4; y -= 1; }
  }
  return result;
}

export default function PortfolioTrendsDashboard() {
  const { user } = useCurrentUser();
  const isGuest = user?.team === 'Guest';
  const canSeeAllTeams = user?.role === 'admin' || user?.team === 'Leadership' || isGuest;
  const currentUser = user ? toDisplayName(user.firstName, user.lastName) : 'All Team Members';

  // Filter state
  const [teamMemberFilter, setTeamMemberFilter] = useState('All Team Members');
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [portfolioFilter, setPortfolioFilterRaw] = useState<PortfolioName[]>(['Avg. Client']);
  const quarterEndOptions = useMemo(() => getRecentQuarterEnds(8), []);
  const [period, setPeriod] = useState(quarterEndOptions[0]);

  // Always keep at least one portfolio selected — snap back to Avg. Client on empty.
  const setPortfolioFilter = (next: string[]) => {
    setPortfolioFilterRaw(next.length === 0 ? ['Avg. Client'] : (next as PortfolioName[]));
  };

  // Guests don't have "Team Members" — their only scope is the cross-team aggregate.
  useEffect(() => {
    if (isGuest && teamMemberFilter === 'All Team Members') {
      setTeamMemberFilter('All Teams');
    }
  }, [isGuest, teamMemberFilter]);

  // XY chart data — drives dot positions, crosshair positions, and tooltip text.
  const styleXY = {
    x: { min: 2.0, max: 4.0, format: (v: number) => v.toFixed(1) },
    y: { min: 200, max: 600, format: (v: number) => `$${v}B` },
    benchmark: { name: 'MSCI ACWI IMI', x: 3.2, y: 460 },
    portfolios: {
      'Avg. Client': { x: 2.90, y: 400 },
      'Core+ Model': { x: 2.75, y: 425 },
    } as Record<PortfolioName, { x: number; y: number }>,
  };
  const profitabilityXY = {
    x: { min: 2.0, max: 4.0, format: (v: number) => v.toFixed(2) },
    y: { min: 0.30, max: 0.60, format: (v: number) => v.toFixed(2) },
    benchmark: { name: 'MSCI ACWI IMI', x: 3.10, y: 0.48 },
    portfolios: {
      'Avg. Client': { x: 2.84, y: 0.50 },
      'Core+ Model': { x: 2.70, y: 0.46 },
    } as Record<PortfolioName, { x: number; y: number }>,
  };

  // Tooltip state for chart dots (Style Map, Profitability Map)
  const [dotTooltip, setDotTooltip] = useState<{ label: string; lines: string[]; x: number; y: number } | null>(null);

  const dotHoverHandlers = (label: string, lines: string[]) => ({
    onMouseEnter: (e: React.MouseEvent) => setDotTooltip({ label, lines, x: e.clientX, y: e.clientY }),
    onMouseMove: (e: React.MouseEvent) => setDotTooltip(prev => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev)),
    onMouseLeave: () => setDotTooltip(null),
  });

  const filteredPortfolios = useMemo(() => {
    // All filters are cosmetic for now — pass the "all" sentinels so dummy data
    // isn't filtered out when a user makes a selection.
    return filterPortfolios(loggedPortfolios, 'All Team Members', 'All Departments', 'ALL');
  }, []);

  const benchmarkComparison = useMemo(() => computeBenchmarkComparison(filteredPortfolios), [filteredPortfolios]);

  // Per-portfolio variants of the regional benchmark comparison. Avg. Client uses the
  // computed average; Core+ Model is a hardcoded mock variant that shares the same metric
  // ordering and ACWI baseline.
  const benchmarkComparisonByPortfolio = useMemo<Record<PortfolioName, BenchmarkComparison[]>>(() => {
    const acwiByMetric = benchmarkComparison.reduce<Record<string, number>>((acc, row) => {
      acc[row.metric] = row.acwi;
      return acc;
    }, {});
    const buildVariant = (clients: Record<string, number>): BenchmarkComparison[] =>
      benchmarkComparison.map(row => {
        const client = clients[row.metric] ?? row.client;
        const acwi = acwiByMetric[row.metric] ?? row.acwi;
        return { metric: row.metric, client, acwi, delta: Math.round((client - acwi) * 10) / 10 };
      });
    return {
      'Avg. Client': benchmarkComparison,
      'Core+ Model': buildVariant({ 'US Equity': 58, 'Intl Dev': 30, 'EM': 12 }),
    };
  }, [benchmarkComparison]);

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
          searchPlaceholder=""
          searchValue=""
          onSearchChange={() => {}}
          filters={[
            ...(isGuest
              ? [{
                  id: 'teamMember',
                  icon: User,
                  label: 'Team Member',
                  options: ['All Teams'],
                  value: teamMemberFilter,
                  onChange: (v: string | string[]) => setTeamMemberFilter(v as string),
                }]
              : [{
                  id: 'teamMember',
                  icon: User,
                  label: 'Team Member',
                  options: [
                    'All Team Members',
                    ...OFFICE_GROUP.options,
                    currentUser,
                    ...(canSeeAllTeams ? ['All Teams'] : []),
                  ],
                  optionGroups: [
                    ...(canSeeAllTeams ? [{ label: 'Scope', options: ['All Teams'] }] : []),
                    OFFICE_GROUP,
                    { label: 'Members', options: [currentUser] },
                  ],
                  value: teamMemberFilter,
                  onChange: (v: string | string[]) => setTeamMemberFilter(v as string),
                }]),
            {
              id: 'department',
              icon: Building2,
              label: 'Department',
              options: ['All Departments', ...DEPARTMENTS],
              value: departmentFilter,
              onChange: (v: string | string[]) => setDepartmentFilter(v as string[]),
              multiSelect: true,
            },
            {
              id: 'portfolios',
              icon: Layers,
              label: 'Portfolios',
              options: [...PORTFOLIO_OPTIONS],
              value: portfolioFilter,
              onChange: (v: string | string[]) => setPortfolioFilter(v as string[]),
              multiSelect: true,
              noAllOption: true,
            },
          ]}
          period={period}
          onPeriodChange={setPeriod}
          periodOptions={quarterEndOptions}
          className="sticky top-0 z-10"
          alwaysShowFilters
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
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4 -mt-2 -ml-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">Style XY</h4>
                      <p className="text-xs text-muted">vs MSCI ACWI IMI ({period})</p>
                    </div>
                  </div>

                  <div className="flex flex-1 min-h-[140px]">
                    <div className="flex items-center justify-center" style={{ width: '20px' }}>
                      <span className="-rotate-90 text-xs text-muted whitespace-nowrap">Wtd Avg Mkt Cap ($B)</span>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex flex-1">
                        <div className="flex flex-col justify-between text-right pr-2" style={{ width: '28px' }}>
                          <span className="text-xs text-muted">600</span>
                          <span className="text-xs text-muted">400</span>
                          <span className="text-xs text-muted">200</span>
                        </div>

                        <div className="flex-1 relative border-l border-b border-zinc-700/50 overflow-hidden">
                          <div className="data-pop absolute left-0 right-0 border-t border-zinc-500/50" style={{ top: pct(styleXY.benchmark.y, styleXY.y.min, styleXY.y.max, true) }} />
                          <div className="data-pop absolute top-0 bottom-0 border-l border-zinc-500/50" style={{ left: pct(styleXY.benchmark.x, styleXY.x.min, styleXY.x.max) }} />
                          <div
                            className="data-pop absolute w-4 h-4 rounded-full bg-zinc-500 border-2 border-zinc-400 z-10 cursor-pointer"
                            style={{
                              left: pct(styleXY.benchmark.x, styleXY.x.min, styleXY.x.max),
                              top: pct(styleXY.benchmark.y, styleXY.y.min, styleXY.y.max, true),
                              transform: 'translate(-50%, -50%)',
                            }}
                            {...dotHoverHandlers(styleXY.benchmark.name, [
                              `Mkt Cap: ${styleXY.y.format(styleXY.benchmark.y)}`,
                              `P/B: ${styleXY.x.format(styleXY.benchmark.x)}`,
                            ])}
                          />
                          {portfolioFilter.map((name, idx) => {
                            const point = styleXY.portfolios[name];
                            const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                            return (
                              <div
                                key={name}
                                className="data-pop absolute w-4 h-4 rounded-full border-2 z-10 cursor-pointer"
                                style={{
                                  left: pct(point.x, styleXY.x.min, styleXY.x.max),
                                  top: pct(point.y, styleXY.y.min, styleXY.y.max, true),
                                  transform: 'translate(-50%, -50%)',
                                  backgroundColor: color.hex,
                                  borderColor: color.hex,
                                  boxShadow: `0 0 14px ${color.glow}`,
                                }}
                                {...dotHoverHandlers(name, [
                                  `Mkt Cap: ${styleXY.y.format(point.y)}`,
                                  `P/B: ${styleXY.x.format(point.x)}`,
                                ])}
                              />
                            );
                          })}
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

                  <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-zinc-500 border border-zinc-400" />
                      <span className="text-xs text-muted">MSCI ACWI IMI</span>
                    </div>
                    {portfolioFilter.map((name, idx) => {
                      const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                      return (
                        <div key={name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: color.hex, borderColor: color.hex }}
                          />
                          <span className="text-xs text-muted">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Profitability Map */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4 -mt-2 -ml-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">Profitability XY</h4>
                      <p className="text-xs text-muted">vs MSCI ACWI IMI ({period})</p>
                    </div>
                  </div>

                  <div className="flex flex-1 min-h-[140px]">
                    <div className="flex items-center justify-center" style={{ width: '20px' }}>
                      <span className="-rotate-90 text-xs text-muted whitespace-nowrap">Wtd Avg Profitability</span>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex flex-1">
                        <div className="flex flex-col justify-between text-right pr-2" style={{ width: '28px' }}>
                          <span className="text-xs text-muted">.60</span>
                          <span className="text-xs text-muted">.45</span>
                          <span className="text-xs text-muted">.30</span>
                        </div>

                        <div className="flex-1 relative border-l border-b border-zinc-700/50 overflow-hidden">
                          <div className="data-pop absolute left-0 right-0 border-t border-zinc-500/50" style={{ top: pct(profitabilityXY.benchmark.y, profitabilityXY.y.min, profitabilityXY.y.max, true) }} />
                          <div className="data-pop absolute top-0 bottom-0 border-l border-zinc-500/50" style={{ left: pct(profitabilityXY.benchmark.x, profitabilityXY.x.min, profitabilityXY.x.max) }} />
                          <div
                            className="data-pop absolute w-4 h-4 rounded-full bg-zinc-500 border-2 border-zinc-400 z-10 cursor-pointer"
                            style={{
                              left: pct(profitabilityXY.benchmark.x, profitabilityXY.x.min, profitabilityXY.x.max),
                              top: pct(profitabilityXY.benchmark.y, profitabilityXY.y.min, profitabilityXY.y.max, true),
                              transform: 'translate(-50%, -50%)',
                            }}
                            {...dotHoverHandlers(profitabilityXY.benchmark.name, [
                              `Profitability: ${profitabilityXY.y.format(profitabilityXY.benchmark.y)}`,
                              `P/B: ${profitabilityXY.x.format(profitabilityXY.benchmark.x)}`,
                            ])}
                          />
                          {portfolioFilter.map((name, idx) => {
                            const point = profitabilityXY.portfolios[name];
                            const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                            return (
                              <div
                                key={name}
                                className="data-pop absolute w-4 h-4 rounded-full border-2 z-10 cursor-pointer"
                                style={{
                                  left: pct(point.x, profitabilityXY.x.min, profitabilityXY.x.max),
                                  top: pct(point.y, profitabilityXY.y.min, profitabilityXY.y.max, true),
                                  transform: 'translate(-50%, -50%)',
                                  backgroundColor: color.hex,
                                  borderColor: color.hex,
                                  boxShadow: `0 0 14px ${color.glow}`,
                                }}
                                {...dotHoverHandlers(name, [
                                  `Profitability: ${profitabilityXY.y.format(point.y)}`,
                                  `P/B: ${profitabilityXY.x.format(point.x)}`,
                                ])}
                              />
                            );
                          })}
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

                  <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-zinc-500 border border-zinc-400" />
                      <span className="text-xs text-muted">MSCI ACWI IMI</span>
                    </div>
                    {portfolioFilter.map((name, idx) => {
                      const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                      return (
                        <div key={name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: color.hex, borderColor: color.hex }}
                          />
                          <span className="text-xs text-muted">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Benchmark Comparison */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl">
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
                    {benchmarkComparison.map((item, metricIdx) => {
                      const primary = portfolioFilter[0];
                      const headerDelta = benchmarkComparisonByPortfolio[primary][metricIdx].delta;
                      return (
                        <div key={item.metric} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted">{item.metric}</span>
                            <span className={`font-medium font-mono ${headerDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {headerDelta >= 0 ? '+' : ''}{headerDelta}%
                            </span>
                          </div>
                          <div className="space-y-1">
                            {portfolioFilter.map((name, idx) => {
                              const row = benchmarkComparisonByPortfolio[name][metricIdx];
                              const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                              return (
                                <div key={name} className="flex gap-1 h-4">
                                  <div
                                    className="bar-grow-x rounded-sm border-2"
                                    style={{
                                      width: `${row.client}%`,
                                      backgroundColor: color.hex,
                                      borderColor: color.hex,
                                      boxShadow: `0 0 8px ${color.glow}`,
                                    }}
                                    title={`${name}: ${row.client}%`}
                                  />
                                  <div
                                    className="bar-grow-x bg-zinc-600/50 rounded-sm"
                                    style={{ width: `${item.acwi}%` }}
                                    title={`ACWI: ${item.acwi}%`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted">
                            {portfolioFilter.map((name, i) => {
                              const row = benchmarkComparisonByPortfolio[name][metricIdx];
                              return (
                                <span key={name}>
                                  {name}: {row.client}%{i < portfolioFilter.length - 1 ? ' ·' : ''}
                                </span>
                              );
                            })}
                            <span>· ACWI: {item.acwi}%</span>
                          </div>
                        </div>
                      );
                    })}
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

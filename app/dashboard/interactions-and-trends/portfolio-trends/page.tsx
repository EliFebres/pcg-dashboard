'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Layers, PieChart, User } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import {
  loggedPortfolios,
  filterPortfolios,
  computeBenchmarkComparison,
} from '@/app/lib/data/portfolioTrends';
import type { BenchmarkComparison } from '@/app/lib/types/trends';
import DashboardHeader from '@/app/components/dashboard/shared/DashboardHeader';
import ClientOnlyChart from '@/app/components/dashboard/shared/ClientOnlyChart';
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

  // Deferred-unmount list driving every portfolio-keyed render (dots, bars, polygons, table cells).
  // When a portfolio is deselected we keep its row here with `exiting: true` for the duration of the
  // fade-out, then sweep it out, so visuals animate away instead of disappearing on the next render.
  const PORTFOLIO_EXIT_MS = 400;
  type DisplayedPortfolio = { name: PortfolioName; idx: number; exiting: boolean };
  const [displayedPortfolios, setDisplayedPortfolios] = useState<DisplayedPortfolio[]>(
    () => portfolioFilter.map((name, idx) => ({ name, idx, exiting: false }))
  );
  useEffect(() => {
    setDisplayedPortfolios(prev => {
      const next: DisplayedPortfolio[] = [];
      prev.forEach(p => {
        const newIdx = portfolioFilter.indexOf(p.name);
        if (newIdx !== -1) {
          // Still selected — refresh idx and clear any pending exit (handles re-selection mid-fade).
          next.push({ name: p.name, idx: newIdx, exiting: false });
        } else if (!p.exiting) {
          // Newly deselected — start fade, keep old idx so its color stays stable through the fade.
          next.push({ ...p, exiting: true });
        } else {
          // Already exiting and still gone — keep until cleanup timer removes it.
          next.push(p);
        }
      });
      portfolioFilter.forEach((name, idx) => {
        if (!next.find(p => p.name === name)) {
          next.push({ name, idx, exiting: false });
        }
      });
      return next;
    });
  }, [portfolioFilter]);
  useEffect(() => {
    if (!displayedPortfolios.some(p => p.exiting)) return;
    const t = setTimeout(() => {
      setDisplayedPortfolios(prev => prev.filter(p => !p.exiting));
    }, PORTFOLIO_EXIT_MS);
    return () => clearTimeout(t);
  }, [displayedPortfolios]);

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

  // Cap Tilt — index ("0 line") and per-portfolio Large/Mid/Small Cap allocations in %.
  // Bars in the diverging chart are anchored at the index value: positive deltas grow right,
  // negative deltas grow left. MAX_DELTA scales the half-track so a ±MAX_DELTA pp move uses
  // 100% of the half-width.
  const CAP_BUCKETS = ['Large Cap', 'Mid Cap', 'Small Cap'] as const;
  type CapBucket = typeof CAP_BUCKETS[number];
  const CAP_MAX_DELTA = 10;
  const capAllocation: {
    index: Record<CapBucket, number>;
    portfolios: Record<PortfolioName, Record<CapBucket, number>>;
  } = {
    index:       { 'Large Cap': 60, 'Mid Cap': 25, 'Small Cap': 15 },
    portfolios: {
      'Avg. Client': { 'Large Cap': 65, 'Mid Cap': 22, 'Small Cap': 13 },
      'Core+ Model': { 'Large Cap': 54, 'Mid Cap': 28, 'Small Cap': 18 },
    },
  };

  // Style x Profitability — four sub-buckets per portfolio, summing to 100%. Growth and Value
  // totals shown in the right-hand table are derived as HighProf + LowProf.
  const STYLE_PROF_CATEGORIES = ['Growth High-Prof', 'Growth Low-Prof', 'Value High-Prof', 'Value Low-Prof'] as const;
  type StyleProfCategory = typeof STYLE_PROF_CATEGORIES[number];
  const styleProfitability: {
    index: Record<StyleProfCategory, number>;
    portfolios: Record<PortfolioName, Record<StyleProfCategory, number>>;
  } = {
    index:       { 'Growth High-Prof': 30, 'Growth Low-Prof': 22, 'Value High-Prof': 28, 'Value Low-Prof': 20 },
    portfolios: {
      'Avg. Client': { 'Growth High-Prof': 32, 'Growth Low-Prof': 18, 'Value High-Prof': 30, 'Value Low-Prof': 20 },
      'Core+ Model': { 'Growth High-Prof': 35, 'Growth Low-Prof': 12, 'Value High-Prof': 35, 'Value Low-Prof': 18 },
    },
  };
  // Short labels rendered onto each ring of the radial chart (full names live in the table).
  const STYLE_PROF_SHORT: Record<StyleProfCategory, string> = {
    'Growth High-Prof': 'G-HP',
    'Growth Low-Prof':  'G-LP',
    'Value High-Prof':  'V-HP',
    'Value Low-Prof':   'V-LP',
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
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl flex flex-col min-h-[340px]">
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
                          {displayedPortfolios.map(({ name, idx, exiting }) => {
                            const point = styleXY.portfolios[name];
                            const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                            return (
                              <div
                                key={name}
                                className={`${exiting ? 'data-fade' : 'data-pop'} absolute w-4 h-4 rounded-full border-2 z-10 cursor-pointer`}
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
                    {displayedPortfolios.map(({ name, idx, exiting }) => {
                      const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                      return (
                        <div key={name} className={`flex items-center gap-2 ${exiting ? 'data-fade' : ''}`}>
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
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl flex flex-col min-h-[340px]">
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
                          {displayedPortfolios.map(({ name, idx, exiting }) => {
                            const point = profitabilityXY.portfolios[name];
                            const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                            return (
                              <div
                                key={name}
                                className={`${exiting ? 'data-fade' : 'data-pop'} absolute w-4 h-4 rounded-full border-2 z-10 cursor-pointer`}
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
                    {displayedPortfolios.map(({ name, idx, exiting }) => {
                      const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                      return (
                        <div key={name} className={`flex items-center gap-2 ${exiting ? 'data-fade' : ''}`}>
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
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl min-h-[340px] flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4 -mt-2 -ml-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">vs MSCI ACWI IMI</h4>
                      <p className="text-xs text-muted">Regional delta to benchmark (1YR)</p>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-around">
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
                            {displayedPortfolios.map(({ name, idx, exiting }) => {
                              const row = benchmarkComparisonByPortfolio[name][metricIdx];
                              const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                              return (
                                <div key={name} className={`flex gap-1 h-4 ${exiting ? 'data-fade' : ''}`}>
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
                            {displayedPortfolios.map(({ name, exiting }, i) => {
                              const row = benchmarkComparisonByPortfolio[name][metricIdx];
                              return (
                                <span key={name} className={exiting ? 'data-fade' : ''}>
                                  {name}: {row.client}%{i < displayedPortfolios.length - 1 ? ' ·' : ''}
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

            {/* Charts Row 2: Cap Tilt + Style x Profitability */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Cap Tilt vs Index — diverging bars anchored at the index */}
              <div className="col-span-1 relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4 -mt-2 -ml-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">Cap Tilt vs Index</h4>
                      <p className="text-xs text-muted">vs MSCI ACWI IMI ({period})</p>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-around min-h-[140px] py-2">
                    {CAP_BUCKETS.map(bucket => (
                      <div key={bucket} className="flex items-center gap-3">
                        <span className="text-xs text-muted w-16 flex-shrink-0">{bucket}</span>
                        <div className="relative flex-1">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-500/70 z-10" />
                          <div className="flex flex-col gap-1.5 py-1">
                            {displayedPortfolios.map(({ name, idx, exiting }) => {
                              const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                              const delta = Math.round((capAllocation.portfolios[name][bucket] - capAllocation.index[bucket]) * 10) / 10;
                              const positive = delta >= 0;
                              const barWidth = Math.min(Math.abs(delta) / CAP_MAX_DELTA, 1) * 50;
                              return (
                                <div key={name} className={`relative h-2.5 ${exiting ? 'data-fade' : ''}`}>
                                  <div
                                    className={`${positive ? 'bar-grow-x' : 'bar-grow-x-left'} absolute top-0 h-full rounded-sm`}
                                    style={{
                                      width: `${barWidth}%`,
                                      left: positive ? '50%' : `${50 - barWidth}%`,
                                      backgroundColor: color.hex,
                                      boxShadow: `0 0 8px ${color.glow}`,
                                    }}
                                    title={`${name}: ${positive ? '+' : ''}${delta}%`}
                                  />
                                  <span
                                    className="absolute top-1/2 -translate-y-1/2 text-[10px] font-mono tabular-nums whitespace-nowrap"
                                    style={{
                                      color: color.hex,
                                      ...(positive
                                        ? { left: `calc(50% + ${barWidth}% + 4px)` }
                                        : { right: `calc(50% + ${barWidth}% + 4px)` }),
                                    }}
                                  >
                                    {positive ? '+' : ''}{delta}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-zinc-500/70" />
                      <span className="text-xs text-muted">MSCI ACWI IMI</span>
                    </div>
                    {displayedPortfolios.map(({ name, idx, exiting }) => {
                      const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                      return (
                        <div key={name} className={`flex items-center gap-2 ${exiting ? 'data-fade' : ''}`}>
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color.hex }} />
                          <span className="text-xs text-muted">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Style x Profitability — concentric radial + allocation table */}
              <div className="col-span-2 relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4 -mt-2 -ml-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">Style × Profitability</h4>
                      <p className="text-xs text-muted">Allocation breakdown ({period})</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 flex-1 min-h-[220px]">
                    {/* Radar chart — 4 axes (one per category) radiating from center. Each
                        selected portfolio is a filled polygon connecting its category values. */}
                    <div className="relative flex items-center justify-center">
                      <ClientOnlyChart>
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                          <RadarChart
                            data={STYLE_PROF_CATEGORIES.map(cat => {
                              const row: Record<string, string | number> = {
                                category: STYLE_PROF_SHORT[cat],
                                index: styleProfitability.index[cat],
                              };
                              displayedPortfolios.forEach(p => {
                                // Slug name as dataKey so kept + exiting portfolios never collide.
                                row[p.name.replace(/\W/g, '_')] = styleProfitability.portfolios[p.name][cat];
                              });
                              return row;
                            })}
                            outerRadius="78%"
                          >
                            <PolarGrid stroke="rgba(82, 82, 91, 0.45)" />
                            <PolarAngleAxis
                              dataKey="category"
                              tick={{ fill: '#a5a5b2', fontSize: 11 }}
                            />
                            <PolarRadiusAxis
                              angle={90}
                              domain={[0, 40]}
                              tick={false}
                              axisLine={false}
                            />
                            {/* Index polygon — drawn first so portfolios layer on top.
                                Fill matches the zinc-500 benchmark dot used in the XY charts. */}
                            <Radar
                              name="MSCI ACWI IMI"
                              dataKey="index"
                              stroke="#a1a1aa"
                              strokeWidth={1.5}
                              fill="#71717a"
                              fillOpacity={0.35}
                              isAnimationActive
                              animationDuration={700}
                            />
                            {displayedPortfolios.map(({ name, idx, exiting }) => {
                              const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                              return (
                                <Radar
                                  key={name}
                                  name={name}
                                  dataKey={name.replace(/\W/g, '_')}
                                  stroke={color.hex}
                                  strokeWidth={2}
                                  fill={color.hex}
                                  fillOpacity={0.18}
                                  isAnimationActive
                                  animationDuration={700}
                                  style={{
                                    filter: `drop-shadow(0 0 6px ${color.glow})`,
                                    opacity: exiting ? 0 : 1,
                                    transition: `opacity ${PORTFOLIO_EXIT_MS}ms ease-out`,
                                  }}
                                />
                              );
                            })}
                          </RadarChart>
                        </ResponsiveContainer>
                      </ClientOnlyChart>
                    </div>

                    {/* Allocation table — sized to 80% of the card height, anchored to the top */}
                    <div className="h-[80%] self-start w-full flex flex-col">
                      <table className="w-full h-full text-xs">
                        <thead>
                          <tr className="border-b border-zinc-700/60">
                            <th className="text-left font-normal py-1.5 pr-2 text-muted">Category</th>
                            {displayedPortfolios.map(({ name, idx, exiting }) => {
                              const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                              return (
                                <th
                                  key={name}
                                  className={`text-right font-medium py-1.5 pl-2 ${exiting ? 'data-fade' : ''}`}
                                  style={{ color: color.hex }}
                                >
                                  {name}
                                </th>
                              );
                            })}
                            <th className="text-right font-medium py-1.5 pl-2" style={{ color: '#a1a1aa' }}>
                              Index
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {([
                            { total: 'Growth' as const, subs: ['Growth High-Prof', 'Growth Low-Prof'] as const },
                            { total: 'Value' as const,  subs: ['Value High-Prof',  'Value Low-Prof']  as const },
                          ]).map(group => (
                            <React.Fragment key={group.total}>
                              <tr className="border-b border-zinc-800/40">
                                <td className="py-1.5 pr-2 text-white font-medium">{group.total}</td>
                                {displayedPortfolios.map(({ name, exiting }) => {
                                  const a = styleProfitability.portfolios[name];
                                  return (
                                    <td key={name} className={`text-right font-mono tabular-nums py-1.5 pl-2 text-white font-medium ${exiting ? 'data-fade' : ''}`}>
                                      {a[group.subs[0]] + a[group.subs[1]]}%
                                    </td>
                                  );
                                })}
                                <td className="text-right font-mono tabular-nums py-1.5 pl-2 text-white font-medium">
                                  {styleProfitability.index[group.subs[0]] + styleProfitability.index[group.subs[1]]}%
                                </td>
                              </tr>
                              {group.subs.map(cat => (
                                <tr key={cat} className="border-b border-zinc-800/40 last:border-b-0">
                                  <td className="py-1.5 pl-4 pr-2 text-muted">{cat}</td>
                                  {displayedPortfolios.map(({ name, exiting }) => (
                                    <td key={name} className={`text-right font-mono tabular-nums py-1.5 pl-2 text-muted ${exiting ? 'data-fade' : ''}`}>
                                      {styleProfitability.portfolios[name][cat]}%
                                    </td>
                                  ))}
                                  <td className="text-right font-mono tabular-nums py-1.5 pl-2 text-muted">
                                    {styleProfitability.index[cat]}%
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

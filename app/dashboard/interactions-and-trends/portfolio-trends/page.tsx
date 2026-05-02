'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Layers, PieChart, User } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import BenchmarkBarChart from '@/app/components/dashboard/interactions-and-trends/portfolio-trends/BenchmarkBarChart';
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
type DisplayedPortfolio = { name: PortfolioName; idx: number; exiting: boolean };
type DeltaState = 'visible' | 'exiting' | 'hidden';

// Duration of the col-collapse / data-fade exit animations + the deferred React unmount that
// follows. Kept in sync with the 1.2s timing in globals.css so cells finish animating out
// before they're swept from the DOM.
const PORTFOLIO_EXIT_MS = 1200;

// Row-to-row stagger for the Portfolio Trends grid: row 2's animations (col-expand,
// data-pop, data-fade, benchmark bar rise/shrink, radar polygon) all start this many ms
// after row 1's. Must match the 0.667s in the .row-stagger-2 rules in globals.css.
const ROW_2_STAGGER_MS = 667;

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

// Delta-column visibility for the Metrics vs Index and Style × Profitability cards. Both
// want delta columns when there's room and drop them (with col-collapse animation) when
// the viewport is too narrow to fit a 2nd portfolio + 2 delta columns alongside everything
// else in the row. Driven off viewport width (not card content width) because the Style ×
// Profitability card shares its row with a radar chart whose layout would otherwise muddy
// the "is there room?" signal.
//
// Hand-off sequencing in compact mode (mirrors PORTFOLIO_EXIT_MS):
//   add 2nd portfolio   → delta columns col-collapse (1.2s) → 2nd portfolio col-expands (1.2s)
//   remove 2nd portfolio → 2nd portfolio col-collapses (1.2s) → delta columns col-expand (1.2s)
function useDeltaColumns(
  viewportThreshold: number,
  displayedPortfolios: DisplayedPortfolio[],
  portfolioFilter: readonly PortfolioName[],
) {
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${viewportThreshold - 1}px)`);
    setIsCompact(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsCompact(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [viewportThreshold]);

  const wantHidden = isCompact && portfolioFilter.length > 1;
  const [deltaState, setDeltaState] = useState<DeltaState>(wantHidden ? 'hidden' : 'visible');
  useEffect(() => {
    if (wantHidden) {
      setDeltaState(prev => (prev === 'visible' ? 'exiting' : prev));
    } else {
      // Wait until the dying portfolio column has fully unmounted before showing deltas back,
      // so it col-collapses alone before the deltas col-expand into the freed space.
      if (displayedPortfolios.some(p => p.exiting)) return;
      setDeltaState(prev => (prev === 'visible' ? prev : 'visible'));
    }
  }, [wantHidden, displayedPortfolios]);
  useEffect(() => {
    if (deltaState !== 'exiting') return;
    const t = setTimeout(() => setDeltaState('hidden'), PORTFOLIO_EXIT_MS);
    return () => clearTimeout(t);
  }, [deltaState]);

  // While the card is compact and a hand-off is in flight (deltas visible or exiting), keep
  // newly-added portfolios out of *this* card's render so the deltas finish col-collapsing
  // before the 2nd portfolio's column mounts and col-expands.
  const visiblePortfolios = (isCompact && deltaState !== 'hidden' && portfolioFilter[0])
    ? displayedPortfolios.filter(p => p.name === portfolioFilter[0])
    : displayedPortfolios;

  return { deltaState, visiblePortfolios };
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

  // Shared delta-column hand-off — both the Metrics vs Index and Style × Profitability cards
  // switch on the same viewport breakpoint, so a single hook call drives both renderings.
  const { deltaState, visiblePortfolios } = useDeltaColumns(
    1600, displayedPortfolios, portfolioFilter
  );


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

  // Cap allocations — index and per-portfolio Large/Mid/Small Cap weights in %.
  const CAP_BUCKETS = ['Large Cap', 'Mid Cap', 'Small Cap'] as const;
  type CapBucket = typeof CAP_BUCKETS[number];
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

  // Holdings-count mock data for the metrics-vs-index table (the other rows reuse the
  // values already powering the XY / Style × Profitability cards).
  const companyCounts: { index: number; portfolios: Record<PortfolioName, number> } = {
    index: 8800,
    portfolios: { 'Avg. Client': 245, 'Core+ Model': 78 },
  };

  // Row schema for the metrics-vs-index table. Each row pulls portfolio + index values
  // from the same data sources that drive the visual cards above, plus a formatter for
  // the cell value and the delta. `indent` marks Style × Profitability sub-rows.
  type MetricRow = {
    id: string;
    label: string;
    // For some metrics a lower-than-index reading is the favorable direction (e.g. cheaper P/B,
    // less mega-cap concentration). Flip the green/red mapping on those rows so the color
    // reflects "good vs bad" rather than literal "above vs below".
    invertColor?: boolean;
    index: number;
    getPortfolio: (name: PortfolioName) => number;
    format: (v: number) => string;
    formatDelta: (v: number) => string;
  };
  const fmtPct        = (v: number) => `${v.toFixed(0)}%`;
  const fmtPctDelta   = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;
  const fmtRatio      = (v: number) => v.toFixed(2);
  const fmtRatioDelta = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;
  const fmtMktCap     = (v: number) => `$${v}B`;
  const fmtMktCapDel  = (v: number) => `${v >= 0 ? '+' : '−'}$${Math.abs(Math.round(v))}B`;
  const fmtCount      = (v: number) => v.toLocaleString();
  const fmtCountDelta = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toLocaleString()}`;
  const metricsTableRows: MetricRow[] = [
    {
      id: 'companies', label: '# of Companies',
      index: companyCounts.index,
      getPortfolio: (name) => companyCounts.portfolios[name],
      format: fmtCount, formatDelta: fmtCountDelta,
    },
    {
      id: 'mktCap', label: 'Wtd Avg Mkt Cap', invertColor: true,
      index: styleXY.benchmark.y,
      getPortfolio: (name) => styleXY.portfolios[name].y,
      format: fmtMktCap, formatDelta: fmtMktCapDel,
    },
    {
      id: 'pb', label: 'P/B', invertColor: true,
      index: styleXY.benchmark.x,
      getPortfolio: (name) => styleXY.portfolios[name].x,
      format: fmtRatio, formatDelta: fmtRatioDelta,
    },
    {
      id: 'profitability', label: 'Profitability',
      index: profitabilityXY.benchmark.y,
      getPortfolio: (name) => profitabilityXY.portfolios[name].y,
      format: fmtRatio, formatDelta: fmtRatioDelta,
    },
    ...CAP_BUCKETS.map<MetricRow>(bucket => ({
      id: `cap-${bucket}`, label: bucket,
      invertColor: bucket === 'Large Cap',
      index: capAllocation.index[bucket],
      getPortfolio: (name) => capAllocation.portfolios[name][bucket],
      format: fmtPct, formatDelta: fmtPctDelta,
    })),
  ];

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

  // Region/portfolio matrix the BenchmarkBarChart consumes. Always includes both portfolios
  // (the chart picks which to draw based on displayedPortfolios) so the data reference is
  // stable across selection changes.
  const benchmarkRegions = useMemo(() => {
    return benchmarkComparison.map((row, metricIdx) => ({
      region: row.metric,
      acwi: row.acwi,
      portfolios: PORTFOLIO_OPTIONS.reduce((acc, name) => {
        const p = benchmarkComparisonByPortfolio[name][metricIdx];
        acc[name] = { client: p.client, delta: p.delta };
        return acc;
      }, {} as Record<string, { client: number; delta: number }>),
    }));
  }, [benchmarkComparison, benchmarkComparisonByPortfolio]);

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

            {/* Charts Row 1: Style XY + Profitability XY + Metrics vs Index */}
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
                    <div className="flex items-center justify-center mr-1" style={{ width: '20px' }}>
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
                    <div className="flex items-center justify-center mr-1" style={{ width: '20px' }}>
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

              {/* Metrics vs Index */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl min-h-[340px] flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4 -mt-2 -ml-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">Metrics vs Index</h4>
                      <p className="text-xs text-muted">vs MSCI ACWI IMI ({period})</p>
                    </div>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="data-pop border-b border-zinc-700/60">
                        <th className="text-left font-normal py-1.5 pr-2 text-muted">Metric</th>
                        {visiblePortfolios.map(({ name, idx, exiting }) => {
                          const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                          return (
                            <th key={name} className="text-right font-medium py-1.5 px-0">
                              <span className={exiting ? 'col-collapse' : 'col-expand'} style={{ color: color.hex }}>
                                {name}
                              </span>
                            </th>
                          );
                        })}
                        <th className="text-right font-medium py-1.5 pl-2" style={{ color: '#a1a1aa' }}>
                          Index
                        </th>
                        {deltaState !== 'hidden' && visiblePortfolios.filter(p => !p.exiting).map(({ name, idx }) => {
                          const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                          return (
                            <th key={`${name}-delta`} className="text-right font-medium py-1.5 px-0">
                              <span className={deltaState === 'exiting' ? 'col-collapse' : 'col-expand'} style={{ color: color.hex }}>
                                Δ
                              </span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {metricsTableRows.map((row, rowIdx) => (
                        <tr
                          key={row.id}
                          className="data-pop border-b border-zinc-800/40 last:border-b-0"
                          style={{ animationDelay: `${80 + rowIdx * 120}ms` }}
                        >
                          <td className="py-1.5 pr-2 text-white font-medium">
                            {row.label}
                          </td>
                          {visiblePortfolios.map(({ name, exiting }) => (
                            <td
                              key={name}
                              className="text-right font-mono tabular-nums py-1.5 px-0 text-white font-medium"
                            >
                              <span className={exiting ? 'col-collapse' : 'col-expand'}>
                                {row.format(row.getPortfolio(name))}
                              </span>
                            </td>
                          ))}
                          <td className="text-right font-mono tabular-nums py-1.5 pl-2 text-white font-medium">
                            {row.format(row.index)}
                          </td>
                          {deltaState !== 'hidden' && visiblePortfolios.filter(p => !p.exiting).map(({ name, idx }) => {
                            const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                            const delta = row.getPortfolio(name) - row.index;
                            const positive = delta > 0;
                            const zero = delta === 0;
                            // Triangle stays portfolio-colored; the number itself goes green/red.
                            // For inverted rows (e.g. P/B, Large Cap), being below the index is
                            // the favorable direction so green/red are flipped.
                            const favorable = row.invertColor ? !positive : positive;
                            const valueColor = zero ? '#a1a1aa' : favorable ? '#4ade80' : '#f87171';
                            return (
                              <td
                                key={`${name}-delta`}
                                className="text-right font-mono tabular-nums py-1.5 px-0"
                              >
                                <span className={deltaState === 'exiting' ? 'col-collapse' : 'col-expand'}>
                                  <span className="inline-flex items-center justify-end gap-1">
                                    <span style={{ fontSize: '8px', lineHeight: 1, color: zero ? '#a1a1aa' : color.hex }}>
                                      {zero ? '—' : positive ? '▲' : '▼'}
                                    </span>
                                    <span style={{ color: valueColor }}>
                                      {zero ? '0' : row.formatDelta(delta)}
                                    </span>
                                  </span>
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Charts Row 2: vs MSCI ACWI IMI + Style x Profitability */}
            <div className="grid grid-cols-3 gap-4 mb-4 row-stagger-2">
              {/* Benchmark Comparison */}
              <div className="col-span-1 relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl min-h-[380px] flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4 -mt-2 -ml-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">vs MSCI ACWI IMI</h4>
                      <p className="text-xs text-muted">Regional delta to benchmark ({period})</p>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 min-h-[200px]">
                      <BenchmarkBarChart
                        data={benchmarkRegions}
                        displayedPortfolios={displayedPortfolios}
                        palette={PORTFOLIO_PALETTE}
                        staggerDelayMs={ROW_2_STAGGER_MS}
                      />
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
              </div>

              {/* Style x Profitability — concentric radial + allocation table */}
              <div className="col-span-2 relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl min-h-[380px] flex flex-col">
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
                              animationBegin={ROW_2_STAGGER_MS}
                              animationDuration={1320}
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
                                  animationBegin={ROW_2_STAGGER_MS}
                                  animationDuration={1320}
                                  style={{
                                    filter: `drop-shadow(0 0 6px ${color.glow})`,
                                    opacity: exiting ? 0 : 1,
                                    transition: `opacity ${PORTFOLIO_EXIT_MS}ms ease-out ${ROW_2_STAGGER_MS}ms`,
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
                          <tr className="data-pop border-b border-zinc-700/60">
                            <th className="text-left font-normal py-1.5 pr-2 text-muted">Category</th>
                            {visiblePortfolios.map(({ name, idx, exiting }) => {
                              const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                              return (
                                <th key={name} className="text-right font-medium py-1.5 px-0">
                                  <span className={exiting ? 'col-collapse' : 'col-expand'} style={{ color: color.hex }}>
                                    {name}
                                  </span>
                                </th>
                              );
                            })}
                            <th className="text-right font-medium py-1.5 pl-2" style={{ color: '#a1a1aa' }}>
                              Index
                            </th>
                            {deltaState !== 'hidden' && visiblePortfolios.filter(p => !p.exiting).map(({ name, idx }) => {
                              const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                              return (
                                <th key={`${name}-delta`} className="text-right font-medium py-1.5 px-0">
                                  <span className={deltaState === 'exiting' ? 'col-collapse' : 'col-expand'} style={{ color: color.hex }}>
                                    Δ
                                  </span>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {([
                            { total: 'Growth' as const, subs: ['Growth High-Prof', 'Growth Low-Prof'] as const, invert: true },
                            { total: 'Value' as const,  subs: ['Value High-Prof',  'Value Low-Prof']  as const, invert: false },
                          ]).map((group, groupIdxN) => {
                            const groupIdx = styleProfitability.index[group.subs[0]] + styleProfitability.index[group.subs[1]];
                            // Flat row index across both groups for the staggered entrance:
                            // group 0 → rows 0,1,2; group 1 → rows 3,4,5. Same 80ms + 120ms·n
                            // formula as the Metrics vs Index card so the cascade feels uniform.
                            const totalRowIdx = groupIdxN * 3;
                            return (
                            <React.Fragment key={group.total}>
                              <tr
                                className="data-pop border-b border-zinc-800/40"
                                style={{ animationDelay: `${ROW_2_STAGGER_MS + 80 + totalRowIdx * 120}ms` }}
                              >
                                <td className="py-1.5 pr-2 text-white font-medium">{group.total}</td>
                                {visiblePortfolios.map(({ name, exiting }) => {
                                  const a = styleProfitability.portfolios[name];
                                  return (
                                    <td key={name} className="text-right font-mono tabular-nums py-1.5 px-0 text-white font-medium">
                                      <span className={exiting ? 'col-collapse' : 'col-expand'}>
                                        {a[group.subs[0]] + a[group.subs[1]]}%
                                      </span>
                                    </td>
                                  );
                                })}
                                <td className="text-right font-mono tabular-nums py-1.5 pl-2 text-white font-medium">
                                  {groupIdx}%
                                </td>
                                {deltaState !== 'hidden' && visiblePortfolios.filter(p => !p.exiting).map(({ name, idx }) => {
                                  const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                                  const a = styleProfitability.portfolios[name];
                                  const delta = (a[group.subs[0]] + a[group.subs[1]]) - groupIdx;
                                  const positive = delta > 0;
                                  const zero = delta === 0;
                                  const favorable = group.invert ? !positive : positive;
                                  const valueColor = zero ? '#a1a1aa' : favorable ? '#4ade80' : '#f87171';
                                  return (
                                    <td key={`${name}-delta`} className="text-right font-mono tabular-nums py-1.5 px-0">
                                      <span className={deltaState === 'exiting' ? 'col-collapse' : 'col-expand'}>
                                        <span className="inline-flex items-center justify-end gap-1">
                                          <span style={{ fontSize: '8px', lineHeight: 1, color: zero ? '#a1a1aa' : color.hex }}>
                                            {zero ? '—' : positive ? '▲' : '▼'}
                                          </span>
                                          <span style={{ color: valueColor }}>
                                            {zero ? '0' : fmtPctDelta(delta)}
                                          </span>
                                        </span>
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                              {group.subs.map((cat, subIdx) => {
                                // Growth Low-Prof is the only sub-row that gets inverted coloring (matches the metrics-vs-index card).
                                const subInvert = cat === 'Growth Low-Prof';
                                const subRowIdx = totalRowIdx + 1 + subIdx;
                                return (
                                <tr
                                  key={cat}
                                  className="data-pop border-b border-zinc-800/40 last:border-b-0"
                                  style={{ animationDelay: `${ROW_2_STAGGER_MS + 80 + subRowIdx * 120}ms` }}
                                >
                                  <td className="py-1.5 pl-4 pr-2 text-muted">{cat}</td>
                                  {visiblePortfolios.map(({ name, exiting }) => (
                                    <td key={name} className="text-right font-mono tabular-nums py-1.5 px-0 text-muted">
                                      <span className={exiting ? 'col-collapse' : 'col-expand'}>
                                        {styleProfitability.portfolios[name][cat]}%
                                      </span>
                                    </td>
                                  ))}
                                  <td className="text-right font-mono tabular-nums py-1.5 pl-2 text-muted">
                                    {styleProfitability.index[cat]}%
                                  </td>
                                  {deltaState !== 'hidden' && visiblePortfolios.filter(p => !p.exiting).map(({ name, idx }) => {
                                    const color = PORTFOLIO_PALETTE[idx] ?? PORTFOLIO_PALETTE[0];
                                    const delta = styleProfitability.portfolios[name][cat] - styleProfitability.index[cat];
                                    const positive = delta > 0;
                                    const zero = delta === 0;
                                    const favorable = subInvert ? !positive : positive;
                                    const valueColor = zero ? '#a1a1aa' : favorable ? '#4ade80' : '#f87171';
                                    return (
                                      <td key={`${name}-delta`} className="text-right font-mono tabular-nums py-1.5 px-0">
                                        <span className={deltaState === 'exiting' ? 'col-collapse' : 'col-expand'}>
                                          <span className="inline-flex items-center justify-end gap-1">
                                            <span style={{ fontSize: '8px', lineHeight: 1, color: zero ? '#a1a1aa' : color.hex }}>
                                              {zero ? '—' : positive ? '▲' : '▼'}
                                            </span>
                                            <span style={{ color: valueColor }}>
                                              {zero ? '0' : fmtPctDelta(delta)}
                                            </span>
                                          </span>
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                                );
                              })}
                            </React.Fragment>
                            );
                          })}
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

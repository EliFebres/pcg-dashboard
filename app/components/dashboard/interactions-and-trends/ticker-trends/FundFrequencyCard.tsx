'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { BarShapeProps } from 'recharts';
import { ChevronDown, Check, Activity, Loader2 } from 'lucide-react';
import type { HotTicker } from '@/app/lib/types/trends';
import ClientOnlyChart from '@/app/components/dashboard/shared/ClientOnlyChart';

interface FundDetailCardProps {
  tickers: HotTicker[];
  isLoading: boolean;
}

function FundDetailCard({ tickers, isLoading }: FundDetailCardProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Default to first ticker when tickers change. Adjust state during render
  // rather than in an effect — React discards the in-progress render and
  // restarts with the new state, so there's no extra commit.
  if (
    tickers.length > 0 &&
    (!selectedTicker || !tickers.find((t) => t.ticker === selectedTicker))
  ) {
    setSelectedTicker(tickers[0].ticker);
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedFund = useMemo(
    () => tickers.find((t) => t.ticker === selectedTicker) ?? null,
    [tickers, selectedTicker]
  );

  const { currentQ, prevQ, qoqChange, deviation } = useMemo(() => {
    if (!selectedFund?.quarterlyRequests || selectedFund.quarterlyRequests.length < 2) {
      return { currentQ: 0, prevQ: 0, qoqChange: 0, avgQoqChange: 0, deviation: 0 };
    }

    const qData = selectedFund.quarterlyRequests;
    const curr = qData[qData.length - 1].requests;
    const prev = qData[qData.length - 2].requests;
    const change = prev !== 0 ? ((curr - prev) / prev) * 100 : 0;

    // Compute average QoQ across all tickers with quarterly data
    const allChanges: number[] = [];
    for (const t of tickers) {
      if (t.quarterlyRequests && t.quarterlyRequests.length >= 2) {
        const tCurr = t.quarterlyRequests[t.quarterlyRequests.length - 1].requests;
        const tPrev = t.quarterlyRequests[t.quarterlyRequests.length - 2].requests;
        if (tPrev !== 0) {
          allChanges.push(((tCurr - tPrev) / tPrev) * 100);
        }
      }
    }
    const avg = allChanges.length > 0 ? allChanges.reduce((a, b) => a + b, 0) / allChanges.length : 0;

    return {
      currentQ: curr,
      prevQ: prev,
      qoqChange: Math.round(change),
      avgQoqChange: Math.round(avg),
      deviation: Math.round(change - avg),
    };
  }, [selectedFund, tickers]);

  const prevQuarterLabel = useMemo(() => {
    if (!selectedFund?.quarterlyRequests || selectedFund.quarterlyRequests.length < 2) return '';
    return selectedFund.quarterlyRequests[selectedFund.quarterlyRequests.length - 2].quarter;
  }, [selectedFund]);

  const narrative = useMemo(() => {
    if (!selectedFund) return '';
    const label = `${selectedFund.name} (${selectedFund.ticker})`;
    const absDev = Math.abs(deviation);
    const devDirection = deviation > 0 ? 'higher than' : 'lower than';
    const devClause = deviation !== 0
      ? `, which is ${absDev}% ${devDirection} the average change across all top 10 funds`
      : ', which is in line with the average across all top 10 funds';
    if (qoqChange > 0) {
      return `${label} has grown in requests by ${qoqChange}% quarter-over-quarter, up from ${prevQ} requests in ${prevQuarterLabel}${devClause}.`;
    } else if (qoqChange < 0) {
      return `${label} has decreased in requests by ${Math.abs(qoqChange)}% quarter-over-quarter, down from ${prevQ} requests in ${prevQuarterLabel}${devClause}.`;
    }
    return `${label} has held steady in requests quarter-over-quarter, unchanged from ${prevQ} requests in ${prevQuarterLabel}${devClause}.`;
  }, [selectedFund, qoqChange, prevQ, prevQuarterLabel, deviation]);

  const globalMax = useMemo(() => {
    let max = 0;
    for (const t of tickers) {
      if (t.quarterlyRequests) {
        for (const q of t.quarterlyRequests) {
          if (q.requests > max) max = q.requests;
        }
      }
    }
    // Round up to nearest multiple of 10 for clean tick spacing
    return Math.ceil(max / 10) * 10;
  }, [tickers]);

  const { peakQ, lowestQ } = useMemo(() => {
    if (!selectedFund?.quarterlyRequests || selectedFund.quarterlyRequests.length === 0) {
      return { peakQ: 0, lowestQ: 0 };
    }
    const vals = selectedFund.quarterlyRequests.map((q) => q.requests);
    return { peakQ: Math.max(...vals), lowestQ: Math.min(...vals) };
  }, [selectedFund]);

  const chartData = useMemo(() => {
    if (!selectedFund?.quarterlyRequests) return [];
    return selectedFund.quarterlyRequests.map((q) => {
      // "Q4 2024" → "Q4 24"
      const parts = q.quarter.split(' ');
      const shortYear = parts[1]?.slice(-2) ?? '';
      return { label: `${parts[0]} ${shortYear}`, requests: q.requests };
    });
  }, [selectedFund]);

  if (isLoading) {
    return (
      <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-muted" />
            <h4 className="text-sm font-medium text-muted">Request Frequency</h4>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-center" style={{ height: 310 }}>
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="ml-2 text-sm text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  if (tickers.length === 0) {
    return (
      <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-muted" />
            <h4 className="text-sm font-medium text-muted">Request Frequency</h4>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-center" style={{ height: 310 }}>
          <span className="text-sm text-muted">No tickers available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Top Section — two-column layout */}
        <div className="bg-gradient-to-b from-zinc-950 to-zinc-800/40 px-6 pt-5 pb-3 flex flex-row-reverse shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)]">
          {/* Right column — dropdown (20%) */}
          <div className="w-1/5 flex items-start justify-end pt-1" ref={dropdownRef}>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative overflow-hidden flex items-center gap-2 px-4 py-1.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white transition-colors"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {selectedTicker}
                  <ChevronDown className={`w-4 h-4 text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </span>
                {!dropdownOpen && (
                  <span
                    className="absolute inset-0 pointer-events-none animate-[shine_3s_ease-in-out_infinite]"
                    style={{
                      background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)',
                    }}
                  />
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-1 bg-zinc-800 border border-zinc-700 shadow-xl z-50 min-w-[120px] overflow-hidden max-h-60 overflow-y-auto">
                  {tickers.map((t) => (
                    <button
                      key={t.ticker}
                      onClick={() => {
                        setSelectedTicker(t.ticker);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${t.ticker === selectedTicker
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-muted hover:bg-zinc-700/50'
                        }`}
                    >
                      <span>{t.ticker}</span>
                      {t.ticker === selectedTicker && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — content (80%) */}
          <div className="w-4/5 flex flex-col">
            {/* Top — title */}
            <div className="flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-muted" />
              <h4 className="text-base font-medium text-muted">Request Frequency</h4>
            </div>

            {/* Middle — hero metric */}
            <div className="flex items-end gap-3 flex-wrap my-2" style={{ transform: 'scale(0.95)', transformOrigin: 'left bottom' }}>
              <div className="relative">
                <span className="text-8xl font-bold text-white">
                  {qoqChange > 0 ? '+' : ''}{qoqChange}%
                </span>
                {/* Badge — superscript */}
                <span className={`absolute top-2 -right-2 translate-x-full whitespace-nowrap inline-flex items-center text-base px-2 py-0.5 font-medium ${deviation > 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : deviation < 0
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-zinc-500/20 text-muted'
                  }`}>
                  {deviation > 0 ? '+' : ''}{deviation}% vs avg
                </span>
              </div>
              <span className="text-xl text-muted mb-2">QoQ</span>
            </div>

            {/* Bottom — narrative */}
            <p className="text-sm leading-relaxed mt-1.5" style={{ color: '#8b8b98' }}>{narrative}</p>
          </div>
        </div>

        {/* Bottom Half — stats row + bar chart */}
        <div className="flex-1 flex flex-col px-6">
          {/* Stats Row */}
          <div className="py-2 flex items-center">
            <div className="w-3/4 grid grid-cols-3">
              <div>
                <span className="text-sm text-muted">Current Req</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-white">{currentQ}</span>
                  <span className="text-sm text-muted">requests</span>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted">Peak</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-white">{peakQ}</span>
                  <span className="text-sm text-muted">requests</span>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted">Lowest</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-white">{lowestQ}</span>
                  <span className="text-sm text-muted">requests</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart — fills remaining space */}
          <div className="flex-1 relative mt-2">
            <div className="absolute inset-0">
              <ClientOnlyChart>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 0, right: 4, bottom: 0, left: 4 }}
                  >
                    <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <YAxis domain={[0, globalMax]} tickCount={5} hide />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: '#a1a1aa' }}
                      itemStyle={{ color: '#22d3ee' }}
                      formatter={(value: number | undefined) => [`${value ?? 0} requests`, 'Requests']}
                    />
                    <Bar
                      dataKey="requests"
                      animationDuration={700}
                      shape={(props: BarShapeProps) => {
                        const { x, y, width, height, fill } = props as BarShapeProps & { fill: string };
                        const filterId = `glow-${x}-${y}`;
                        return (
                          <g>
                            <defs>
                              <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
                                <feMerge>
                                  <feMergeNode in="blur" />
                                  <feMergeNode in="SourceGraphic" />
                                </feMerge>
                              </filter>
                            </defs>
                            <rect x={x} y={y} width={width} height={height} fill={fill} filter={`url(#${filterId})`} />
                            <rect x={x} y={y} width={width} height={1.5} fill="#ffffff" />
                          </g>
                        );
                      }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={entry.label}
                          fill={index === chartData.length - 1 ? '#06b6d4' : '#22d3ee50'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(FundDetailCard);

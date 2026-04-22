'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { HotTicker } from '@/app/lib/types/trends';
import ClientOnlyChart from '@/app/components/dashboard/shared/ClientOnlyChart';

interface RequestBreakdownChartProps {
  tickers: HotTicker[];
}

const CATEGORIES = [
  { key: 'pcrRequests', label: 'PCR Requests', color: '#a5f3fc' },
  { key: 'pcrDownloads', label: 'PCR Downloads', color: '#22d3ee' },
  { key: 'tickersMentioned', label: 'Tickers Mentioned', color: '#0e7490' },
  { key: 'clientModels', label: 'Client Models', color: '#4f46e5' },
] as const;

interface ChartDataPoint {
  ticker: string;
  pcrRequests: number;
  pcrDownloads: number;
  tickersMentioned: number;
  clientModels: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted">{entry.name}</span>
          </div>
          <span className="text-zinc-200 font-medium">{entry.value}</span>
        </div>
      ))}
      <div className="border-t border-zinc-700 mt-1.5 pt-1.5 flex items-center justify-between text-xs">
        <span className="text-muted">Total</span>
        <span className="text-white font-semibold">{total}</span>
      </div>
    </div>
  );
}

function RequestBreakdownChart({ tickers }: RequestBreakdownChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(
    () =>
      tickers
        .filter((t) => t.requestBreakdown)
        .map((t) => ({
          ticker: t.ticker,
          pcrRequests: t.requestBreakdown!.pcrRequests,
          pcrDownloads: t.requestBreakdown!.pcrDownloads,
          tickersMentioned: t.requestBreakdown!.tickersMentioned,
          clientModels: t.requestBreakdown!.clientModels,
        })),
    [tickers]
  );

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm text-muted">No breakdown data available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ClientOnlyChart>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 12, bottom: 4, left: -4 }}
              barCategoryGap="20%"
            >
              <XAxis
                dataKey="ticker"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={<CustomTooltip />}
              />
              {CATEGORIES.map((cat, i) => (
                <Bar
                  key={cat.key}
                  dataKey={cat.key}
                  name={cat.label}
                  stackId="a"
                  fill={cat.color}
                  radius={i === CATEGORIES.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={700}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ClientOnlyChart>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-3 flex-wrap">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-xs text-muted">{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(RequestBreakdownChart);

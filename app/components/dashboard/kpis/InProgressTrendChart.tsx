'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import ClientOnlyChart from '@/app/components/dashboard/shared/ClientOnlyChart';
import type { InProgressTrendPoint } from '@/app/lib/api/kpi';
import { KPI_COLORS } from './utils';

export default function InProgressTrendChart({ data }: { data: InProgressTrendPoint[] }) {
  const chartData = data.map(d => {
    const date = new Date(d.weekStart + 'T00:00:00');
    return {
      weekStart: d.weekStart,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: d.count,
    };
  });

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-white text-base font-semibold">In-Progress Cadence</h3>
        <p className="text-xs text-muted">New open work by week in the selected period</p>
      </div>
      <div className="flex-1 min-h-[180px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted">No data.</div>
        ) : (
          <ClientOnlyChart>
            <ResponsiveContainer width="100%" height="100%" minHeight={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="inProgressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={KPI_COLORS.cyan} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={KPI_COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" strokeDasharray="2 3" />
                <XAxis dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: 'rgba(24, 24, 27, 0.95)', border: '1px solid #3f3f46', borderRadius: 6, fontSize: 12 }}
                  formatter={(v) => [Number(v ?? 0), 'Open'] as [number, string]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={KPI_COLORS.cyan}
                  strokeWidth={2}
                  fill="url(#inProgressGradient)"
                  isAnimationActive
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ClientOnlyChart>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import type { CompetitorTimeSeries } from '@/app/lib/types/competitive';

interface CompetitorDeltaChartProps {
  timeSeries: CompetitorTimeSeries[];
  isLoading: boolean;
}

interface TooltipPayloadEntry {
  value: number;
  dataKey: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const delta = data.value;
  return (
    <div className="bg-zinc-900 border border-zinc-700/50 px-3 py-2 shadow-lg">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p className={`text-sm font-medium ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
        Firm {delta > 0 ? '+' : ''}{delta} {Math.abs(delta) === 1 ? 'fund' : 'funds'} {delta >= 0 ? 'ahead' : 'behind'}
      </p>
    </div>
  );
};

export default function CompetitorDeltaChart({ timeSeries, isLoading }: CompetitorDeltaChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-300">Firm vs. Competitor Win Delta</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Net funds where the firm outperforms over time</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
              <span className="text-[10px] text-zinc-500">Firm ahead</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500/60" />
              <span className="text-[10px] text-zinc-500">Competitor ahead</span>
            </div>
          </div>
        </div>

        {isLoading || !mounted ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="deltaPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="deltaNegative" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#71717a' }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={false}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#52525b" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="delta"
                  stroke="#10b981"
                  fill="url(#deltaPositive)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981', stroke: '#0a0a0a', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

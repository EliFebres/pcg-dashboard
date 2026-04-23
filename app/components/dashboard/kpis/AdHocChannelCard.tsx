'use client';

import React from 'react';
import type { AdHocChannelRow } from '@/app/lib/api/kpi';
import { KPI_COLORS, formatCurrency, formatNumber } from './utils';

const CHANNEL_COLOR: Record<string, string> = {
  'In-Person': KPI_COLORS.cyanLight,
  'Email': KPI_COLORS.cyan,
  'Teams': KPI_COLORS.cyanDark,
  'Unknown': KPI_COLORS.zinc,
};

export default function AdHocChannelCard({ data }: { data: AdHocChannelRow[] }) {
  const total = data.reduce((s, r) => s + r.count, 0);

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-white text-base font-semibold">Ad-Hoc Channel Health</h3>
        <p className="text-xs text-muted">Which casual touchpoints produce tracked work</p>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted">No ad-hoc data.</div>
      ) : (
        <div className="space-y-3">
          {data.map((r) => {
            const color = CHANNEL_COLOR[r.channel] ?? KPI_COLORS.zinc;
            const sharePct = total > 0 ? Math.round((r.count / total) * 100) : 0;
            return (
              <div key={r.channel}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-zinc-200">{r.channel}</span>
                    <span className="text-muted font-mono">{formatNumber(r.count)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted">
                      <span className="text-emerald-400 font-mono">{r.linkedChildPercent.toFixed(0)}%</span> linked
                    </span>
                    <span className="text-cyan-400 font-mono">{formatCurrency(r.totalNna)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${sharePct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

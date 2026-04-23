'use client';

import React from 'react';
import type { TickerMention } from '@/app/lib/api/kpi';
import { KPI_COLORS } from './utils';

export default function TopTickersChart({ data }: { data: TickerMention[] }) {
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-white text-base font-semibold">Top Tickers Mentioned</h3>
        <p className="text-xs text-muted">What the book is actually asking about</p>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted">No ticker mentions yet.</div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto max-h-[280px] pr-1">
          {data.map((r) => {
            const widthPct = Math.round((r.count / max) * 100);
            return (
              <div key={r.ticker} className="flex items-center gap-2">
                <div className="w-16 flex-shrink-0">
                  <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                    {r.ticker}
                  </span>
                </div>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${widthPct}%`, backgroundColor: KPI_COLORS.cyan }} />
                </div>
                <span className="text-xs text-muted font-mono w-8 text-right">{r.count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

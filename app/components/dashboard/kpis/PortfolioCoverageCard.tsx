'use client';

import React from 'react';
import { Briefcase } from 'lucide-react';
import type { PortfolioCoverage } from '@/app/lib/api/kpi';

export default function PortfolioCoverageCard({ data }: { data: PortfolioCoverage }) {
  const pct = Math.round(data.coveragePercent);

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl h-full flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-cyan-400" />
        <div>
          <h3 className="text-white text-base font-semibold">Portfolio Discipline</h3>
          <p className="text-xs text-muted">Are we logging what we&apos;re analyzing?</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-muted">Coverage</span>
            <span className="text-3xl font-bold text-white">{pct}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted mt-1">
            {data.loggedCount.toLocaleString()} of {data.eligibleCount.toLocaleString()} eligible engagements logged
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/50">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Avg holdings</p>
            <p className="text-xl font-bold text-zinc-200 font-mono">{data.avgHoldings.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Logged</p>
            <p className="text-xl font-bold text-cyan-400 font-mono">{data.loggedCount.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

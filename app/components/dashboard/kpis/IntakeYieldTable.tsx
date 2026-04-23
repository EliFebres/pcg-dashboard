'use client';

import React from 'react';
import type { IntakeYieldRow } from '@/app/lib/api/kpi';
import { formatCurrency, formatNumber, INTAKE_COLOR, KPI_COLORS } from './utils';

export default function IntakeYieldTable({ data }: { data: IntakeYieldRow[] }) {
  const maxCount = Math.max(...data.map(r => r.count), 1);

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-white text-base font-semibold">Intake Type Yield</h3>
        <p className="text-xs text-muted">Which intake paths actually pay off</p>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted">No data.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted border-b border-zinc-800">
              <th className="py-2 pr-3">Intake</th>
              <th className="py-2 pr-3 text-right">Count</th>
              <th className="py-2 pr-3 text-right">Completion</th>
              <th className="py-2 pr-3 text-right">Avg NNA</th>
              <th className="py-2 text-right">Zero-NNA</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => {
              const color = INTAKE_COLOR[r.intakeType] ?? KPI_COLORS.zinc;
              const widthPct = Math.round((r.count / maxCount) * 100);
              return (
                <tr key={r.intakeType} className="border-b border-zinc-800/50">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                      <span className="text-zinc-200">{r.intakeType}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden sm:block w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${widthPct}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-zinc-200 font-mono">{formatNumber(r.count)}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right text-emerald-400 font-mono">{r.completionRate.toFixed(0)}%</td>
                  <td className="py-2 pr-3 text-right text-cyan-400 font-mono">{formatCurrency(r.avgNna)}</td>
                  <td className="py-2 text-right text-orange-400 font-mono">{r.zeroNnaRate.toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

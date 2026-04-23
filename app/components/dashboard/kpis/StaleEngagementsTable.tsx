'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import type { StaleEngagement } from '@/app/lib/api/kpi';

function daysBadgeClass(days: number): string {
  if (days >= 180) return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
  if (days >= 90) return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
  return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
}

export default function StaleEngagementsTable({ data }: { data: StaleEngagement[] }) {
  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl h-full flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-400" />
        <div>
          <h3 className="text-white text-base font-semibold">Stale Open Work</h3>
          <p className="text-xs text-muted">Oldest open engagements — worth a check-in</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted">Nothing stale — nice.</div>
      ) : (
        <div className="overflow-y-auto max-h-[280px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur">
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted border-b border-zinc-800">
                <th className="py-2 pr-2">Client · Dept</th>
                <th className="py-2 pr-2">Type</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 text-right">Days Open</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 pr-2">
                    <div className="text-zinc-200 truncate max-w-[200px]">{r.clientName}</div>
                    <div className="text-[10px] text-muted">{r.gcgDept}</div>
                  </td>
                  <td className="py-2 pr-2 text-muted text-xs">{r.type}</td>
                  <td className="py-2 pr-2 text-xs text-zinc-200">{r.status}</td>
                  <td className="py-2 text-right">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${daysBadgeClass(r.daysOpen)}`}>
                      {r.daysOpen}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

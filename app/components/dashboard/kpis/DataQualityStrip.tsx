'use client';

import React from 'react';
import type { DataQuality } from '@/app/lib/api/kpi';

type Stat = {
  label: string;
  value: string;
  hint: string;
};

// --- Tunable layout knob ---
// TITLE_WIDTH controls how much of the card width the "Data Quality" label
// gets. The remaining width is split evenly between the metric columns.
const TITLE_WIDTH = '12%';

export default function DataQualityStrip({ data }: { data: DataQuality }) {
  const stats: Stat[] = [
    { label: 'Interactions', value: data.interactions.toLocaleString(), hint: 'total # of interactions' },
    { label: 'NNA recorded', value: `${data.nnaCoveragePercent.toFixed(0)}%`, hint: 'of all interactions' },
    { label: 'Portfolios Logged', value: `${data.portfoliosRecordedPercent.toFixed(0)}%`, hint: 'of all meetings' },
    { label: 'Notes recorded', value: `${data.notesCoveragePercent.toFixed(0)}%`, hint: 'of all interactions' },
  ];

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 px-5 py-3 rounded-xl">
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: `${TITLE_WIDTH} repeat(${stats.length}, 1fr)`,
        }}
      >
        <span className="text-[10px] uppercase tracking-wider text-muted font-medium">
          Data Quality
        </span>
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline justify-start gap-2 min-w-0">
            <span className="text-sm font-mono font-semibold text-zinc-200">{s.value}</span>
            <span className="text-[11px] text-muted truncate">{s.label}</span>
            <span className="text-[10px] text-zinc-600 truncate">· {s.hint}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

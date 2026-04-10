'use client';

interface DashboardPreviewProps {
  className?: string;
}

export default function DashboardPreview({ className }: DashboardPreviewProps) {
  return (
    <section className={`relative px-6 pb-28 ${className ?? ''}`}>
      <div className="max-w-[1100px] mx-auto">
        <div className="relative rounded-xl border border-white/[0.08] overflow-hidden bg-[#0a0a0f] shadow-[0_0_120px_-30px_rgba(6,182,212,0.2)]">
          {/* Gradient top border shine */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

          <div className="flex min-h-[420px] md:min-h-[540px]">
            {/* ── Sidebar ──────────────────────────────────────── */}
            <div className="hidden md:flex flex-col w-[200px] bg-[#111113] border-r border-zinc-800/50 flex-shrink-0">
              {/* Logo */}
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-zinc-800/50">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400" />
                <div className="h-3 w-16 rounded bg-white/[0.12]" />
              </div>
              {/* Nav */}
              <div className="p-2 space-y-0.5">
                <div className="h-1.5 w-24 rounded bg-white/[0.04] mx-2 mt-2 mb-2" />
                {/* Active item */}
                <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-gradient-to-r from-blue-600/20 to-cyan-600/10 border-l-2 border-cyan-400">
                  <div className="w-3.5 h-3.5 rounded bg-cyan-400/20 flex-shrink-0" />
                  <div className="h-2 w-24 rounded bg-cyan-400/30" />
                </div>
                {/* Inactive items */}
                {[80, 56].map((w, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-md">
                    <div className="w-3.5 h-3.5 rounded bg-white/[0.06] flex-shrink-0" />
                    <div className="h-2 rounded bg-white/[0.05]" style={{ width: w }} />
                  </div>
                ))}
              </div>
              {/* Spacer + user */}
              <div className="mt-auto border-t border-zinc-800/50 p-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400" />
                <div className="h-2 w-12 rounded bg-white/[0.06]" />
              </div>
            </div>

            {/* ── Main content ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#050508]">
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b border-zinc-800/50">
                <div className="mb-3">
                  <div className="h-3.5 w-32 rounded bg-white/[0.12] mb-1.5" />
                  <div className="h-2 w-56 rounded bg-white/[0.04]" />
                </div>
                {/* Filter bar */}
                <div className="flex items-center gap-2">
                  <div className="h-6 w-[160px] rounded-md bg-zinc-900/60 border border-zinc-700/50" />
                  {[70, 55, 50].map((w, i) => (
                    <div key={i} className="hidden sm:block h-6 rounded-md bg-zinc-900/60 border border-zinc-700/50" style={{ width: w }} />
                  ))}
                  <div className="hidden sm:block h-6 w-10 rounded-md bg-gradient-to-r from-blue-600/40 to-cyan-500/40" />
                  <div className="ml-auto hidden sm:block h-6 w-20 rounded-md bg-gradient-to-r from-blue-600/60 to-cyan-500/60" />
                </div>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-4 gap-2.5 px-5 pt-4 pb-3">
                {[
                  { color: 'from-blue-500/20 to-blue-500/5' },
                  { color: 'from-cyan-500/20 to-cyan-500/5' },
                  { color: 'from-sky-500/20 to-sky-500/5' },
                  { color: 'from-emerald-500/20 to-emerald-500/5' },
                ].map((m, i) => (
                  <div key={i} className="rounded-lg bg-zinc-900/60 border border-zinc-800/50 p-3 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="h-2 w-14 rounded bg-white/[0.06] mb-2" />
                    <div className="flex items-baseline gap-2">
                      <div className="h-5 w-10 rounded bg-white/[0.12]" />
                      <div className="h-2 w-8 rounded bg-emerald-500/20" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts row: Contribution graph + Department chart */}
              <div className="grid grid-cols-3 gap-2.5 px-5 pb-3">
                {/* Contribution heatmap */}
                <div className="col-span-2 rounded-lg bg-zinc-900/60 border border-zinc-800/50 p-3 flex flex-col">
                  <div className="h-2 w-12 rounded bg-white/[0.06] mb-3" />
                  {/* Heatmap grid */}
                  <div className="flex-1 grid grid-rows-5 grid-flow-col gap-[2px]" style={{ gridTemplateRows: 'repeat(5, 1fr)' }}>
                    {Array.from({ length: 260 }).map((_, i) => {
                      const level = [0,0,0,1,0,1,2,0,1,0,0,1,3,2,1,0,1,2,4,3,2,1,0,0,1,2,3,1,0,2,1,0,3,4,2,1,0,1,0,2][i % 40];
                      const colors = ['bg-zinc-800', 'bg-cyan-900', 'bg-cyan-700', 'bg-cyan-500', 'bg-cyan-400'];
                      return <div key={i} className={`rounded-[1px] ${colors[level]}`} />;
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-end gap-1 mt-2">
                    {['bg-zinc-800', 'bg-cyan-900', 'bg-cyan-700', 'bg-cyan-500', 'bg-cyan-400'].map((c, i) => (
                      <div key={i} className={`w-[8px] h-[8px] rounded-[1px] ${c}`} />
                    ))}
                  </div>
                </div>

                {/* Department chart */}
                <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/50 p-3">
                  <div className="h-2 w-16 rounded bg-white/[0.06] mb-4" />
                  <div className="space-y-3">
                    {[
                      { pct: 52, color: 'bg-blue-500' },
                      { pct: 31, color: 'bg-cyan-500' },
                      { pct: 17, color: 'bg-sky-500' },
                    ].map((d, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="h-1.5 w-14 rounded bg-white/[0.06]" />
                          <div className="h-1.5 w-6 rounded bg-white/[0.04]" />
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Legend dots */}
                  <div className="mt-3 pt-2 border-t border-zinc-800/50 space-y-1.5">
                    {['bg-blue-500', 'bg-cyan-500', 'bg-sky-500'].map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className={`w-[6px] h-[6px] rounded-sm ${c}`} />
                        <div className="h-1.5 w-16 rounded bg-white/[0.04]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="px-5 pb-2 flex-1 min-h-0">
                <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/50 overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.8fr_0.6fr_0.7fr_0.6fr_0.5fr] gap-3 px-3 py-2 bg-zinc-800/60 border-b border-zinc-800/50">
                    {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className="h-1.5 rounded bg-white/[0.08]" />
                    ))}
                  </div>
                  {/* Table rows */}
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className={`grid grid-cols-[1.2fr_1fr_0.7fr_0.8fr_0.6fr_0.7fr_0.6fr_0.5fr] gap-3 items-center px-3 py-2.5 ${i > 0 ? 'border-t border-zinc-800/30' : ''}`}>
                      <div className="h-2 rounded bg-white/[0.06]" />
                      <div className="h-2 rounded bg-white/[0.04]" />
                      <div className="h-4 rounded-md bg-blue-500/15" />
                      <div className="h-4 rounded-md bg-cyan-500/15" />
                      <div className="h-2 rounded bg-white/[0.04]" />
                      <div className="h-4 rounded-md bg-emerald-500/10" />
                      <div className="h-2 rounded bg-white/[0.04]" />
                      <div className="h-2 rounded bg-emerald-500/20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#08070b] to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

'use client';

interface ScatterPoint {
  x: number;
  y: number;
  r: number;
  color: string;
  o: number;
}

type FeatureCardData = {
  title: string;
  description: string;
  visual:
    | { type: 'heatmap'; grid: number[][] }
    | { type: 'scatter'; points: ScatterPoint[]; xLabel: string; yLabel: string }
    | { type: 'bars'; widths: number[] };
};

interface BulletFeature {
  title: string;
  desc: string;
}

interface DayActivity {
  day: string;
  eng: number;
  port: number;
  rep: number;
}

interface LegendItem {
  gradient: string;
  label: string;
}

interface FeatureSectionsProps {
  dashboardHeading: React.ReactNode;
  dashboardDescription: string;
  cards: FeatureCardData[];
  realtimeHeading: React.ReactNode;
  realtimeDescription: string;
  features: BulletFeature[];
  chartTitle: string;
  days: DayActivity[];
  legend: LegendItem[];
  className?: string;
}

function HeatmapVisual({ grid }: { grid: number[][] }) {
  return (
    <div className="px-4">
      <div className="flex items-end gap-[3px]">
        {grid.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((v, ri) => (
              <div
                key={ri}
                className={`w-[14px] h-[14px] rounded-[3px] ${
                  v === 0 ? 'bg-white/[0.04]' :
                  v === 1 ? 'bg-cyan-900/60' :
                  v === 2 ? 'bg-cyan-600/70' :
                  'bg-cyan-400'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScatterVisual({ points, xLabel, yLabel }: { points: ScatterPoint[]; xLabel: string; yLabel: string }) {
  return (
    <svg viewBox="0 0 200 140" className="w-full h-full px-4 py-3">
      {/* Axes */}
      <line x1="30" y1="10" x2="30" y2="120" stroke="white" strokeOpacity="0.08" />
      <line x1="30" y1="120" x2="190" y2="120" stroke="white" strokeOpacity="0.08" />
      {/* Grid lines */}
      {[37, 65, 92].map(y => (
        <line key={y} x1="30" y1={y} x2="190" y2={y} stroke="white" strokeOpacity="0.03" />
      ))}
      {[70, 110, 150].map(x => (
        <line key={x} x1={x} y1="10" x2={x} y2="120" stroke="white" strokeOpacity="0.03" />
      ))}
      {/* Axis labels */}
      <text x="110" y="135" textAnchor="middle" fill="#6b6b76" fontSize="7" fontFamily="var(--font-geist-sans)">{xLabel}</text>
      <text x="12" y="65" textAnchor="middle" fill="#6b6b76" fontSize="7" fontFamily="var(--font-geist-sans)" transform="rotate(-90, 12, 65)">{yLabel}</text>
      {/* Scatter bubbles */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.color} fillOpacity={p.o} />
      ))}
    </svg>
  );
}

function BarsVisual({ widths }: { widths: number[] }) {
  return (
    <div className="w-full px-5 space-y-3">
      {widths.map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-[36px] h-[10px] rounded bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 h-[10px] rounded-full bg-white/[0.04] overflow-hidden">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${w}%`, opacity: 1 - i * 0.15 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureCardVisual({ visual }: { visual: FeatureCardData['visual'] }) {
  switch (visual.type) {
    case 'heatmap':
      return <HeatmapVisual grid={visual.grid} />;
    case 'scatter':
      return <ScatterVisual points={visual.points} xLabel={visual.xLabel} yLabel={visual.yLabel} />;
    case 'bars':
      return <BarsVisual widths={visual.widths} />;
  }
}

export default function FeatureSections({
  dashboardHeading,
  dashboardDescription,
  cards,
  realtimeHeading,
  realtimeDescription,
  features,
  chartTitle,
  days,
  legend,
  className,
}: FeatureSectionsProps) {
  return (
    <>
      {/* ── Feature deep-dive — Dashboards ──────────────────── */}
      <section className={`py-24 px-6 border-t border-white/[0.04] ${className ?? ''}`}>
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[640px] mb-16">
            <h2 className="text-[clamp(28px,5vw,48px)] font-[500] tracking-[-0.035em] leading-[1.1] landing-gradient-text mb-5">
              {dashboardHeading}
            </h2>
            <p className="text-[16px] leading-[1.7] text-[#9b9ba4]">
              {dashboardDescription}
            </p>
          </div>

          {/* 3 visual feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cards.map((card, i) => (
              <div key={card.title} className="scroll-fade-in card-shine rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="h-[200px] flex items-center justify-center mb-6 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                  <FeatureCardVisual visual={card.visual} />
                </div>
                <h3 className="text-[15px] font-medium text-white mb-2">{card.title}</h3>
                <p className="text-[13px] text-[#9b9ba4] leading-[1.6]">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature deep-dive — Real-time activity ────────────────── */}
      <section className={`py-24 px-6 border-t border-white/[0.04] ${className ?? ''}`}>
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-[clamp(28px,5vw,48px)] font-[500] tracking-[-0.035em] leading-[1.1] landing-gradient-text mb-5">
                {realtimeHeading}
              </h2>
              <p className="text-[16px] leading-[1.7] text-[#9b9ba4] mb-10">
                {realtimeDescription}
              </p>

              <div className="space-y-4">
                {features.map(f => (
                  <div key={f.title} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-[14px] font-medium text-white">{f.title}</h4>
                      <p className="text-[13px] text-[#9b9ba4] leading-[1.6]">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity frequency chart */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 relative overflow-hidden flex flex-col justify-between h-full">
              <div className="text-[12px] text-[#6b6b76] uppercase tracking-wider mb-6">{chartTitle}</div>
              <div className="flex items-end gap-2 flex-1 mb-4">
                {days.map(d => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col gap-[2px] items-center">
                      <div className="w-full rounded-t transition-all" style={{ height: `${d.eng * 8}px`, background: 'linear-gradient(180deg, #22d3ee, #0e7490)' }} />
                      <div className="w-full transition-all" style={{ height: `${d.port * 8}px`, background: 'linear-gradient(180deg, #34d399, #047857)' }} />
                      <div className="w-full rounded-b transition-all" style={{ height: `${d.rep * 8}px`, background: 'linear-gradient(180deg, #38bdf8, #0369a1)' }} />
                    </div>
                    <span className="text-[11px] text-[#6b6b76] mt-2">{d.day}</span>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex gap-4 pt-4 border-t border-white/[0.06]">
                {legend.map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.gradient }} />
                    <span className="text-[11px] text-[#9b9ba4]">{item.label}</span>
                  </div>
                ))}
              </div>
              {/* Decorative glow */}
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-cyan-600/[0.06] rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

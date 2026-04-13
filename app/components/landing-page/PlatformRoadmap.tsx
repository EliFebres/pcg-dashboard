'use client';

interface TimelineMonth {
  label: string;
  year: string;
}

interface TimelineProject {
  name: string;
  color: string;
  borderColor: string;
  start: number;
  width: number;
}

interface RoadmapFeature {
  title: string;
  desc: string;
}

interface PlatformRoadmapProps {
  heading: string;
  description: string;
  months: TimelineMonth[];
  currentMonthIndex?: number;
  projects: TimelineProject[];
  features: RoadmapFeature[];
  className?: string;
}

export default function PlatformRoadmap({
  heading,
  description,
  months,
  currentMonthIndex,
  projects,
  features,
  className,
}: PlatformRoadmapProps) {
  return (
    <section className={`py-24 px-6 border-t border-white/[0.04] ${className ?? ''}`}>
      <div className="max-w-[1100px] mx-auto">
        <div className="max-w-[640px] mx-auto text-center mb-16">
          <h2 className="text-[clamp(28px,5vw,48px)] font-[500] tracking-[-0.035em] leading-[1.1] landing-gradient-text mb-5">
            {heading}
          </h2>
          <p className="text-[16px] leading-[1.7] text-[#9b9ba4]">
            {description}
          </p>
        </div>

        {/* Timeline visual */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-x-auto">
          {/* Month headers */}
          <div className="flex gap-0 mb-6 min-w-[600px]">
            {months.map((m, i) => (
              <div key={`${m.label}-${i}`} className={`flex-1 text-[12px] text-[#6b6b76] border-l border-white/[0.06] pl-2 ${i === currentMonthIndex ? 'text-cyan-500' : ''}`}>
                {m.label} {m.year}
              </div>
            ))}
          </div>
          {/* Project bars */}
          <div className="space-y-3 min-w-[600px]">
            {projects.map(p => (
              <div key={p.name} className="flex items-center gap-3 h-9">
                <div className="relative flex-1 h-7 rounded">
                  <div
                    className="absolute h-full rounded flex items-center px-3"
                    style={{
                      left: `${p.start}%`,
                      width: `${p.width}%`,
                      backgroundColor: `${p.color}33`,
                      borderWidth: 1,
                      borderColor: `${p.borderColor}4D`,
                    }}
                  >
                    <span className="text-[12px] text-[#e8e8ed] whitespace-nowrap truncate">{p.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {features.map(f => (
            <div
              key={f.title}
              className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
            >
              <h3 className="text-[14px] font-medium text-white mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-[#9b9ba4] leading-[1.6]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

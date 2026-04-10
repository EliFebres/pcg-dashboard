import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   Linear-style landing page — faithful reproduction of layout,
   typography, and visual design. Swap content to make it your own.
   ──────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div
      className="min-h-screen bg-[#08070b] text-white overflow-x-hidden"
      style={{ fontFamily: 'var(--font-geist-sans)' }}
    >
      {/* ── Background effects ──────────────────────────────────── */}
      <div className="hero-glow fixed inset-0 pointer-events-none" />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-[72px] pb-12 px-6">
        <div className="max-w-[740px] mx-auto text-center">
          {/* Announcement pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] mb-8 fade-in cursor-pointer hover:bg-white/[0.06] transition-colors">
            <span className="text-[13px] text-[#b4b4bc]">Introducing Linear Agents</span>
            <span className="text-[13px] text-cyan-500 flex items-center gap-0.5">
              Built for the future <ChevronRight size={13} />
            </span>
          </div>

          <h1 className="text-[clamp(36px,7vw,72px)] font-[500] leading-[1.05] tracking-[-0.04em] landing-gradient-text mb-6 fade-in-d1">
            A better way to<br />work together
          </h1>

          <p className="text-[17px] leading-[1.7] text-[#9b9ba4] max-w-[520px] mx-auto mb-10 fade-in-d2">
            Meet the new standard for modern software development.
            Streamline client projects, visually share notes and progress, and automatically analyze insights.
          </p>

          <div className="flex items-center justify-center gap-4 fade-in-d3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-[10px] text-[14px] font-medium transition-colors"
            >
              Sign Up
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] border border-white/[0.1] text-[14px] font-medium text-[#b4b4bc] hover:text-white hover:border-white/[0.2] transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Hero product image ──────────────────────────────────── */}
      <section className="relative px-6 pb-28 fade-in-d4">
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
                    {/* Heatmap grid — fills remaining card height */}
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

      {/* ── Feature deep-dive — Issue tracking ──────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[640px] mb-16">
            <h2 className="text-[clamp(28px,5vw,48px)] font-[500] tracking-[-0.035em] leading-[1.1] landing-gradient-text mb-5">
              Issue tracking<br />you&apos;ll enjoy using
            </h2>
            <p className="text-[16px] leading-[1.7] text-[#9b9ba4]">
              Create tasks in seconds, discuss issues in context, and breeze
              through your work in views tailored to you and your team.
            </p>
          </div>

          {/* 3 visual feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 — Keyboard */}
            <div className="card-shine rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col">
              <div className="h-[200px] flex items-center justify-center mb-6 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                <div className="grid grid-cols-5 gap-1.5">
                  {['⌘', 'K', 'I', 'A', 'S', 'P', 'L', 'D', 'C', 'V'].map((k, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-md bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[11px] text-[#9b9ba4] font-mono"
                    >
                      {k}
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="text-[15px] font-medium text-white mb-2">Built for your keyboard</h3>
              <p className="text-[13px] text-[#9b9ba4] leading-[1.6]">
                Fly through your tasks with rapid-fire keyboard shortcuts
                for everything. Literally everything.
              </p>
            </div>

            {/* Card 2 — Speed */}
            <div className="card-shine rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col">
              <div className="h-[200px] flex items-center justify-center mb-6 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-center">
                  <div className="text-[48px] font-[600] tracking-tight landing-gradient-text">50ms</div>
                  <div className="text-[12px] text-[#6b6b76] mt-1">interactions &amp; real-time sync</div>
                </div>
              </div>
              <h3 className="text-[15px] font-medium text-white mb-2">Breathtakingly fast</h3>
              <p className="text-[13px] text-[#9b9ba4] leading-[1.6]">
                Built for speed with 50ms interactions and real-time sync,
                so your tools never slow you down.
              </p>
            </div>

            {/* Card 3 — Workflows */}
            <div className="card-shine rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col">
              <div className="h-[200px] flex items-center justify-center mb-6 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                <div className="space-y-2.5 w-full px-5">
                  {[
                    { label: 'Backlog', color: 'bg-[#3b3b44]', w: 'w-3/4' },
                    { label: 'Todo', color: 'bg-[#6b6b76]', w: 'w-2/3' },
                    { label: 'In Progress', color: 'bg-cyan-600', w: 'w-1/2' },
                    { label: 'Done', color: 'bg-emerald-500', w: 'w-5/6' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="text-[11px] text-[#6b6b76] w-[72px] text-right flex-shrink-0">{s.label}</span>
                      <div className={`h-2 rounded-full ${s.color} ${s.w}`} />
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="text-[15px] font-medium text-white mb-2">Designed for modern software teams</h3>
              <p className="text-[13px] text-[#9b9ba4] leading-[1.6]">
                Comes with built-in workflows that create focus and routine
                for your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature deep-dive — Issue tracking (copy) ─────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[640px] mb-16">
            <h2 className="text-[clamp(28px,5vw,48px)] font-[500] tracking-[-0.035em] leading-[1.1] landing-gradient-text mb-5">
              Issue tracking<br />you&apos;ll enjoy using
            </h2>
            <p className="text-[16px] leading-[1.7] text-[#9b9ba4]">
              Create tasks in seconds, discuss issues in context, and breeze
              through your work in views tailored to you and your team.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Parent and sub-issues', desc: 'Break larger tasks into smaller, actionable issues.' },
              { title: 'Automated backlog', desc: 'Auto-close and auto-archive stale issues to keep your backlog lean.' },
              { title: 'Custom workflows', desc: 'Define unique issue states and flows for each team.' },
              { title: 'Filters and custom views', desc: 'Slice and dice issues with powerful filters and saved views.' },
              { title: 'Discussion', desc: 'Collaborate on issues in context without losing the thread.' },
              { title: 'Issue templates', desc: 'Guide your team with templates for common issue types.' },
            ].map(f => (
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

      {/* ── Feature deep-dive — Cycles ──────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-[clamp(28px,5vw,48px)] font-[500] tracking-[-0.035em] leading-[1.1] landing-gradient-text mb-5">
                Build momentum<br />with Cycles
              </h2>
              <p className="text-[16px] leading-[1.7] text-[#9b9ba4] mb-10">
                Cycles focus your team on what work should happen next.
                A healthy routine to maintain velocity and make meaningful progress.
              </p>

              <div className="space-y-4">
                {[
                  { title: 'Automatic tracking', desc: 'Started issues are added to the current cycle.' },
                  { title: 'Scheduled', desc: 'Unfinished work rolls over to the next cycle automatically.' },
                  { title: 'Fully configurable', desc: 'Set start and end dates, duration, and cool-down periods.' },
                  { title: 'Predict delays', desc: 'Get warnings when a cycle is at risk of falling behind.' },
                ].map(f => (
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

            {/* Cycle visual */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 relative overflow-hidden">
              <div className="text-[12px] text-[#6b6b76] uppercase tracking-wider mb-4">Cycle 24 — Apr 7 – Apr 20</div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9b9ba4]">Scope</span>
                  <span className="text-white font-medium">34 issues</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9b9ba4]">Completed</span>
                  <span className="text-emerald-400 font-medium">21 issues</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9b9ba4]">In progress</span>
                  <span className="text-cyan-500 font-medium">8 issues</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
                <div className="bg-emerald-500 rounded-l-full" style={{ width: '62%' }} />
                <div className="bg-cyan-600" style={{ width: '23%' }} />
              </div>
              {/* Decorative glow */}
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-cyan-600/[0.06] rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature deep-dive — Roadmaps ─────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[640px] mx-auto text-center mb-16">
            <h2 className="text-[clamp(28px,5vw,48px)] font-[500] tracking-[-0.035em] leading-[1.1] landing-gradient-text mb-5">
              Set direction<br />with Roadmaps
            </h2>
            <p className="text-[16px] leading-[1.7] text-[#9b9ba4]">
              Plan visually, collaborate cross-team, and make better decisions
              with insights and updates.
            </p>
          </div>

          {/* Timeline visual */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-x-auto">
            {/* Month headers */}
            <div className="flex gap-0 mb-6 min-w-[600px]">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
                <div key={m} className={`flex-1 text-[12px] text-[#6b6b76] border-l border-white/[0.06] pl-3 ${i === 3 ? 'text-cyan-500' : ''}`}>
                  {m} 2025
                </div>
              ))}
            </div>
            {/* Project bars */}
            <div className="space-y-3 min-w-[600px]">
              {[
                { name: 'API v2 Launch', color: 'bg-cyan-600', start: 5, width: 40 },
                { name: 'Mobile App', color: 'bg-sky-500', start: 20, width: 55 },
                { name: 'Design System', color: 'bg-emerald-500', start: 0, width: 65 },
                { name: 'Analytics Dashboard', color: 'bg-amber-500', start: 35, width: 45 },
                { name: 'Customer Portal', color: 'bg-rose-500', start: 50, width: 35 },
              ].map(p => (
                <div key={p.name} className="flex items-center gap-3 h-9">
                  <div className="relative flex-1 h-7 rounded">
                    <div
                      className={`absolute h-full rounded ${p.color}/20 border border-${p.color.replace('bg-','')}/30 flex items-center px-3`}
                      style={{ left: `${p.start}%`, width: `${p.width}%` }}
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
            {[
              { title: 'Multi-team projects', desc: 'Collaborate across teams and departments.' },
              { title: 'Project documents', desc: 'Keep briefs and specs alongside the work.' },
              { title: 'Timeline views', desc: 'Visualize your product journey end-to-end.' },
              { title: 'Project insights', desc: 'Track scope, velocity, and progress at a glance.' },
              { title: 'Custom roadmaps', desc: 'Organize work across multiple views and filters.' },
              { title: 'Notifications', desc: 'Stay informed with personal project updates.' },
            ].map(f => (
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

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Product */}
            <div>
              <div className="text-[12px] font-medium text-[#6b6b76] uppercase tracking-wider mb-4">Product</div>
              <div className="space-y-2.5">
                {['Features', 'Integrations', 'Pricing', 'Changelog', 'Docs', 'Linear Method', 'Download'].map(l => (
                  <div key={l} className="text-[13px] text-[#9b9ba4] hover:text-white transition-colors cursor-pointer">{l}</div>
                ))}
              </div>
            </div>
            {/* Company */}
            <div>
              <div className="text-[12px] font-medium text-[#6b6b76] uppercase tracking-wider mb-4">Company</div>
              <div className="space-y-2.5">
                {['About us', 'Blog', 'Careers', 'Customers', 'Brand'].map(l => (
                  <div key={l} className="text-[13px] text-[#9b9ba4] hover:text-white transition-colors cursor-pointer">{l}</div>
                ))}
              </div>
            </div>
            {/* Resources */}
            <div>
              <div className="text-[12px] font-medium text-[#6b6b76] uppercase tracking-wider mb-4">Resources</div>
              <div className="space-y-2.5">
                {['Community', 'Contact', 'DPA', 'Terms of service', 'Report a vulnerability'].map(l => (
                  <div key={l} className="text-[13px] text-[#9b9ba4] hover:text-white transition-colors cursor-pointer">{l}</div>
                ))}
              </div>
            </div>
            {/* Developers */}
            <div>
              <div className="text-[12px] font-medium text-[#6b6b76] uppercase tracking-wider mb-4">Developers</div>
              <div className="space-y-2.5">
                {['API', 'Status', 'GitHub', 'README'].map(l => (
                  <div key={l} className="text-[13px] text-[#9b9ba4] hover:text-white transition-colors cursor-pointer">{l}</div>
                ))}
              </div>
            </div>
            {/* Connect */}
            <div>
              <div className="text-[12px] font-medium text-[#6b6b76] uppercase tracking-wider mb-4">Connect</div>
              <div className="space-y-2.5">
                {['X (Twitter)', 'GitHub', 'Slack', 'YouTube'].map(l => (
                  <div key={l} className="text-[13px] text-[#9b9ba4] hover:text-white transition-colors cursor-pointer">{l}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row — 4 logo options (pick one, delete the rest) */}
          <div className="flex items-center justify-between pt-8 border-t border-white/[0.06]">
            <div className="flex items-center gap-12">

              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 100 100" fill="none">
                  <defs>
                    <linearGradient id="logoGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#22d3ee"/>
                      <stop offset="100%" stopColor="#0891b2"/>
                    </linearGradient>
                  </defs>
                  <path d="M50 5A45 45 0 1 1 12 32" stroke="url(#logoGrad)" strokeWidth="8" strokeLinecap="round" fill="none"/>
                  <path d="M50 24A26 26 0 1 0 72 66" stroke="url(#logoGrad)" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.4"/>
                  <circle cx="50" cy="50" r="7" fill="url(#logoGrad)"/>
                </svg>
                <span className="text-[12px] text-[#6b6b76]">PCG Tools — Developed by Eli Febres &copy; {new Date().getFullYear()} Portfolio Consulting Group</span>
              </div>

            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import LoginModal from '@/app/components/auth/LoginModal';
import SignupModal from '@/app/components/auth/SignupModal';

/* ────────────────────────────────────────────────────────────────
   Linear-style landing page — faithful reproduction of layout,
   typography, and visual design. Swap content to make it your own.
   ──────────────────────────────────────────────────────────────── */

export default function Home() {
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const targets = el.querySelectorAll('.scroll-fade-in');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.2 }
    );
    targets.forEach(t => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={scrollRef}
      className="min-h-screen bg-[#08070b] text-white overflow-x-hidden"
      style={{ fontFamily: 'var(--font-geist-sans)' }}
    >
      {/* ── Background effects ──────────────────────────────────── */}
      <div className="hero-glow fixed inset-0 pointer-events-none" />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-[72px] pb-12 px-6">
        <div className="max-w-[740px] mx-auto text-center">
          {/* Announcement pill */}
          <button onClick={() => setAuthModal('login')} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] mb-8 fade-in cursor-pointer hover:bg-white/[0.06] transition-colors">
            <span className="text-[13px] text-[#b4b4bc]">Now tracking Client Interactions</span>
            <span className="text-[13px] text-cyan-500 flex items-center gap-0.5">
              See what&apos;s new <ChevronRight size={13} />
            </span>
          </button>

          <h1 className="text-[clamp(36px,7vw,72px)] font-[500] leading-[1.05] tracking-[-0.04em] landing-gradient-text mb-6 fade-in-d1">
            A better way to<br />work together
          </h1>

          <p className="text-[17px] leading-[1.7] text-[#9b9ba4] max-w-[600px] mx-auto mb-10 fade-in-d2">
            Meet the new standard for modern software development.
          </p>

          <div className="flex items-center justify-center gap-4 fade-in-d3">
            <button
              onClick={() => setAuthModal('signup')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-[10px] text-[14px] font-medium transition-colors"
            >
              Sign Up
              <ArrowRight size={15} />
            </button>
            <button
              onClick={() => setAuthModal('login')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] border border-white/[0.1] text-[14px] font-medium text-[#b4b4bc] hover:text-white hover:border-white/[0.2] transition-colors"
            >
              Log In
            </button>
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

      {/* ── Feature deep-dive — Dashboards ──────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.04] scroll-fade-in">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[640px] mb-16">
            <h2 className="text-[clamp(28px,5vw,48px)] font-[500] tracking-[-0.035em] leading-[1.1] landing-gradient-text mb-5">
              Every insight,<br />one dashboard
            </h2>
            <p className="text-[16px] leading-[1.7] text-[#9b9ba4]">
              Track client engagements, analyze client portfolios, and
              surface ticker trends all from a single platform built for ISG.
            </p>
          </div>

          {/* 3 visual feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 — Activity Heatmap */}
            <div className="card-shine rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col">
              <div className="h-[200px] flex items-center justify-center mb-6 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                <div className="px-4">
                  <div className="flex items-end gap-[3px]">
                    {[
                      [0,1,0,2,1,0,3],
                      [1,2,1,0,2,3,1],
                      [0,3,2,1,0,1,2],
                      [2,1,3,2,1,0,1],
                      [1,0,2,3,2,1,0],
                      [0,2,1,0,3,2,1],
                      [3,1,0,2,1,3,2],
                      [1,2,3,1,0,2,0],
                      [0,1,2,3,2,1,3],
                      [2,0,1,2,3,0,1],
                      [1,3,0,1,2,1,2],
                      [0,2,1,3,1,2,0],
                    ].map((col, ci) => (
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
              </div>
              <h3 className="text-[15px] font-medium text-white mb-2">Client interaction tracking</h3>
              <p className="text-[13px] text-[#9b9ba4] leading-[1.6]">
                Visualize engagement activity at a glance with contribution
                heatmaps across your entire team.
              </p>
            </div>

            {/* Card 2 — Portfolio Trends */}
            <div className="card-shine rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col">
              <div className="h-[200px] flex items-center justify-center mb-6 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden">
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
                  <text x="110" y="135" textAnchor="middle" fill="#6b6b76" fontSize="7" fontFamily="var(--font-geist-sans)">Value / Growth</text>
                  <text x="12" y="65" textAnchor="middle" fill="#6b6b76" fontSize="7" fontFamily="var(--font-geist-sans)" transform="rotate(-90, 12, 65)">Small / Large</text>
                  {/* Scatter bubbles */}
                  {[
                    { x: 65, y: 45, r: 5, color: '#06b6d4', o: 0.9 },
                    { x: 88, y: 72, r: 6, color: '#06b6d4', o: 1 },
                    { x: 120, y: 38, r: 4, color: '#06b6d4', o: 0.7 },
                    { x: 145, y: 58, r: 7, color: '#06b6d4', o: 0.85 },
                    { x: 72, y: 95, r: 5, color: '#06b6d4', o: 0.75 },
                    { x: 155, y: 85, r: 4, color: '#06b6d4', o: 0.6 },
                    { x: 100, y: 52, r: 5, color: '#06b6d4', o: 0.8 },
                    { x: 132, y: 100, r: 6, color: '#06b6d4', o: 0.7 },
                    { x: 50, y: 68, r: 4, color: '#06b6d4', o: 0.65 },
                    { x: 170, y: 42, r: 5, color: '#06b6d4', o: 0.9 },
                    { x: 110, y: 65, r: 5, color: '#6b6b76', o: 0.9 },
                    { x: 78, y: 55, r: 7, color: '#6b6b76', o: 0.75 },
                    { x: 140, y: 78, r: 4, color: '#6b6b76', o: 0.8 },
                    { x: 58, y: 85, r: 6, color: '#6b6b76', o: 0.65 },
                    { x: 165, y: 55, r: 5, color: '#6b6b76', o: 0.7 },
                    { x: 95, y: 98, r: 3, color: '#6b6b76', o: 0.6 },
                    { x: 125, y: 28, r: 5, color: '#6b6b76', o: 0.85 },
                    { x: 48, y: 38, r: 4, color: '#6b6b76', o: 0.7 },
                  ].map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.color} fillOpacity={p.o} />
                  ))}
                </svg>
              </div>
              <h3 className="text-[15px] font-medium text-white mb-2">Portfolio construction analytics</h3>
              <p className="text-[13px] text-[#9b9ba4] leading-[1.6]">
                Compare client portfolio characteristics against benchmarks
                with style maps and performance trend lines.
              </p>
            </div>

            {/* Card 3 — Ticker Trends */}
            <div className="card-shine rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col">
              <div className="h-[200px] flex items-center justify-center mb-6 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                <div className="w-full px-5 space-y-3">
                  {[100, 86, 73, 54, 45].map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-[36px] h-[10px] rounded bg-white/[0.06] flex-shrink-0" />
                      <div className="flex-1 h-[10px] rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full bg-cyan-500" style={{ width: `${w}%`, opacity: 1 - i * 0.15 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="text-[15px] font-medium text-white mb-2">Ticker adoption trends</h3>
              <p className="text-[13px] text-[#9b9ba4] leading-[1.6]">
                Track hot tickers, spot DFA adoption patterns,
                and surface emerging trends across portfolios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature deep-dive — Real-time activity ────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.04] scroll-fade-in">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-[clamp(28px,5vw,48px)] font-[500] tracking-[-0.035em] leading-[1.1] landing-gradient-text mb-5">
                Stay in sync,<br />in real time
              </h2>
              <p className="text-[16px] leading-[1.7] text-[#9b9ba4] mb-10">
                A shared view of your team&apos;s activity as it happens — so
                nothing slips through the cracks.
              </p>

              <div className="space-y-4">
                {[
                  { title: 'Live activity feed', desc: 'See engagements, portfolio logs, and report requests as they happen.' },
                  { title: 'Team-wide visibility', desc: 'One view of what everyone is working on across departments.' },
                  { title: 'Filterable by role', desc: 'Drill down to your office, your department, or your own activity.' },
                  { title: 'Exportable data', desc: 'Pull what you need into spreadsheets for leadership or compliance.' },
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

            {/* Activity frequency chart */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 relative overflow-hidden flex flex-col justify-between h-full">
              <div className="text-[12px] text-[#6b6b76] uppercase tracking-wider mb-6">Weekly Activity</div>
              <div className="flex items-end gap-2 flex-1 mb-4">
                {[
                  { day: 'Mon', eng: 9, port: 4, rep: 2 },
                  { day: 'Tue', eng: 12, port: 3, rep: 4 },
                  { day: 'Wed', eng: 7, port: 5, rep: 1 },
                  { day: 'Thu', eng: 11, port: 3, rep: 3 },
                  { day: 'Fri', eng: 8, port: 3, rep: 2 },
                ].map(d => (
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
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(180deg, #22d3ee, #0e7490)' }} />
                  <span className="text-[11px] text-[#9b9ba4]">Engagements</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(180deg, #34d399, #047857)' }} />
                  <span className="text-[11px] text-[#9b9ba4]">Portfolios</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(180deg, #38bdf8, #0369a1)' }} />
                  <span className="text-[11px] text-[#9b9ba4]">Reports</span>
                </div>
              </div>
              {/* Decorative glow */}
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-cyan-600/[0.06] rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature deep-dive — Roadmaps ─────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.04] scroll-fade-in">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[640px] mx-auto text-center mb-16">
            <h2 className="text-[clamp(28px,5vw,48px)] font-[500] tracking-[-0.035em] leading-[1.1] landing-gradient-text mb-5">
              Platform Roadmap
            </h2>
            <p className="text-[16px] leading-[1.7] text-[#9b9ba4]">
              Follow what&apos;s shipping, what&apos;s next, and where the platform is headed.
            </p>
          </div>

          {/* Timeline visual */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-x-auto">
            {/* Month headers */}
            <div className="flex gap-0 mb-6 min-w-[600px]">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'].map((m, i) => (
                <div key={`${m}-${i}`} className={`flex-1 text-[12px] text-[#6b6b76] border-l border-white/[0.06] pl-2 ${i === 3 ? 'text-cyan-500' : ''}`}>
                  {m} {i < 12 ? '26' : '27'}
                </div>
              ))}
            </div>
            {/* Project bars */}
            <div className="space-y-3 min-w-[600px]">
              {[
                // { name: 'Project Name', color: 'bg-COLOR-SHADE', start: START_%, width: WIDTH_% },
                // start: 0 = Jan 26, ~8 = Feb, ~15 = Mar, ~23 = Apr, ~31 = May, ~38 = Jun, ~46 = Jul, ~54 = Aug, ~62 = Sep, ~69 = Oct, ~77 = Nov, ~85 = Dec, ~92 = Jan 27
                { name: 'Client Interactions', color: 'bg-cyan-600', start: 0, width: 54 },
                { name: 'Portfolio Trends', color: 'bg-sky-500', start: 54, width: 31 },
                { name: 'Landing Page and User Management', color: 'bg-emerald-500', start: 15, width: 39 },
                { name: 'Ticker Trends', color: 'bg-amber-500', start: 31, width: 31 },
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
              { title: 'Interaction automation', desc: 'Auto-log client engagements and reduce manual data entry.' },
              { title: 'Leadership report automation', desc: 'Generate executive summaries and team activity reports on demand.' },
              { title: 'Cross-dashboard insights', desc: 'Data flows between dashboards so actions in one surface automatically in others.' },
              { title: 'Market monitoring dashboard', desc: 'Track yield curves, spreads, and macro signals in one place.' },
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
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
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
            <span className="text-[12px] text-[#6b6b76]">PCG Tools &copy; {new Date().getFullYear()} Portfolio Consulting Group</span>
          </div>
          <span className="text-[12px] text-[#6b6b76]">Developed by Eli Febres</span>
        </div>
      </footer>

      {/* Auth modals */}
      <LoginModal
        isOpen={authModal === 'login'}
        onClose={() => setAuthModal(null)}
        onSwitchToSignup={() => setAuthModal('signup')}
      />
      <SignupModal
        isOpen={authModal === 'signup'}
        onClose={() => setAuthModal(null)}
        onSwitchToLogin={() => setAuthModal('login')}
      />
    </div>
  );
}

import Link from 'next/link';
import { MessageSquare, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { query } from '@/app/lib/db/index';
import { queryUsers } from '@/app/lib/db/users';
import { loggedPortfolios } from '@/app/lib/data/portfolioTrends';

async function getStats() {
  try {
    const [engagementRows, teamRows] = await Promise.all([
      query<{ total: number }>('SELECT COUNT(*) AS total FROM engagements'),
      queryUsers<{ total: number }>('SELECT COUNT(*) AS total FROM users WHERE status = ?', ['active']),
    ]);
    return {
      engagements: Number(engagementRows[0]?.total ?? 0),
      portfolios: loggedPortfolios.length,
      teamMembers: Number(teamRows[0]?.total ?? 0),
    };
  } catch {
    return { engagements: null, portfolios: loggedPortfolios.length, teamMembers: null };
  }
}

export default async function Home() {
  const stats = await getStats();
  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(37,99,235,0.18),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_30%,rgba(6,182,212,0.10),transparent)]" />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 gap-6">
          <span className="text-xs font-medium tracking-widest uppercase text-cyan-400/80">
            Portfolio Consulting Group
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight max-w-3xl">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
              Smarter tools
            </span>
            <br />
            <span className="text-white">for your practice.</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-xl">
            Track client interactions, analyze portfolio trends, and stay ahead — all in one place.
          </p>

          <div className="flex items-center gap-4 mt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-blue-900/30"
            >
              Sign Up
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white font-medium text-sm transition-colors duration-200"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
      </section>

      {/* ─── Stats Section (template) ─────────────────────────────────── */}
      <section className="py-20 px-6 border-y border-zinc-800/50">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 divide-x divide-zinc-800/50 text-center">
            {[
              { value: stats.engagements?.toLocaleString() ?? '—', label: 'Engagements Tracked' },
              { value: stats.portfolios.toLocaleString(),           label: 'Portfolios Analyzed' },
              { value: stats.teamMembers?.toLocaleString() ?? '—',  label: 'Team Members' },
            ].map(({ value, label }) => (
              <div key={label} className="px-6 py-4">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                  {value}
                </div>
                <div className="text-sm text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Section (template) ──────────────────────────────── */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Your entire workflow, in one place</h2>
            <p className="text-zinc-400 max-w-lg mx-auto">From first client contact to portfolio analysis, every tool connects seamlessly — so nothing falls through the cracks.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: 'Client Interactions', desc: 'Log and track every client touchpoint with full history and status tracking.' },
              { icon: TrendingUp,    title: 'Portfolio Trends',    desc: 'Analyze portfolio construction patterns and benchmark comparisons over time.' },
              { icon: Users,         title: 'Team Visibility',     desc: 'See department-level activity and coordinate across offices effortlessly.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="relative p-6 rounded-xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 overflow-hidden group min-h-64"
              >
                {/* Full-card background icon */}
                <Icon
                  className="absolute inset-0 m-auto text-white/5"
                  style={{ width: '70%', height: '70%' }}
                  strokeWidth={1}
                />
                {/* Light blue gradient overlay between icon and text */}
                <div className="absolute inset-0 bg-gradient-to-t from-sky-900/40 via-blue-900/20 to-transparent" />
                {/* Top shine */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                {/* Text content */}
                <div className="relative z-10 mt-36">
                  <h3 className="text-white font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer bar */}
      <div className="border-t border-zinc-800/50 py-6 px-8 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} Portfolio Consulting Group. All rights reserved.
      </div>

    </div>
  );
}

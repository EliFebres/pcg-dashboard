'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Target, Loader2 } from 'lucide-react';
import type { CompetitorSummary } from '@/app/lib/types/competitive';

interface CompetitorSummaryCardsProps {
  summary: CompetitorSummary | null;
  isLoading: boolean;
}

export default function CompetitorSummaryCards({ summary, isLoading }: CompetitorSummaryCardsProps) {
  const winRate = summary ? Math.round((summary.firmWinning / summary.totalComparisons) * 100) : 0;
  const winPct = summary ? (summary.firmWinning / summary.totalComparisons) * 100 : 0;
  const lossPct = summary ? (summary.competitorWinning / summary.totalComparisons) * 100 : 0;

  const cards = [
    {
      label: 'Firm Winning',
      value: summary ? `${summary.firmWinning} Fund${summary.firmWinning !== 1 ? 's' : ''}` : '—',
      subtitle: summary ? `out of ${summary.totalComparisons} comparisons` : '',
      color: 'text-emerald-400',
      icon: TrendingUp,
      accent: 'from-emerald-500/20 to-transparent',
    },
    {
      label: 'Competitor Winning',
      value: summary ? `${summary.competitorWinning} Fund${summary.competitorWinning !== 1 ? 's' : ''}` : '—',
      subtitle: summary?.tied ? `${summary.tied} tied` : '',
      color: 'text-red-400',
      icon: TrendingDown,
      accent: 'from-red-500/20 to-transparent',
    },
    {
      label: 'Firm Win Rate',
      value: summary ? `${winRate}%` : '—',
      subtitle: 'across all periods',
      color: 'text-cyan-400',
      icon: Target,
      accent: 'from-cyan-500/20 to-transparent',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>

            {isLoading ? (
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            ) : (
              <>
                <div className={`text-2xl font-semibold ${card.color} mb-1`}>{card.value}</div>
                <div className="text-xs text-zinc-500">{card.subtitle}</div>

                {/* Mini ring chart for win rate card */}
                {card.label === 'Firm Win Rate' && summary && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative w-10 h-10">
                      <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-800" />
                        <circle
                          cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
                          className="text-emerald-500"
                          strokeDasharray={`${winPct * 0.88} 100`}
                          strokeLinecap="round"
                        />
                        <circle
                          cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
                          className="text-red-500"
                          strokeDasharray={`${lossPct * 0.88} 100`}
                          strokeDashoffset={`${-(winPct * 0.88)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-zinc-500">Firm ({summary.firmWinning})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[10px] text-zinc-500">Competitor ({summary.competitorWinning})</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

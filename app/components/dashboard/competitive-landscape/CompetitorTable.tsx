'use client';

import React from 'react';
import { FileText, Loader2, Trophy, Medal } from 'lucide-react';
import type { FundComparisonRow, FundCategory } from '@/app/lib/types/competitive';

interface CompetitorTableProps {
  funds: FundComparisonRow[];
  isLoading: boolean;
  error: string | null;
  showPriceToBook: boolean;
  onNotesOpen: (fund: FundComparisonRow) => void;
}

const getCategoryStyle = (category: FundCategory): string => {
  switch (category) {
    case 'US Equity': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
    case 'Dev Ex US Equity': return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
    case 'Emerging Markets Equity': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'Global Equity': return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
    case 'Real Estate': return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
    case 'Fixed Income': return 'bg-teal-500/15 text-teal-400 border border-teal-500/30';
    default: return 'bg-zinc-500/15 text-muted border border-zinc-500/30';
  }
};

const formatReturn = (val: number | null): string => {
  if (val === null) return 'N/A';
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
};

const formatDelta = (firm: number | null, competitor: number | null): { text: string; positive: boolean | null } => {
  if (firm === null || competitor === null) return { text: 'N/A', positive: null };
  const delta = firm - competitor;
  return {
    text: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`,
    positive: delta >= 0,
  };
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="w-4 h-4 text-amber-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-muted" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="text-sm text-muted font-mono">{rank}</span>;
};

const ScoreBar = ({ total, outOf }: { total: number; outOf: number }) => {
  const pct = (total / outOf) * 100;
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-muted w-7 text-right">{total}/{outOf}</span>
      <div className="w-16 h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default function CompetitorTable({
  funds,
  isLoading,
  error,
  showPriceToBook,
  onNotesOpen,
}: CompetitorTableProps) {
  return (
    <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      {/* Header */}
      <div className="relative z-10 px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted">Fund Comparisons</h3>
          <span className="text-xs text-muted">({funds.length} comparisons)</span>
        </div>
      </div>

      {/* Table */}
      <div className="relative z-10 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-muted animate-spin mr-2" />
            <span className="text-sm text-muted">Loading fund comparisons...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-red-400">{error}</span>
          </div>
        ) : funds.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-muted">No comparisons found</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-800/95 backdrop-blur-sm border-b border-zinc-700/50">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted uppercase tracking-wider w-10">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted uppercase tracking-wider">Category</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted uppercase tracking-wider">Competitor</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted uppercase tracking-wider">Firm Alternative</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">Expense</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">1 Yr</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">3 Yr</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">5 Yr</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">10 Yr</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">Holdings</th>
                {showPriceToBook && (
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">P/B</th>
                )}
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">Yield</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">Firm Score</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider w-14">Notes</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((fund) => {
                const r1 = formatDelta(fund.firmReturns.oneYear, fund.competitorReturns.oneYear);
                const r3 = formatDelta(fund.firmReturns.threeYear, fund.competitorReturns.threeYear);
                const r5 = formatDelta(fund.firmReturns.fiveYear, fund.competitorReturns.fiveYear);
                const r10 = formatDelta(fund.firmReturns.tenYear, fund.competitorReturns.tenYear);
                const expWin = fund.firmWins.expenseRatio;
                const holdingsWin = fund.firmWins.holdings;
                const pbWin = fund.firmWins.priceToBook;
                const yieldWin = fund.firmWins.dividendYield;

                return (
                  <tr key={fund.id} className="border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors">
                    {/* Rank */}
                    <td className="px-3 py-3 text-center">
                      <RankBadge rank={fund.rank} />
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-sm ${getCategoryStyle(fund.category)}`}>
                        {fund.category}
                      </span>
                    </td>

                    {/* Competitor */}
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-cyan-400">{fund.competitorTicker}</div>
                      <div className="text-xs text-muted truncate max-w-[180px]">{fund.competitorName}</div>
                    </td>

                    {/* Firm Alternative */}
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-amber-400">{fund.firmTicker}</div>
                      <div className="text-xs text-muted truncate max-w-[180px]">{fund.firmName}</div>
                    </td>

                    {/* Expense Ratio */}
                    <td className="px-3 py-3 text-center">
                      <div className={`text-xs font-medium ${expWin ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fund.firmExpenseRatio.toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted">vs {fund.competitorExpenseRatio.toFixed(2)}%</div>
                    </td>

                    {/* 1 Yr Return */}
                    <td className={`px-3 py-3 text-center ${r1.positive === true ? 'bg-emerald-500/[0.06]' : r1.positive === false ? 'bg-red-500/[0.06]' : ''}`}>
                      <div className={`text-xs font-medium ${r1.positive === true ? 'text-emerald-400' : r1.positive === false ? 'text-red-400' : 'text-muted'}`}>
                        {r1.text}
                      </div>
                      <div className="text-xs text-muted">
                        {formatReturn(fund.firmReturns.oneYear)} vs {formatReturn(fund.competitorReturns.oneYear)}
                      </div>
                    </td>

                    {/* 3 Yr Return */}
                    <td className={`px-3 py-3 text-center ${r3.positive === true ? 'bg-emerald-500/[0.06]' : r3.positive === false ? 'bg-red-500/[0.06]' : ''}`}>
                      <div className={`text-xs font-medium ${r3.positive === true ? 'text-emerald-400' : r3.positive === false ? 'text-red-400' : 'text-muted'}`}>
                        {r3.text}
                      </div>
                      <div className="text-xs text-muted">
                        {formatReturn(fund.firmReturns.threeYear)} vs {formatReturn(fund.competitorReturns.threeYear)}
                      </div>
                    </td>

                    {/* 5 Yr Return */}
                    <td className={`px-3 py-3 text-center ${r5.positive === true ? 'bg-emerald-500/[0.06]' : r5.positive === false ? 'bg-red-500/[0.06]' : ''}`}>
                      <div className={`text-xs font-medium ${r5.positive === true ? 'text-emerald-400' : r5.positive === false ? 'text-red-400' : 'text-muted'}`}>
                        {r5.text}
                      </div>
                      <div className="text-xs text-muted">
                        {formatReturn(fund.firmReturns.fiveYear)} vs {formatReturn(fund.competitorReturns.fiveYear)}
                      </div>
                    </td>

                    {/* 10 Yr Return */}
                    <td className={`px-3 py-3 text-center ${r10.positive === true ? 'bg-emerald-500/[0.06]' : r10.positive === false ? 'bg-red-500/[0.06]' : ''}`}>
                      <div className={`text-xs font-medium ${r10.positive === true ? 'text-emerald-400' : r10.positive === false ? 'text-red-400' : 'text-muted'}`}>
                        {r10.text}
                      </div>
                      <div className="text-xs text-muted">
                        {formatReturn(fund.firmReturns.tenYear)} vs {formatReturn(fund.competitorReturns.tenYear)}
                      </div>
                    </td>

                    {/* Holdings */}
                    <td className="px-3 py-3 text-center">
                      <div className={`text-xs font-medium ${holdingsWin ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fund.firmHoldings.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted">vs {fund.competitorHoldings.toLocaleString()}</div>
                    </td>

                    {/* P/B Ratio (conditional) */}
                    {showPriceToBook && (
                      <td className="px-3 py-3 text-center">
                        {fund.firmPriceToBook !== null ? (
                          <>
                            <div className={`text-xs font-medium ${pbWin ? 'text-emerald-400' : 'text-red-400'}`}>
                              {fund.firmPriceToBook.toFixed(1)}x
                            </div>
                            <div className="text-xs text-muted">vs {fund.competitorPriceToBook?.toFixed(1)}x</div>
                          </>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    )}

                    {/* Dividend Yield */}
                    <td className="px-3 py-3 text-center">
                      {fund.firmDividendYield !== null ? (
                        <>
                          <div className={`text-xs font-medium ${yieldWin ? 'text-emerald-400' : 'text-red-400'}`}>
                            {fund.firmDividendYield.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted">vs {fund.competitorDividendYield?.toFixed(2)}%</div>
                        </>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    {/* Firm Score */}
                    <td className="px-3 py-3">
                      <ScoreBar total={fund.firmWins.total} outOf={fund.firmWins.outOf} />
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => onNotesOpen(fund)}
                        className={`relative p-1.5 rounded transition-colors ${
                          fund.noteCount > 0
                            ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                            : 'bg-zinc-800/50 text-muted hover:text-muted hover:bg-zinc-800'
                        }`}
                        title={fund.noteCount > 0 ? `${fund.noteCount} note${fund.noteCount > 1 ? 's' : ''}` : 'Add notes'}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {fund.noteCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 text-[9px] text-white rounded-full flex items-center justify-center font-medium">
                            {fund.noteCount}
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

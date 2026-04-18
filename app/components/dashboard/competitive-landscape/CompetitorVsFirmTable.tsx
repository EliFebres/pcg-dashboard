'use client';

import React, { useMemo } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import type { CompetitorComparisonRow } from '@/app/lib/types/competitive';

interface CompetitorVsFirmTableProps {
  funds: CompetitorComparisonRow[];
  isLoading: boolean;
  error: string | null;
  title?: string;
  asOfDate?: string;
  showCharacteristics?: boolean;
  showFICharacteristics?: boolean;
  colorWinningCells?: boolean;
  onNotesOpen: (fund: CompetitorComparisonRow) => void;
}

const formatReturn = (val: number | null): string => {
  if (val === null) return '-';
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
};

// Returns [competitorColor, firmColor] — only the winner gets colored
const getWinnerColors = (firmWins: boolean | null): [string, string] => {
  if (firmWins === true) return ['text-muted', 'text-emerald-400'];
  if (firmWins === false) return ['text-red-400', 'text-muted'];
  return ['text-muted', 'text-muted'];
};

const getCellBg = (firmWins: boolean | null, enabled: boolean): string => {
  if (!enabled || firmWins === null) return '';
  return firmWins ? 'bg-emerald-500/[0.0265]' : 'bg-red-500/[0.0265]';
};

const BASE_COL_COUNT = 9;
const CHAR_COL_COUNT = 4;
const FI_COL_COUNT = 4;

export default function CompetitorVsFirmTable({
  funds,
  isLoading,
  error,
  title = 'Head-to-Head Comparison',
  asOfDate,
  showCharacteristics = false,
  showFICharacteristics = false,
  colorWinningCells = false,
  onNotesOpen,
}: CompetitorVsFirmTableProps) {
  // Group funds by category, preserving original order
  const grouped = useMemo(() => {
    const map = new Map<string, CompetitorComparisonRow[]>();
    for (const fund of funds) {
      const list = map.get(fund.category) ?? [];
      list.push(fund);
      map.set(fund.category, list);
    }
    return Array.from(map.entries());
  }, [funds]);

  return (
    <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div className="relative z-10 px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted">{title}</h3>
          <span className="text-xs text-muted">({funds.length} fund pairs)</span>
        </div>
        {asOfDate && <span className="text-xs text-muted">{asOfDate}</span>}
      </div>

      <div className="relative z-10 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-muted animate-spin mr-2" />
            <span className="text-sm text-muted">Loading comparisons...</span>
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
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-800/95 backdrop-blur-sm border-b border-zinc-700/50">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted uppercase tracking-wider w-[140px] min-w-[140px] max-w-[140px]">Competitor Fund</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted uppercase tracking-wider w-[140px] min-w-[140px] max-w-[140px]">Firm Fund</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider whitespace-normal leading-tight">Net<br />Expense</th>
                {showCharacteristics && (
                  <>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">Holdings</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider whitespace-normal leading-tight">Mkt<br />Cap</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">P/B</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">Prof</th>
                  </>
                )}
                {showFICharacteristics && (
                  <>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">Duration</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider whitespace-normal leading-tight">Sec<br />Yield</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">QTD</th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">YTD</th>
                  </>
                )}
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">1 Yr</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">3 Yr</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider">5 Yr</th>

                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider whitespace-normal leading-tight">Since<br />Common</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted uppercase tracking-wider w-14">Notes</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(([category, categoryFunds]) => (
                <React.Fragment key={category}>
                  {/* Category group header row */}
                  <tr className="bg-zinc-700/20 border-b border-zinc-700/30">
                    <td colSpan={BASE_COL_COUNT + (showCharacteristics ? CHAR_COL_COUNT : 0) + (showFICharacteristics ? FI_COL_COUNT : 0)} className="px-4 py-2">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">{category}</span>
                    </td>
                  </tr>

                  {categoryFunds.map((fund) => (
                    <tr key={fund.id} className="border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors">
                      {/* Competitor Fund */}
                      <td className="px-3 py-3" title={fund.competitorName}>
                        <div className="text-sm font-medium text-red-400">{fund.competitorTicker}</div>
                        <div className="text-xs text-muted truncate max-w-[120px]">{fund.competitorName}</div>
                      </td>

                      {/* Firm Fund */}
                      <td className="px-3 py-3" title={fund.firmName}>
                        <div className="text-sm font-medium text-emerald-400">{fund.firmTicker}</div>
                        <div className="text-xs text-muted truncate max-w-[120px]">{fund.firmName}</div>
                      </td>

                      {/* Expense Ratio */}
                      {(() => {
                        const [avClr, dfClr] = getWinnerColors(fund.firmWinsExpenseRatio);
                        const bg = getCellBg(fund.firmWinsExpenseRatio, colorWinningCells);
                        return (
                          <td className={`px-3 py-3 text-center ${bg}`}>
                            <div className={`text-xs font-medium ${avClr}`}>{fund.competitorExpenseRatio.toFixed(2)}%</div>
                            <div className={`text-xs font-medium ${dfClr}`}>{fund.firmExpenseRatio.toFixed(2)}%</div>
                          </td>
                        );
                      })()}

                      {/* Characteristics columns (equity only) */}
                      {showCharacteristics && (() => {
                        const av = fund.competitorCharacteristics;
                        const df = fund.firmCharacteristics;
                        return (
                          <>
                            {(() => {
                              const avH = av?.holdings;
                              const dfH = df?.holdings;
                              const dfWins = avH != null && dfH != null ? dfH > avH : null;
                              const [avClr, dfClr] = dfWins === true ? ['text-muted', 'text-emerald-400'] : dfWins === false ? ['text-red-400', 'text-muted'] : ['text-muted', 'text-muted'];
                              const bg = getCellBg(dfWins, colorWinningCells);
                              return (
                                <td className={`px-3 py-3 text-center ${bg}`}>
                                  <div className={`text-xs font-medium ${avClr}`}>{avH?.toLocaleString() ?? '-'}</div>
                                  <div className={`text-xs font-medium ${dfClr}`}>{dfH?.toLocaleString() ?? '-'}</div>
                                </td>
                              );
                            })()}
                            {(() => {
                              const parse = (s: string | null | undefined) => {
                                if (!s) return null;
                                const n = parseFloat(s.replace(/[$,]/g, ''));
                                return isNaN(n) ? null : n;
                              };
                              const avVal = parse(av?.marketCap);
                              const dfVal = parse(df?.marketCap);
                              const dfSmaller = avVal != null && dfVal != null ? dfVal < avVal : null;
                              const [avClr, dfClr] = dfSmaller === true ? ['text-muted', 'text-emerald-400'] : dfSmaller === false ? ['text-red-400', 'text-muted'] : ['text-muted', 'text-muted'];
                              const bg = getCellBg(dfSmaller, colorWinningCells);
                              return (
                                <td className={`px-3 py-3 text-center ${bg}`}>
                                  <div className={`text-xs font-medium ${avClr}`}>{av?.marketCap ?? '-'}</div>
                                  <div className={`text-xs font-medium ${dfClr}`}>{df?.marketCap ?? '-'}</div>
                                </td>
                              );
                            })()}
                            {(() => {
                              const avPB = av?.priceToBook;
                              const dfPB = df?.priceToBook;
                              const dfLower = avPB != null && dfPB != null ? dfPB < avPB : null;
                              const [avClr, dfClr] = dfLower === true ? ['text-muted', 'text-emerald-400'] : dfLower === false ? ['text-red-400', 'text-muted'] : ['text-muted', 'text-muted'];
                              const bg = getCellBg(dfLower, colorWinningCells);
                              return (
                                <td className={`px-3 py-3 text-center ${bg}`}>
                                  <div className={`text-xs font-medium ${avClr}`}>{avPB != null ? avPB.toFixed(2) : '-'}</div>
                                  <div className={`text-xs font-medium ${dfClr}`}>{dfPB != null ? dfPB.toFixed(2) : '-'}</div>
                                </td>
                              );
                            })()}
                            {(() => {
                              const avP = av?.profitability;
                              const dfP = df?.profitability;
                              const dfHigher = avP != null && dfP != null ? dfP > avP : null;
                              const [avClr, dfClr] = dfHigher === true ? ['text-muted', 'text-emerald-400'] : dfHigher === false ? ['text-red-400', 'text-muted'] : ['text-muted', 'text-muted'];
                              const bg = getCellBg(dfHigher, colorWinningCells);
                              return (
                                <td className={`px-3 py-3 text-center ${bg}`}>
                                  <div className={`text-xs font-medium ${avClr}`}>{avP != null ? avP.toFixed(2) : '-'}</div>
                                  <div className={`text-xs font-medium ${dfClr}`}>{dfP != null ? dfP.toFixed(2) : '-'}</div>
                                </td>
                              );
                            })()}
                          </>
                        );
                      })()}

                      {/* Fixed income characteristics */}
                      {showFICharacteristics && (() => {
                        const av = fund.competitorCharacteristics;
                        const df = fund.firmCharacteristics;
                        return (
                          <>
                            {(() => {
                              const avD = av?.duration;
                              const dfD = df?.duration;
                              const firmWins = avD != null && dfD != null ? dfD < avD : null;
                              const [avClr, dfClr] = getWinnerColors(firmWins);
                              const bg = getCellBg(firmWins, colorWinningCells);
                              return (
                                <td className={`px-3 py-3 text-center ${bg}`}>
                                  <div className={`text-xs font-medium ${avClr}`}>{avD != null ? `${avD.toFixed(1)} years` : '-'}</div>
                                  <div className={`text-xs font-medium ${dfClr}`}>{dfD != null ? `${dfD.toFixed(1)} years` : '-'}</div>
                                </td>
                              );
                            })()}
                            {(() => {
                              const avY = av?.secYield;
                              const dfY = df?.secYield;
                              const firmWins = avY != null && dfY != null ? dfY > avY : null;
                              const [avClr, dfClr] = getWinnerColors(firmWins);
                              const bg = getCellBg(firmWins, colorWinningCells);
                              return (
                                <td className={`px-3 py-3 text-center ${bg}`}>
                                  <div className={`text-xs font-medium ${avClr}`}>{avY != null ? `${avY.toFixed(2)}%` : '-'}</div>
                                  <div className={`text-xs font-medium ${dfClr}`}>{dfY != null ? `${dfY.toFixed(2)}%` : '-'}</div>
                                </td>
                              );
                            })()}
                            {(() => {
                              const avQ = fund.competitorReturns.qtd ?? null;
                              const dfQ = fund.firmReturns.qtd ?? null;
                              const firmWins = avQ != null && dfQ != null ? dfQ > avQ : null;
                              const [avClr, dfClr] = getWinnerColors(firmWins);
                              const bg = getCellBg(firmWins, colorWinningCells);
                              return (
                                <td className={`px-3 py-3 text-center ${bg}`}>
                                  <div className={`text-xs font-medium ${avClr}`}>{formatReturn(avQ)}</div>
                                  <div className={`text-xs font-medium ${dfClr}`}>{formatReturn(dfQ)}</div>
                                </td>
                              );
                            })()}
                            {(() => {
                              const avY = fund.competitorReturns.ytd ?? null;
                              const dfY = fund.firmReturns.ytd ?? null;
                              const firmWins = avY != null && dfY != null ? dfY > avY : null;
                              const [avClr, dfClr] = getWinnerColors(firmWins);
                              const bg = getCellBg(firmWins, colorWinningCells);
                              return (
                                <td className={`px-3 py-3 text-center ${bg}`}>
                                  <div className={`text-xs font-medium ${avClr}`}>{formatReturn(avY)}</div>
                                  <div className={`text-xs font-medium ${dfClr}`}>{formatReturn(dfY)}</div>
                                </td>
                              );
                            })()}
                          </>
                        );
                      })()}

                      {/* 1 Yr */}
                      {(() => {
                        const [avClr, dfClr] = getWinnerColors(fund.firmWinsOneYear);
                        const bg = getCellBg(fund.firmWinsOneYear, colorWinningCells);
                        return (
                          <td className={`px-3 py-3 text-center ${bg}`}>
                            <div className={`text-xs font-medium ${avClr}`}>{formatReturn(fund.competitorReturns.oneYear)}</div>
                            <div className={`text-xs font-medium ${dfClr}`}>{formatReturn(fund.firmReturns.oneYear)}</div>
                          </td>
                        );
                      })()}

                      {/* 3 Yr */}
                      {(() => {
                        const [avClr, dfClr] = getWinnerColors(fund.firmWinsThreeYear);
                        const bg = getCellBg(fund.firmWinsThreeYear, colorWinningCells);
                        return (
                          <td className={`px-3 py-3 text-center ${bg}`}>
                            <div className={`text-xs font-medium ${avClr}`}>{formatReturn(fund.competitorReturns.threeYear)}</div>
                            <div className={`text-xs font-medium ${dfClr}`}>{formatReturn(fund.firmReturns.threeYear)}</div>
                          </td>
                        );
                      })()}

                      {/* 5 Yr */}
                      {(() => {
                        const [avClr, dfClr] = getWinnerColors(fund.firmWinsFiveYear);
                        const bg = getCellBg(fund.firmWinsFiveYear, colorWinningCells);
                        return (
                          <td className={`px-3 py-3 text-center ${bg}`}>
                            <div className={`text-xs font-medium ${avClr}`}>{formatReturn(fund.competitorReturns.fiveYear)}</div>
                            <div className={`text-xs font-medium ${dfClr}`}>{formatReturn(fund.firmReturns.fiveYear)}</div>
                          </td>
                        );
                      })()}

                      {/* Since Common Inception */}
                      {(() => {
                        const [avClr, dfClr] = getWinnerColors(fund.firmWinsSinceInception);
                        const bg = getCellBg(fund.firmWinsSinceInception, colorWinningCells);
                        return (
                          <td className={`px-3 py-3 text-center ${bg}`}>
                            <div className={`text-xs font-medium ${avClr}`}>{formatReturn(fund.competitorReturns.sinceCommonInception ?? null)}</div>
                            <div className={`text-xs font-medium ${dfClr}`}>{formatReturn(fund.firmReturns.sinceCommonInception ?? null)}</div>
                            <div className="text-[10px] text-muted mt-0.5">{fund.commonInceptionDate}</div>
                          </td>
                        );
                      })()}

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
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

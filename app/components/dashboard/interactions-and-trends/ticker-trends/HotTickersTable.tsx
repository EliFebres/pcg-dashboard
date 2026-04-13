'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Download, FileText, ExternalLink, ChevronDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { TICKER_TYPE_OPTIONS, type TickerType } from '@/app/lib/api/ticker-trends';
import type { HotTicker } from '@/app/lib/types/trends';

interface HotTickersTableProps {
  tickers: HotTicker[];
  isLoading: boolean;
  error: string | null;
  onTypeChange: (ticker: string, newType: TickerType) => void;
  onNotesOpen: (ticker: HotTicker) => void;
  onTalkingPointsOpen: (ticker: HotTicker) => void;
  onPCROpen: (ticker: HotTicker) => void;
}

const getTypeStyle = (type: string): string => {
  switch (type) {
    case 'Replacement':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    case 'Challenging':
      return 'bg-red-500/15 text-red-400 border border-red-500/30';
    case 'Complement':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    default:
      return 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30';
  }
};

export default function HotTickersTable({
  tickers,
  isLoading,
  error,
  onTypeChange,
  onNotesOpen,
  onTalkingPointsOpen,
  onPCROpen,
}: HotTickersTableProps) {
  const [openTypeDropdown, setOpenTypeDropdown] = useState<string | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setOpenTypeDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeChange = (ticker: string, newType: TickerType) => {
    setOpenTypeDropdown(null);
    onTypeChange(ticker, newType);
  };

  return (
    <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 p-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-white">Hot Tickers & Firm Competitors</h4>
            <p className="text-xs text-zinc-500">Most requested non-firm tickers with comparable firm funds</p>
          </div>
          <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-cyan-400 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="relative z-10 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="ml-2 text-sm text-zinc-400">Loading hot tickers...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-red-400">{error}</span>
          </div>
        ) : tickers.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-zinc-500">No tickers found</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800/30">
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">#</th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Competitor Ticker</th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 w-0">Requests</th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Firm Alternative</th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">1YR Return Δ</th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">AUM</th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Flows</th>
                <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Expense Ratio</th>
                <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Notes</th>
                <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Talking Pts</th>
                <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">PCR</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {tickers.map((ticker) => (
                <tr key={ticker.rank} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-zinc-500">{ticker.rank}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative" ref={openTypeDropdown === ticker.ticker ? typeDropdownRef : null}>
                      <button
                        onClick={() => setOpenTypeDropdown(openTypeDropdown === ticker.ticker ? null : ticker.ticker)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 cursor-pointer hover:ring-1 hover:ring-white/20 transition-all ${getTypeStyle(ticker.type)}`}
                      >
                        {ticker.type}
                        <ChevronDown className={`w-3 h-3 transition-transform ${openTypeDropdown === ticker.ticker ? 'rotate-180' : ''}`} />
                      </button>
                      {openTypeDropdown === ticker.ticker && (
                        <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 shadow-xl z-50 min-w-[130px] overflow-hidden">
                          {TICKER_TYPE_OPTIONS.map((type) => (
                            <button
                              key={type}
                              onClick={() => handleTypeChange(ticker.ticker, type)}
                              className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                                ticker.type === type
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'text-zinc-300 hover:bg-zinc-700/50'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-bold text-cyan-400">{ticker.ticker}</span>
                      <p className="text-xs text-zinc-500">{ticker.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-zinc-200">{ticker.requests}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-bold text-amber-400">{ticker.firmCompetitor}</span>
                      <p className="text-xs text-zinc-500">{ticker.firmName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-medium font-mono ${
                        ticker.returnComparison.delta.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {ticker.returnComparison.delta}
                    </span>
                    <p className="text-xs text-zinc-500">
                      {ticker.returnComparison.competitor}% vs {ticker.returnComparison.firm}%
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-300">
                      <span className="text-cyan-400">${ticker.aum.competitor}</span>
                      <span className="text-zinc-500"> vs </span>
                      <span className="text-amber-400">${ticker.aum.firm}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-300">
                      <span className="inline-flex items-center text-cyan-400">
                        {ticker.flows.competitor.startsWith('+') ? (
                          <ArrowUp className="w-3 h-3 text-emerald-400 mr-0.5" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-red-400 mr-0.5" />
                        )}
                        {ticker.flows.competitor}
                      </span>
                      <span className="text-zinc-500"> vs </span>
                      <span className="inline-flex items-center text-amber-400">
                        {ticker.flows.firm.startsWith('+') ? (
                          <ArrowUp className="w-3 h-3 text-emerald-400 mr-0.5" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-red-400 mr-0.5" />
                        )}
                        {ticker.flows.firm}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-300">
                      <span className="text-cyan-400">{ticker.expenseRatio.competitor}%</span>
                      <span className="text-zinc-500"> vs </span>
                      <span className="text-amber-400">{ticker.expenseRatio.firm}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onNotesOpen(ticker)}
                      className={`p-1.5 transition-colors ${
                        ticker.notes
                          ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400'
                          : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300'
                      }`}
                      title={ticker.notes ? 'View/edit notes' : 'Add notes'}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onTalkingPointsOpen(ticker)}
                      className={`p-1.5 transition-colors ${
                        ticker.talkingPointsUrl
                          ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400'
                          : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300'
                      }`}
                      title={ticker.talkingPointsUrl ? 'View/edit talking points link' : 'Add talking points link'}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onPCROpen(ticker)}
                      className={`p-1.5 transition-colors ${
                        ticker.pcrUrl
                          ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400'
                          : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300'
                      }`}
                      title={ticker.pcrUrl ? 'View/edit PCR link' : 'Add PCR link'}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

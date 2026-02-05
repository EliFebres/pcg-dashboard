'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Check, Activity, Loader2 } from 'lucide-react';
import type { HotTicker } from '@/app/lib/types/trends';

interface FundDetailCardProps {
  tickers: HotTicker[];
  isLoading: boolean;
}

function FundDetailCard({ tickers, isLoading }: FundDetailCardProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Default to first ticker when tickers change
  useEffect(() => {
    if (tickers.length > 0 && (!selectedTicker || !tickers.find((t) => t.ticker === selectedTicker))) {
      setSelectedTicker(tickers[0].ticker);
    }
  }, [tickers, selectedTicker]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedFund = useMemo(
    () => tickers.find((t) => t.ticker === selectedTicker) ?? null,
    [tickers, selectedTicker]
  );

  const { currentQ, prevQ, qoqChange, avgQoqChange, deviation } = useMemo(() => {
    if (!selectedFund?.quarterlyRequests || selectedFund.quarterlyRequests.length < 2) {
      return { currentQ: 0, prevQ: 0, qoqChange: 0, avgQoqChange: 0, deviation: 0 };
    }

    const qData = selectedFund.quarterlyRequests;
    const curr = qData[qData.length - 1].requests;
    const prev = qData[qData.length - 2].requests;
    const change = prev !== 0 ? ((curr - prev) / prev) * 100 : 0;

    // Compute average QoQ across all tickers with quarterly data
    const allChanges: number[] = [];
    for (const t of tickers) {
      if (t.quarterlyRequests && t.quarterlyRequests.length >= 2) {
        const tCurr = t.quarterlyRequests[t.quarterlyRequests.length - 1].requests;
        const tPrev = t.quarterlyRequests[t.quarterlyRequests.length - 2].requests;
        if (tPrev !== 0) {
          allChanges.push(((tCurr - tPrev) / tPrev) * 100);
        }
      }
    }
    const avg = allChanges.length > 0 ? allChanges.reduce((a, b) => a + b, 0) / allChanges.length : 0;

    return {
      currentQ: curr,
      prevQ: prev,
      qoqChange: Math.round(change),
      avgQoqChange: Math.round(avg),
      deviation: Math.round(change - avg),
    };
  }, [selectedFund, tickers]);

  const prevQuarterLabel = useMemo(() => {
    if (!selectedFund?.quarterlyRequests || selectedFund.quarterlyRequests.length < 2) return '';
    return selectedFund.quarterlyRequests[selectedFund.quarterlyRequests.length - 2].quarter;
  }, [selectedFund]);

  const narrative = useMemo(() => {
    if (!selectedFund) return '';
    const label = `${selectedFund.name} (${selectedFund.ticker})`;
    const absDev = Math.abs(deviation);
    const devDirection = deviation > 0 ? 'higher than' : 'lower than';
    const devClause = deviation !== 0
      ? `, which is ${absDev}% ${devDirection} the average change across all top 10 funds`
      : ', which is in line with the average across all top 10 funds';
    if (qoqChange > 0) {
      return `${label} has grown in requests by ${qoqChange}% quarter-over-quarter, up from ${prevQ} requests in ${prevQuarterLabel}${devClause}.`;
    } else if (qoqChange < 0) {
      return `${label} has decreased in requests by ${Math.abs(qoqChange)}% quarter-over-quarter, down from ${prevQ} requests in ${prevQuarterLabel}${devClause}.`;
    }
    return `${label} has held steady in requests quarter-over-quarter, unchanged from ${prevQ} requests in ${prevQuarterLabel}${devClause}.`;
  }, [selectedFund, qoqChange, prevQ, prevQuarterLabel, deviation]);

  if (isLoading) {
    return (
      <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-zinc-500" />
            <h4 className="text-sm font-medium text-zinc-500">Request Frequency</h4>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-center" style={{ height: 310 }}>
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="ml-2 text-sm text-zinc-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (tickers.length === 0) {
    return (
      <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-zinc-500" />
            <h4 className="text-sm font-medium text-zinc-500">Request Frequency</h4>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-center" style={{ height: 310 }}>
          <span className="text-sm text-zinc-500">No tickers available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 flex flex-col" style={{ height: 350 }}>
        {/* Top Section — two-column layout */}
        <div className="bg-gradient-to-b from-zinc-950 to-zinc-800/40 px-4 pt-3 pb-3 flex flex-row-reverse shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)]">
          {/* Right column — dropdown (20%) */}
          <div className="w-1/5 flex items-start justify-end pt-1" ref={dropdownRef}>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative overflow-hidden flex items-center gap-2 px-4 py-1.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white transition-colors"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {selectedTicker}
                  <ChevronDown className={`w-4 h-4 text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </span>
                {!dropdownOpen && (
                  <span
                    className="absolute inset-0 pointer-events-none animate-[shine_3s_ease-in-out_infinite]"
                    style={{
                      background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)',
                    }}
                  />
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-1 bg-zinc-800 border border-zinc-700 shadow-xl z-50 min-w-[120px] overflow-hidden max-h-60 overflow-y-auto">
                  {tickers.map((t) => (
                    <button
                      key={t.ticker}
                      onClick={() => {
                        setSelectedTicker(t.ticker);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                        t.ticker === selectedTicker
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-zinc-300 hover:bg-zinc-700/50'
                      }`}
                    >
                      <span>{t.ticker}</span>
                      {t.ticker === selectedTicker && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — content (80%) */}
          <div className="w-4/5 flex flex-col">
            {/* Top — title */}
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              <h4 className="text-xs font-medium text-zinc-500">Request Frequency</h4>
            </div>

            {/* Middle — hero metric */}
            <div className="flex items-end gap-3 flex-wrap mt-1" style={{ transform: 'scale(0.95)', transformOrigin: 'left bottom' }}>
              <div className="relative">
                <span className="text-8xl font-bold text-white">{currentQ}</span>
                {/* QoQ Badge — superscript */}
                <span className={`absolute top-2 -right-2 translate-x-full whitespace-nowrap inline-flex items-center text-base px-2 py-0.5 font-medium ${
                  qoqChange > 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : qoqChange < 0
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {qoqChange > 0 ? '+' : ''}{qoqChange}% QoQ
                </span>
              </div>
              <span className="text-xl text-zinc-500 mb-2">requests</span>
            </div>

            {/* Bottom — narrative */}
            <p className="leading-relaxed mt-1.5" style={{ fontSize: '0.7875rem', color: '#8b8b98' }}>{narrative}</p>
          </div>
        </div>

        {/* Bottom Half — placeholder */}
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-zinc-600">Additional details coming soon</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(FundDetailCard);

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Building2, MoreHorizontal, Download, Flame, FileText, ExternalLink, Loader2, ChevronDown } from 'lucide-react';
import {
  getHotTickers,
  getTickerTrendsFilterOptions,
  updateHotTickerType,
  updateHotTickerNotes,
  updateHotTickerTalkingPoints,
  updateHotTickerPCR,
  TICKER_TYPE_OPTIONS,
  type FilterOptions,
  type TickerType,
} from '@/app/lib/api/ticker-trends';
import type { HotTicker } from '@/app/lib/types/trends';
import DashboardHeader from '@/app/components/DashboardHeader';
import NotesModal from '@/app/components/pages/shared/NotesModal';
import LinkModal from '@/app/components/pages/shared/LinkModal';

export default function TickerTrendsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [period, setPeriod] = useState('1Y');

  // Data state
  const [hotTickers, setHotTickers] = useState<HotTicker[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departments: ['All Departments'],
    periods: ['1Y'],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown state
  const [openTypeDropdown, setOpenTypeDropdown] = useState<string | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [notesModalTicker, setNotesModalTicker] = useState<HotTicker | null>(null);
  const [talkingPointsModalTicker, setTalkingPointsModalTicker] = useState<HotTicker | null>(null);
  const [pcrModalTicker, setPcrModalTicker] = useState<HotTicker | null>(null);

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

  // Fetch filter options on mount
  useEffect(() => {
    getTickerTrendsFilterOptions().then(setFilterOptions);
  }, []);

  // Fetch hot tickers data
  const fetchHotTickers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getHotTickers({
        department: departmentFilter,
        period,
      });
      setHotTickers(response.tickers);
    } catch (err) {
      setError('Failed to load hot tickers data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [departmentFilter, period]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchHotTickers();
  }, [fetchHotTickers]);

  // Filter tickers by search query (client-side for instant feedback)
  const filteredTickers = searchQuery
    ? hotTickers.filter(
        (t) =>
          t.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.dfaCompetitor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.dfaName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : hotTickers;

  // Optimistic update for ticker type
  const handleTypeChange = useCallback(async (ticker: string, newType: TickerType) => {
    // Store previous state for rollback
    const previousTickers = hotTickers;

    // Optimistically update the UI
    setHotTickers((prev) =>
      prev.map((t) => (t.ticker === ticker ? { ...t, type: newType } : t))
    );
    setOpenTypeDropdown(null);

    try {
      // Send update to API
      await updateHotTickerType(ticker, newType);
    } catch (err) {
      // Rollback on error
      console.error('Failed to update ticker type:', err);
      setHotTickers(previousTickers);
    }
  }, [hotTickers]);

  // Optimistic update for ticker notes
  const handleNotesChange = useCallback(async (ticker: string, notes: string) => {
    // Store previous state for rollback
    const previousTickers = hotTickers;

    // Optimistically update the UI
    setHotTickers((prev) =>
      prev.map((t) => (t.ticker === ticker ? { ...t, notes } : t))
    );

    try {
      // Send update to API
      await updateHotTickerNotes(ticker, notes);
    } catch (err) {
      // Rollback on error
      console.error('Failed to update ticker notes:', err);
      setHotTickers(previousTickers);
    }
  }, [hotTickers]);

  // Optimistic update for talking points URL
  const handleTalkingPointsChange = useCallback(async (ticker: string, talkingPointsUrl: string) => {
    // Store previous state for rollback
    const previousTickers = hotTickers;

    // Optimistically update the UI
    setHotTickers((prev) =>
      prev.map((t) => (t.ticker === ticker ? { ...t, talkingPointsUrl } : t))
    );

    try {
      // Send update to API
      await updateHotTickerTalkingPoints(ticker, talkingPointsUrl);
    } catch (err) {
      // Rollback on error
      console.error('Failed to update talking points:', err);
      setHotTickers(previousTickers);
    }
  }, [hotTickers]);

  // Optimistic update for PCR URL
  const handlePCRChange = useCallback(async (ticker: string, pcrUrl: string) => {
    // Store previous state for rollback
    const previousTickers = hotTickers;

    // Optimistically update the UI
    setHotTickers((prev) =>
      prev.map((t) => (t.ticker === ticker ? { ...t, pcrUrl } : t))
    );

    try {
      // Send update to API
      await updateHotTickerPCR(ticker, pcrUrl);
    } catch (err) {
      // Rollback on error
      console.error('Failed to update PCR:', err);
      setHotTickers(previousTickers);
    }
  }, [hotTickers]);

  // Get style for type badge
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

  return (
    <>
      {/* Top Bar with Filters */}
      <DashboardHeader
        title="Ticker Trends"
        subtitle="Popular tickers and DFA comparisons"
        searchPlaceholder="Search tickers, funds..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'department',
            icon: Building2,
            label: 'Department',
            options: filterOptions.departments,
            value: departmentFilter,
            onChange: (v: string | string[]) => setDepartmentFilter(v as string),
          },
        ]}
        period={period}
        onPeriodChange={setPeriod}
        periodOptions={filterOptions.periods}
        className="sticky top-0 z-10"
      />

      <div className="p-6 space-y-6">
        {/* ==================== TOP 10 HOT TICKERS ==================== */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Top 10 Hot Tickers & DFA Competitors</h3>
            <span className="text-xs text-zinc-500 ml-2">Most requested non-DFA tickers with comparable DFA funds</span>
          </div>

          {/* Hot Tickers Table */}
          <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="relative z-10 p-4 border-b border-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Hot Tickers & DFA Competitors</h4>
                  <p className="text-xs text-zinc-500">Most requested non-DFA tickers with comparable DFA funds</p>
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
              ) : filteredTickers.length === 0 ? (
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
                      <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Requests</th>
                      <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">DFA Alternative</th>
                      <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">1YR Return Δ</th>
                      <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">AUM</th>
                      <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Expense Ratio</th>
                      <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Notes</th>
                      <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Talking Pts</th>
                      <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">PCR</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredTickers.map((ticker) => (
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-200">{ticker.requests}</span>
                            <span className={`text-xs ${ticker.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                              {ticker.trend}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm font-bold text-amber-400">{ticker.dfaCompetitor}</span>
                            <p className="text-xs text-zinc-500">{ticker.dfaName}</p>
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
                            {ticker.returnComparison.competitor}% vs {ticker.returnComparison.dfa}%
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-zinc-300">
                            <span className="text-cyan-400">${ticker.aum.competitor}</span>
                            <span className="text-zinc-500"> vs </span>
                            <span className="text-amber-400">${ticker.aum.dfa}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-zinc-300">
                            <span className="text-cyan-400">{ticker.expenseRatio.competitor}%</span>
                            <span className="text-zinc-500"> vs </span>
                            <span className="text-amber-400">{ticker.expenseRatio.dfa}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setNotesModalTicker(ticker)}
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
                            onClick={() => setTalkingPointsModalTicker(ticker)}
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
                            onClick={() => setPcrModalTicker(ticker)}
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
        </div>
      </div>

      {/* Notes Modal */}
      <NotesModal
        isOpen={notesModalTicker !== null}
        onClose={() => setNotesModalTicker(null)}
        title="Ticker Notes"
        subtitle={
          <>
            <span className="text-cyan-400 font-medium">{notesModalTicker?.ticker}</span>
            <span className="text-zinc-500 mx-1">·</span>
            {notesModalTicker?.name}
          </>
        }
        currentNotes={notesModalTicker?.notes ?? ''}
        onSave={(notes) => {
          if (notesModalTicker) {
            handleNotesChange(notesModalTicker.ticker, notes);
          }
        }}
        placeholder="Add notes about this ticker comparison..."
      />

      {/* Talking Points Modal */}
      <LinkModal
        isOpen={talkingPointsModalTicker !== null}
        onClose={() => setTalkingPointsModalTicker(null)}
        title="Talking Points Link"
        label="Internal Link URL"
        ticker={talkingPointsModalTicker?.ticker ?? ''}
        tickerName={talkingPointsModalTicker?.name ?? ''}
        currentUrl={talkingPointsModalTicker?.talkingPointsUrl ?? ''}
        onSave={handleTalkingPointsChange}
        placeholder="https://internal.site/talking-points/..."
      />

      {/* PCR Modal */}
      <LinkModal
        isOpen={pcrModalTicker !== null}
        onClose={() => setPcrModalTicker(null)}
        title="Product Comparison Report"
        label="PCR Document Link"
        ticker={pcrModalTicker?.ticker ?? ''}
        tickerName={pcrModalTicker?.name ?? ''}
        currentUrl={pcrModalTicker?.pcrUrl ?? ''}
        onSave={handlePCRChange}
        placeholder="https://internal.site/pcr/..."
      />
    </>
  );
}

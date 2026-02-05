'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Flame, Loader2 } from 'lucide-react';
import {
  getHotTickers,
  getTickerTrendsFilterOptions,
  updateHotTickerType,
  updateHotTickerNotes,
  updateHotTickerTalkingPoints,
  updateHotTickerPCR,
  type FilterOptions,
  type TickerType,
} from '@/app/lib/api/ticker-trends';
import type { HotTicker } from '@/app/lib/types/trends';
import DashboardHeader from '@/app/components/DashboardHeader';
import NotesModal from '@/app/components/pages/shared/NotesModal';
import LinkModal from '@/app/components/pages/shared/LinkModal';
import HotTickersTable from '@/app/components/pages/ticker-trends/HotTickersTable';
import RequestBreakdownChart from '@/app/components/pages/ticker-trends/RequestBreakdownChart';
import FundFrequencyCard from '@/app/components/pages/ticker-trends/FundFrequencyCard';

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

  // Modal state
  const [notesModalTicker, setNotesModalTicker] = useState<HotTicker | null>(null);
  const [talkingPointsModalTicker, setTalkingPointsModalTicker] = useState<HotTicker | null>(null);
  const [pcrModalTicker, setPcrModalTicker] = useState<HotTicker | null>(null);

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
          <HotTickersTable
            tickers={filteredTickers}
            isLoading={isLoading}
            error={error}
            onTypeChange={handleTypeChange}
            onNotesOpen={setNotesModalTicker}
            onTalkingPointsOpen={setTalkingPointsModalTicker}
            onPCROpen={setPcrModalTicker}
          />
        </div>

        {/* ==================== CHARTS ROW ==================== */}
        <div className="grid grid-cols-2 gap-6">
          {/* Request Breakdown Chart */}
          <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="relative z-10 p-4 border-b border-zinc-800/50">
              <h4 className="text-sm font-medium text-white">Top 10 Hot Tickers Request Breakdown by Ticker</h4>
              <p className="text-xs text-zinc-500">Distribution of request types across top tickers</p>
            </div>
            <div className="relative z-10 p-4" style={{ height: 420 }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  <span className="ml-2 text-sm text-zinc-400">Loading chart...</span>
                </div>
              ) : (
                <RequestBreakdownChart tickers={filteredTickers} />
              )}
            </div>
          </div>

          {/* Fund Frequency Card */}
          <FundFrequencyCard tickers={filteredTickers} isLoading={isLoading} />
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

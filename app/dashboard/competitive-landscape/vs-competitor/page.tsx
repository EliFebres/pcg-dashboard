'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardHeader from '@/app/components/dashboard/shared/DashboardHeader';
import CompetitorVsFirmTable from '@/app/components/dashboard/competitive-landscape/CompetitorVsFirmTable';
import CompetitiveNotesModal from '@/app/components/dashboard/competitive-landscape/CompetitiveNotesModal';
import { getCompetitorComparisons } from '@/app/lib/api/competitive';
import type { CompetitorComparisonRow } from '@/app/lib/types/competitive';

const FI_CATEGORIES = new Set(['Core', 'Short-Term']);

export default function VsCompetitorPage() {
  const [funds, setFunds] = useState<CompetitorComparisonRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notesFund, setNotesFund] = useState<CompetitorComparisonRow | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCompetitorComparisons();
      setFunds(response.funds);
    } catch (err) {
      setError('Failed to load competitor comparisons');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredFunds = useMemo(() => {
    if (!searchQuery) return funds;
    const q = searchQuery.toLowerCase();
    return funds.filter(
      f =>
        f.competitorTicker.toLowerCase().includes(q) ||
        f.competitorName.toLowerCase().includes(q) ||
        f.firmTicker.toLowerCase().includes(q) ||
        f.firmName.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [funds, searchQuery]);

  const equityFunds = useMemo(() => filteredFunds.filter(f => !FI_CATEGORIES.has(f.category)), [filteredFunds]);
  const fixedIncomeFunds = useMemo(() => filteredFunds.filter(f => FI_CATEGORIES.has(f.category)), [filteredFunds]);

  const handleNoteAdded = useCallback(() => {
    if (!notesFund) return;
    setFunds(prev =>
      prev.map(f => f.id === notesFund.id ? { ...f, noteCount: f.noteCount + 1 } : f)
    );
    setNotesFund(prev => prev ? { ...prev, noteCount: prev.noteCount + 1 } : null);
  }, [notesFund]);

  const handleNoteDeleted = useCallback(() => {
    if (!notesFund) return;
    setFunds(prev =>
      prev.map(f => f.id === notesFund.id ? { ...f, noteCount: Math.max(0, f.noteCount - 1) } : f)
    );
    setNotesFund(prev => prev ? { ...prev, noteCount: Math.max(0, prev.noteCount - 1) } : null);
  }, [notesFund]);

  return (
    <>
      <DashboardHeader
        title="Firm vs. Competitor"
        subtitle="Head-to-head fund performance comparison with color-coded results"
        searchPlaceholder="Search funds, tickers..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[]}
      />

      <div className="p-6 space-y-6">
        <CompetitorVsFirmTable
          funds={equityFunds}
          isLoading={isLoading}
          error={error}
          title="Equity Head-to-Head"
          asOfDate="Characteristics as of March 31, 2026 | Performance as of March 31, 2026"
          showCharacteristics={true}
          colorWinningCells={true}
          onNotesOpen={setNotesFund}
        />

        <CompetitorVsFirmTable
          funds={fixedIncomeFunds}
          isLoading={isLoading}
          error={error}
          title="Fixed Income Head-to-Head"
          asOfDate="Characteristics as of March 31, 2026 | Performance as of March 31, 2026"
          showFICharacteristics={true}
          colorWinningCells={true}
          onNotesOpen={setNotesFund}
        />
      </div>

      <CompetitiveNotesModal
        isOpen={notesFund !== null}
        onClose={() => setNotesFund(null)}
        title="Competitor Comparison Notes"
        subtitle={
          notesFund ? (
            <>
              <span className="text-red-400 font-medium">{notesFund.competitorTicker}</span>
              <span className="text-zinc-500 mx-1">vs</span>
              <span className="text-emerald-400 font-medium">{notesFund.firmTicker}</span>
              <span className="text-zinc-500 mx-1">&middot;</span>
              <span className="text-zinc-500">{notesFund.category}</span>
            </>
          ) : <></>
        }
        fundId={notesFund?.id ?? ''}
        onNoteAdded={handleNoteAdded}
        onNoteDeleted={handleNoteDeleted}
      />
    </>
  );
}

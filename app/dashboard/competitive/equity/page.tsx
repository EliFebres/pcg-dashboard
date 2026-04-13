'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layers } from 'lucide-react';
import DashboardHeader from '@/app/components/DashboardHeader';
import CompetitorTable from '@/app/components/pages/competitive/CompetitorTable';
import CompetitiveNotesModal from '@/app/components/pages/competitive/CompetitiveNotesModal';
import { getEquityComparisons } from '@/app/lib/api/competitive';
import type { FundComparisonRow, FundCategory } from '@/app/lib/types/competitive';

const EQUITY_CATEGORIES: FundCategory[] = [
  'US Equity',
  'Dev Ex US Equity',
  'Emerging Markets Equity',
  'Global Equity',
  'Real Estate',
];

export default function EquityCompetitorsPage() {
  const [funds, setFunds] = useState<FundComparisonRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [notesFund, setNotesFund] = useState<FundComparisonRow | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getEquityComparisons();
      setFunds(response.funds);
    } catch (err) {
      setError('Failed to load equity comparisons');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredFunds = useMemo(() => {
    let result = funds;
    if (categoryFilter !== 'All Categories') {
      result = result.filter(f => f.category === categoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        f =>
          f.competitorTicker.toLowerCase().includes(q) ||
          f.competitorName.toLowerCase().includes(q) ||
          f.firmTicker.toLowerCase().includes(q) ||
          f.firmName.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [funds, categoryFilter, searchQuery]);

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
        title="Equity Fund Comparisons"
        subtitle="Firm vs. competitor equity fund analysis ranked by competitive advantage"
        searchPlaceholder="Search funds, tickers, categories..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'category',
            icon: Layers,
            label: 'Category',
            options: ['All Categories', ...EQUITY_CATEGORIES],
            value: categoryFilter,
            onChange: (v) => setCategoryFilter(v as string),
          },
        ]}
      />

      <div className="p-6 space-y-6">
        <CompetitorTable
          funds={filteredFunds}
          isLoading={isLoading}
          error={error}
          showPriceToBook={true}
          onNotesOpen={setNotesFund}
        />
      </div>

      <CompetitiveNotesModal
        isOpen={notesFund !== null}
        onClose={() => setNotesFund(null)}
        title="Fund Comparison Notes"
        subtitle={
          notesFund ? (
            <>
              <span className="text-cyan-400 font-medium">{notesFund.competitorTicker}</span>
              <span className="text-zinc-500 mx-1">vs</span>
              <span className="text-amber-400 font-medium">{notesFund.firmTicker}</span>
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

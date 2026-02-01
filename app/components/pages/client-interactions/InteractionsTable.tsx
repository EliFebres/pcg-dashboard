'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FileText, Download, Check, X, ChevronUp, ChevronDown, ChevronsUpDown, Maximize2, Minimize2, Plus, DollarSign } from 'lucide-react';
import NotesModal from '../shared/NotesModal';
import NNAModal from '../shared/NNAModal';
import type { Engagement } from '@/app/lib/types/engagements';

// Sort configuration types
type SortDirection = 'asc' | 'desc' | null;
type SortColumn =
  | 'externalClient'
  | 'internalClient'
  | 'intakeType'
  | 'type'
  | 'teamMembers'
  | 'dateStarted'
  | 'dateFinished'
  | 'portfolioLogged'
  | 'nna'
  | 'status'
  | null;

interface SortConfig {
  column: SortColumn;
  direction: SortDirection;
}

// Sortable column header component
interface SortableHeaderProps {
  label: string;
  column: SortColumn;
  currentSort: SortConfig;
  onSort: (column: SortColumn) => void;
  centered?: boolean;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, column, currentSort, onSort, centered }) => {
  const isActive = currentSort.column === column;

  return (
    <th
      onClick={() => onSort(column)}
      className={`${centered ? 'text-center' : 'text-left'} text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200 transition-colors select-none group`}
    >
      <div className={`flex items-center gap-1 ${centered ? 'justify-center' : ''}`}>
        {label}
        <span className="inline-flex">
          {isActive ? (
            currentSort.direction === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            )
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          )}
        </span>
      </div>
    </th>
  );
};

interface InteractionsTableProps {
  engagements: Engagement[];
  onStatusChange: (engagementId: number, newStatus: string) => void;
  onNotesChange: (engagementId: number, notes: string) => void;
  onNNAChange: (engagementId: number, nna: number | undefined) => void;
  onRowClick: (engagement: Engagement) => void;
}

const InteractionsTable: React.FC<InteractionsTableProps> = ({ engagements, onStatusChange, onNotesChange, onNNAChange, onRowClick }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'dateStarted', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);
  const [notesModalEngagement, setNotesModalEngagement] = useState<Engagement | null>(null);
  const [nnaModalEngagement, setNnaModalEngagement] = useState<Engagement | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const statusOptions = ['In Progress', 'Pending', 'Completed'];

  // Close status dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setOpenStatusDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle column sort
  const handleSort = useCallback((column: SortColumn) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        if (prev.direction === 'asc') return { column, direction: 'desc' };
        if (prev.direction === 'desc') return { column: null, direction: null };
      }
      return { column, direction: 'asc' };
    });
  }, []);

  // Sort engagements based on current sort config
  const sortedEngagements = useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) return engagements;

    return [...engagements].sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;

      switch (sortConfig.column) {
        case 'externalClient': {
          const aVal = a.externalClient ?? '';
          const bVal = b.externalClient ?? '';
          return aVal.localeCompare(bVal) * direction;
        }
        case 'internalClient':
          return a.internalClient.name.localeCompare(b.internalClient.name) * direction;
        case 'intakeType':
          return a.intakeType.localeCompare(b.intakeType) * direction;
        case 'type':
          return a.type.localeCompare(b.type) * direction;
        case 'teamMembers':
          return (a.teamMembers.length - b.teamMembers.length) * direction;
        case 'dateStarted': {
          const aDate = new Date(a.dateStarted);
          const bDate = new Date(b.dateStarted);
          return (aDate.getTime() - bDate.getTime()) * direction;
        }
        case 'dateFinished': {
          if (a.dateFinished === '—' && b.dateFinished === '—') return 0;
          if (a.dateFinished === '—') return direction;
          if (b.dateFinished === '—') return -direction;
          const aDate = new Date(a.dateFinished);
          const bDate = new Date(b.dateFinished);
          return (aDate.getTime() - bDate.getTime()) * direction;
        }
        case 'portfolioLogged':
          return ((a.portfolioLogged ? 1 : 0) - (b.portfolioLogged ? 1 : 0)) * direction;
        case 'nna': {
          const aNNA = a.nna || 0;
          const bNNA = b.nna || 0;
          return (aNNA - bNNA) * direction;
        }
        case 'status': {
          const statusOrder: Record<string, number> = { 'In Progress': 0, 'Pending': 1, 'Completed': 2 };
          const aOrder = statusOrder[a.status] ?? 3;
          const bOrder = statusOrder[b.status] ?? 3;
          return (aOrder - bOrder) * direction;
        }
        default:
          return 0;
      }
    });
  }, [engagements, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedEngagements.length / pageSize);
  const paginatedEngagements = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedEngagements.slice(startIndex, startIndex + pageSize);
  }, [sortedEngagements, currentPage]);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [engagements.length, sortConfig]);

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }
    return pages;
  };

  // Style helpers
  const getStatusStyle = (status: string): string => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Pending': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
  };

  const getTypeStyle = (type: string): string => {
    switch (type) {
      case 'Data Request': return 'bg-cyan-500/15 text-cyan-400';
      case 'Meeting': return 'bg-violet-500/15 text-violet-400';
      case 'Follow-Up': return 'bg-amber-500/15 text-amber-400';
      case 'PCR': return 'bg-rose-500/15 text-rose-400';
      case 'Other': return 'bg-zinc-500/15 text-zinc-400';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  const getIntakeTypeStyle = (intakeType: string): string => {
    switch (intakeType) {
      case 'IRQ': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'GRRF': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'GCG Ad-Hoc': return 'bg-pink-500/15 text-pink-400 border border-pink-500/30';
      default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30';
    }
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const formatTableNNA = (value: number | undefined): string => {
    if (!value || value === 0) return '—';
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(0)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Render table row
  const renderTableRow = (engagement: Engagement, keyPrefix: string = '') => (
    <tr
      key={`${keyPrefix}${engagement.id}`}
      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
      onClick={() => onRowClick(engagement)}
    >
      <td className="px-4 py-3">
        <span className={`text-sm font-medium ${engagement.externalClient ? 'text-zinc-200' : 'text-zinc-600'}`}>
          {engagement.externalClient ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div>
          <span className="text-sm font-medium text-zinc-200">{engagement.internalClient.name}</span>
          <p className="text-xs text-zinc-500">{engagement.internalClient.gcgDepartment}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${getIntakeTypeStyle(engagement.intakeType)}`}>
          {engagement.intakeType}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${getTypeStyle(engagement.type)}`}>
          {engagement.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex -space-x-1.5">
          {engagement.teamMembers.slice(0, 4).map((member, idx) => (
            <div
              key={idx}
              className="w-7 h-7 bg-zinc-700/80 backdrop-blur-sm border-2 border-zinc-900/50 flex items-center justify-center text-zinc-300 text-xs font-medium"
              title={member}
            >
              {getInitials(member)}
            </div>
          ))}
          {engagement.teamMembers.length > 4 && (
            <div
              className="w-7 h-7 bg-zinc-600/80 backdrop-blur-sm border-2 border-zinc-900/50 flex items-center justify-center text-zinc-300 text-xs font-medium"
              title={engagement.teamMembers.slice(4).join(', ')}
            >
              +{engagement.teamMembers.length - 4}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-zinc-400 font-mono">{engagement.dateStarted}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm font-mono ${engagement.dateFinished === '—' ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {engagement.dateFinished}
        </span>
      </td>
      <td className="px-4 py-3">
        {engagement.portfolioLogged ? (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">Yes</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <X className="w-4 h-4" />
            <span className="text-xs font-medium">No</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setNnaModalEngagement(engagement)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-mono transition-colors ${
            engagement.nna
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30'
          }`}
          title={engagement.nna ? 'Edit NNA' : 'Add NNA'}
        >
          {engagement.nna ? (
            formatTableNNA(engagement.nna)
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span className="text-xs">Add</span>
            </>
          )}
        </button>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="relative" ref={openStatusDropdown === engagement.id ? statusDropdownRef : null}>
          <button
            onClick={() => setOpenStatusDropdown(openStatusDropdown === engagement.id ? null : engagement.id)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium backdrop-blur-sm cursor-pointer hover:ring-1 hover:ring-white/20 transition-all ${getStatusStyle(engagement.status)}`}
          >
            {engagement.status}
            <ChevronDown className={`w-3 h-3 transition-transform ${openStatusDropdown === engagement.id ? 'rotate-180' : ''}`} />
          </button>
          {openStatusDropdown === engagement.id && (
            <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[120px] overflow-hidden">
              {statusOptions.map(status => (
                <button
                  key={status}
                  onClick={() => {
                    onStatusChange(engagement.id, status);
                    setOpenStatusDropdown(null);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                    engagement.status === status
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-zinc-300 hover:bg-zinc-700/50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setNotesModalEngagement(engagement)}
          className={`p-1.5 transition-colors ${
            engagement.notes
              ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400'
              : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300'
          }`}
          title={engagement.notes ? 'View/edit notes' : 'Add notes'}
        >
          <FileText className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );

  // Render table header
  const renderTableHeader = () => (
    <thead className="sticky top-0 bg-zinc-800/95 backdrop-blur-sm z-10">
      <tr>
        <SortableHeader label="External Client" column="externalClient" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="Internal Client" column="internalClient" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="Intake Type" column="intakeType" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="Project Type" column="type" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="Team Members" column="teamMembers" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="Date Started" column="dateStarted" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="Date Finished" column="dateFinished" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="Portfolio Logged" column="portfolioLogged" currentSort={sortConfig} onSort={handleSort} />
        <SortableHeader label="NNA" column="nna" currentSort={sortConfig} onSort={handleSort} centered />
        <SortableHeader label="Status" column="status" currentSort={sortConfig} onSort={handleSort} />
        <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Notes</th>
      </tr>
    </thead>
  );

  // Render pagination
  const renderPagination = (isFullscreenMode: boolean = false) => (
    <div className={`relative z-10 px-4 py-3 flex items-center justify-end border-t border-zinc-800/50 flex-shrink-0 ${isFullscreenMode ? 'bg-zinc-900' : 'bg-zinc-900/80 backdrop-blur-sm'}`}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1.5 text-xs border border-zinc-700/50 transition-colors ${isFullscreenMode ? '' : 'backdrop-blur-sm'} ${currentPage === 1
              ? 'text-zinc-600 cursor-not-allowed'
              : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
            }`}
        >
          Previous
        </button>
        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${isFullscreenMode ? 'fs-' : ''}${idx}`} className="px-2 py-1.5 text-xs text-zinc-500">
              ...
            </span>
          ) : (
            <button
              key={`${isFullscreenMode ? 'fs-' : ''}${page}`}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1.5 text-xs transition-colors ${currentPage === page
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                  : `border border-zinc-700/50 hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200 ${isFullscreenMode ? '' : 'backdrop-blur-sm'}`
                }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1.5 text-xs border border-zinc-700/50 transition-colors ${isFullscreenMode ? '' : 'backdrop-blur-sm'} ${currentPage === totalPages
              ? 'text-zinc-600 cursor-not-allowed'
              : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Notes Modal */}
      <NotesModal
        isOpen={notesModalEngagement !== null}
        onClose={() => setNotesModalEngagement(null)}
        title="Notes"
        subtitle={notesModalEngagement?.externalClient || notesModalEngagement?.internalClient.name || ''}
        currentNotes={notesModalEngagement?.notes ?? ''}
        onSave={(notes) => {
          if (notesModalEngagement) {
            onNotesChange(notesModalEngagement.id, notes);
          }
        }}
        placeholder="Add notes about this interaction..."
      />

      {/* NNA Modal */}
      <NNAModal
        isOpen={nnaModalEngagement !== null}
        onClose={() => setNnaModalEngagement(null)}
        engagementId={nnaModalEngagement?.id ?? 0}
        externalClient={nnaModalEngagement?.externalClient ?? null}
        internalClient={nnaModalEngagement?.internalClient.name ?? ''}
        currentNNA={nnaModalEngagement?.nna}
        onSave={onNNAChange}
      />

      {/* Main Table */}
      <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-xl flex flex-col min-h-[380px]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Table Header with Fullscreen Toggle */}
        <div className="relative z-10 px-4 py-2 flex items-center justify-between border-b border-zinc-800/50 flex-shrink-0">
          <h3 className="text-sm font-medium text-white">Interactions</h3>
          <div className="flex items-center gap-4">
            <p className="text-xs text-zinc-500">
              Showing <span className="text-zinc-300 font-medium">{((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sortedEngagements.length)}</span> of <span className="text-zinc-300 font-medium">{sortedEngagements.length}</span>
            </p>
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-cyan-400 transition-colors" title="Download table data">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-white/[0.05] transition-colors"
              title="Expand table"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-auto min-h-0">
          <table className="w-full">
            {renderTableHeader()}
            <tbody className="divide-y divide-zinc-800/50">
              {paginatedEngagements.map((engagement) => renderTableRow(engagement))}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </div>

      {/* Fullscreen Table Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-16">
          {/* Dimmed backdrop */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setIsFullscreen(false)}
          />

          {/* Fullscreen table container */}
          <div className="relative w-full h-full bg-zinc-900 border border-zinc-700/50 rounded-xl flex flex-col shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            {/* Header with close button */}
            <div className="relative z-10 px-4 py-3 flex items-center justify-between border-b border-zinc-800/50 flex-shrink-0">
              <h3 className="text-sm font-medium text-white">Interactions</h3>
              <div className="flex items-center gap-4">
                <p className="text-xs text-zinc-500">
                  Showing <span className="text-zinc-300 font-medium">{((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sortedEngagements.length)}</span> of <span className="text-zinc-300 font-medium">{sortedEngagements.length}</span>
                </p>
                <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-cyan-400 transition-colors" title="Download table data">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-white/[0.05] transition-colors"
                  title="Exit fullscreen"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table content */}
            <div className="relative z-10 flex-1 overflow-auto min-h-0">
              <table className="w-full">
                <thead className="sticky top-0 bg-zinc-800 z-10">
                  <tr>
                    <SortableHeader label="External Client" column="externalClient" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Internal Client" column="internalClient" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Intake Type" column="intakeType" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Project Type" column="type" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Team Members" column="teamMembers" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Date Started" column="dateStarted" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Date Finished" column="dateFinished" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Portfolio Logged" column="portfolioLogged" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="NNA" column="nna" currentSort={sortConfig} onSort={handleSort} centered />
                    <SortableHeader label="Status" column="status" currentSort={sortConfig} onSort={handleSort} />
                    <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {paginatedEngagements.map((engagement) => renderTableRow(engagement, 'fs-'))}
                </tbody>
              </table>
            </div>

            {renderPagination(true)}
          </div>
        </div>
      )}
    </>
  );
};

export default InteractionsTable;

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, FileText, ArrowUpRight, ArrowDownRight, Download, User, Check, X, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Maximize2, Minimize2, Inbox, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { getEngagementsDashboardData, getEngagements } from '@/app/lib/api/engagements';
import { generateContributionData } from '@/app/lib/data/engagements';
import type { EngagementMetric, DepartmentData, Engagement, DayData } from '@/app/lib/types/engagements';
import DashboardHeader from '@/app/components/DashboardHeader';
import ClientOnlyChart from '@/app/components/ClientOnlyChart';

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
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, column, currentSort, onSort }) => {
  const isActive = currentSort.column === column;

  return (
    <th
      onClick={() => onSort(column)}
      className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200 transition-colors select-none group"
    >
      <div className="flex items-center gap-1">
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

// GitHub-style Contribution Graph Component
interface ContributionGraphProps {
  data: DayData[][];
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ data }) => {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

  const getLevelColor = (level: number): string => {
    switch (level) {
      case 0: return '#27272a';
      case 1: return '#164e63';
      case 2: return '#0e7490';
      case 3: return '#06b6d4';
      case 4: return '#22d3ee';
      default: return '#27272a';
    }
  };

  const flatData = data.flat();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', marginLeft: '32px', marginBottom: '8px' }}>
        {monthLabels.map((month, i) => (
          <span key={i} style={{ flex: 1, fontSize: '10px', color: '#71717a', fontWeight: 500 }}>{month}</span>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateRows: 'repeat(5, 1fr)',
          paddingRight: '8px',
          width: '28px',
          alignItems: 'center'
        }}>
          {dayLabels.map((day, i) => (
            <span key={i} style={{ fontSize: '10px', color: '#71717a', textAlign: 'right' }}>{day}</span>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(52, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr)',
          gap: '3px',
          flex: 1,
          gridAutoFlow: 'column'
        }}>
          {flatData.map((day, index) => (
            <div
              key={index}
              style={{
                backgroundColor: getLevelColor(day.level),
                borderRadius: '2px',
                cursor: 'pointer',
                minWidth: 0,
                minHeight: 0
              }}
              title={`${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n${day.projectCount} project${day.projectCount !== 1 ? 's' : ''}, ${day.touchPointCount} touch point${day.touchPointCount !== 1 ? 's' : ''}`}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
        <span style={{ fontSize: '10px', color: '#71717a' }}>Less</span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: getLevelColor(level),
                borderRadius: '2px'
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '10px', color: '#71717a' }}>More</span>
      </div>
    </div>
  );
};

export default function EngagementsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'dateStarted', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Global filter state
  const [teamMemberFilter, setTeamMemberFilter] = useState('All Team Members');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [intakeTypeFilter, setIntakeTypeFilter] = useState('All Intake Types');
  const [projectTypeFilter, setProjectTypeFilter] = useState('All Project Types');
  const [period, setPeriod] = useState('1Y');
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);

  // Fetch all dashboard data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getEngagementsDashboardData();
        setEngagements(data.engagements);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter engagements when search changes
  useEffect(() => {
    if (!searchQuery) return;

    const timeoutId = setTimeout(async () => {
      try {
        const filtered = await getEngagements({ search: searchQuery });
        setEngagements(filtered);
      } catch (error) {
        console.error('Failed to filter engagements:', error);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset engagements when search is cleared
  useEffect(() => {
    if (searchQuery === '') {
      getEngagements().then(setEngagements);
    }
  }, [searchQuery]);

  // Mock current user - in production this would come from auth
  const currentUser = 'Eli F.';

  // Extract unique filter options from engagements
  const filterOptions = useMemo(() => {
    const departments = new Set<string>();
    const intakeTypes = new Set<string>();
    const projectTypes = new Set<string>();

    engagements.forEach((e) => {
      departments.add(e.internalClient.gcgDepartment);
      intakeTypes.add(e.intakeType);
      projectTypes.add(e.type);
    });

    return {
      // Only show "All Team Members" and current user for privacy
      teamMembers: ['All Team Members', currentUser],
      departments: ['All Departments', ...Array.from(departments).sort()],
      intakeTypes: ['All Intake Types', ...Array.from(intakeTypes).sort()],
      projectTypes: ['All Project Types', ...Array.from(projectTypes).sort()],
    };
  }, [engagements, currentUser]);

  // Get cutoff date based on selected period
  const getPeriodCutoffDate = (periodValue: string): Date | null => {
    const now = new Date('2025-01-28'); // Reference date for dummy data
    switch (periodValue) {
      case '1W':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1M':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case '3M':
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      case '6M':
        return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      case 'YTD':
        return new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
      case '1Y':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      case 'ALL':
        return null; // No cutoff
      default:
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
  };

  // Apply global filters to engagements (but NOT contribution data)
  const filteredEngagements = useMemo(() => {
    const cutoffDate = getPeriodCutoffDate(period);

    return engagements.filter((e) => {
      // Period filter - check if dateStarted is after cutoff
      if (cutoffDate) {
        const startDate = new Date(e.dateStarted);
        if (startDate < cutoffDate) {
          return false;
        }
      }
      // Team member filter
      if (teamMemberFilter !== 'All Team Members' && !e.teamMembers.includes(teamMemberFilter)) {
        return false;
      }
      // Department filter
      if (departmentFilter !== 'All Departments' && e.internalClient.gcgDepartment !== departmentFilter) {
        return false;
      }
      // Intake type filter
      if (intakeTypeFilter !== 'All Intake Types' && e.intakeType !== intakeTypeFilter) {
        return false;
      }
      // Project type filter
      if (projectTypeFilter !== 'All Project Types' && e.type !== projectTypeFilter) {
        return false;
      }
      return true;
    });
  }, [engagements, teamMemberFilter, departmentFilter, intakeTypeFilter, projectTypeFilter, period]);

  // Compute filtered metrics based on filtered engagements
  const filteredMetrics = useMemo((): EngagementMetric[] => {
    // Client Projects = GRRFs + IRQs - PCRs (PCRs that came from GRRF/IRQ intakes)
    const grffsAndIrqs = filteredEngagements.filter((e) => e.intakeType === 'GRRF' || e.intakeType === 'IRQ');
    const pcrsFromGrffsAndIrqs = grffsAndIrqs.filter((e) => e.type === 'PCR').length;
    const clientProjects = grffsAndIrqs.length - pcrsFromGrffsAndIrqs;

    const inProgress = filteredEngagements.filter((e) => e.status === 'In Progress').length;
    // Only count portfolios logged for GRRFs and IRQs that are not PCRs (Touch Points and PCRs don't have logged portfolios)
    const eligibleForPortfolio = filteredEngagements.filter((e) =>
      (e.intakeType === 'GRRF' || e.intakeType === 'IRQ') && e.type !== 'PCR'
    );
    const portfoliosLogged = eligibleForPortfolio.filter((e) => e.portfolioLogged).length;
    const touchPoints = filteredEngagements.filter((e) => e.intakeType === 'Touch Points').length;
    const portfolioPercent = eligibleForPortfolio.length > 0 ? Math.round((portfoliosLogged / eligibleForPortfolio.length) * 100) : 0;

    return [
      { label: 'Client Projects', sublabel: '1YR', value: clientProjects.toLocaleString(), change: '+12%', isPositive: true, icon: 'FileText' },
      { label: 'Touch Points', sublabel: '1YR', value: touchPoints.toLocaleString(), change: '+18%', isPositive: true, icon: 'MessageSquare' },
      { label: 'In Progress', sublabel: 'Current', value: inProgress.toLocaleString(), change: '+3', isPositive: true, icon: 'PlayCircle' },
      { label: 'Portfolios Logged', sublabel: '1YR', value: portfoliosLogged.toLocaleString(), change: `${portfolioPercent}%`, isPositive: true, icon: 'CheckCircle2' },
    ];
  }, [filteredEngagements]);

  // Compute filtered department breakdown
  const filteredDepartmentBreakdown = useMemo((): DepartmentData[] => {
    const deptCounts: Record<string, number> = { IAG: 0, 'Broker-Dealer': 0, Institution: 0 };
    filteredEngagements.forEach((e) => {
      deptCounts[e.internalClient.gcgDepartment]++;
    });

    const total = filteredEngagements.length || 1;
    const colors: Record<string, string> = { IAG: '#a5f3fc', 'Broker-Dealer': '#22d3ee', Institution: '#0e7490' };

    return Object.entries(deptCounts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count,
      color: colors[name] || '#71717a',
    }));
  }, [filteredEngagements]);

  // Compute filtered contribution data for heatmap
  const filteredContributionData = useMemo(() => {
    return generateContributionData(filteredEngagements);
  }, [filteredEngagements]);

  // Handle column sort
  const handleSort = (column: SortColumn) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') return { column, direction: 'desc' };
        if (prev.direction === 'desc') return { column: null, direction: null };
      }
      return { column, direction: 'asc' };
    });
  };

  // Sort engagements based on current sort config
  const sortedEngagements = useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) return filteredEngagements;

    return [...filteredEngagements].sort((a, b) => {
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
          // Handle "—" as a special case (no date = sorts last)
          if (a.dateFinished === '—' && b.dateFinished === '—') return 0;
          if (a.dateFinished === '—') return direction;
          if (b.dateFinished === '—') return -direction;
          const aDate = new Date(a.dateFinished);
          const bDate = new Date(b.dateFinished);
          return (aDate.getTime() - bDate.getTime()) * direction;
        }
        case 'portfolioLogged':
          return ((a.portfolioLogged ? 1 : 0) - (b.portfolioLogged ? 1 : 0)) * direction;
        case 'status': {
          // Custom sort order: In Progress, Pending, Completed
          const statusOrder: Record<string, number> = { 'In Progress': 0, 'Pending': 1, 'Completed': 2 };
          const aOrder = statusOrder[a.status] ?? 3;
          const bOrder = statusOrder[b.status] ?? 3;
          return (aOrder - bOrder) * direction;
        }
        default:
          return 0;
      }
    });
  }, [filteredEngagements, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedEngagements.length / pageSize);
  const paginatedEngagements = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedEngagements.slice(startIndex, startIndex + pageSize);
  }, [sortedEngagements, currentPage, pageSize]);

  // Reset to page 1 when search, sort, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig, teamMemberFilter, departmentFilter, intakeTypeFilter, projectTypeFilter, period]);

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
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  const getIntakeTypeStyle = (intakeType: string): string => {
    switch (intakeType) {
      case 'IRQ': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'GRRF': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Touch Points': return 'bg-pink-500/15 text-pink-400 border border-pink-500/30';
      default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30';
    }
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <>
      {/* Top Bar with Filters */}
      <DashboardHeader
        title="Client Interactions"
        subtitle="Track and manage client interactions across all departments"
        searchPlaceholder="Search external clients, internal clients..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        className="sticky top-0 z-10"
        filters={[
          {
            id: 'teamMember',
            icon: User,
            label: 'Team Member',
            options: filterOptions.teamMembers,
            value: teamMemberFilter,
            onChange: setTeamMemberFilter,
          },
          {
            id: 'department',
            icon: Building2,
            label: 'Department',
            options: filterOptions.departments,
            value: departmentFilter,
            onChange: setDepartmentFilter,
          },
          {
            id: 'intakeType',
            icon: Inbox,
            label: 'Intake Type',
            options: filterOptions.intakeTypes,
            value: intakeTypeFilter,
            onChange: setIntakeTypeFilter,
          },
          {
            id: 'projectType',
            icon: Briefcase,
            label: 'Project Type',
            options: filterOptions.projectTypes,
            value: projectTypeFilter,
            onChange: setProjectTypeFilter,
          },
        ]}
        period={period}
        onPeriodChange={setPeriod}
        actionButtonLabel="+ New Interaction"
        onActionButtonClick={() => {
          // TODO: Implement new interaction modal/form
          console.log('New Interaction clicked');
        }}
      />

      <div className="p-6 flex flex-col gap-6">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-zinc-400 text-sm">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Metrics Row - Clean Cards (filtered) */}
            <div className="grid grid-cols-4 gap-4">
              {filteredMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl group hover:border-zinc-700/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                >
                  <div className="absolute top-5 right-4 flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-white/80 rounded-full" />
                    <div className="w-1 h-1 bg-white/80 rounded-full" />
                    <div className="w-1 h-1 bg-white/80 rounded-full" />
                  </div>
                  <div className="absolute top-3.5 left-5 z-10">
                    <p className="text-white text-[0.8rem]">{metric.label}</p>
                  </div>
                  <div className="relative z-10 pt-6">
                    <p className="text-[3rem] font-bold text-white mb-2 tracking-tight leading-none">{metric.value}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 text-[0.9rem] font-medium ${metric.isPositive ? 'text-[#39FF14]' : 'text-[#FF3131]'
                          }`}
                        style={{
                          textShadow: metric.isPositive
                            ? '0 0 4px rgba(57, 255, 20, 0.3)'
                            : '0 0 4px rgba(255, 49, 49, 0.3)'
                        }}
                      >
                        {metric.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {metric.change}
                      </span>
                      <span className="text-xs text-zinc-500">{metric.sublabel}</span>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-4" style={{ height: '280px' }}>
              {/* Project Frequency - GitHub-style Contribution Graph */}
              <div className="col-span-2 relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 h-full rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <div>
                      <h3 className="text-sm font-medium text-white">Completed Interactions</h3>
                      <p className="text-xs text-zinc-500">Daily completed projects & touch points (1YR)</p>
                    </div>
                    <button className="p-1.5 bg-zinc-800/50 backdrop-blur-sm text-zinc-400 hover:text-cyan-400 transition-colors" title="Download chart data">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1" style={{ minHeight: 0 }}>
                    {filteredContributionData.length > 0 && <ContributionGraph data={filteredContributionData} />}
                  </div>
                </div>
              </div>

              {/* Department Breakdown - Glassy */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 h-full rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div>
                      <h3 className="text-sm font-medium text-white">GCG Department</h3>
                      <p className="text-xs text-zinc-500">Total projects (1YR)</p>
                    </div>
                    <button className="p-1.5 bg-zinc-800/50 backdrop-blur-sm text-zinc-400 hover:text-cyan-400 transition-colors" title="Download chart data">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 mb-3">
                    <ClientOnlyChart>
                      <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={80}>
                        <BarChart data={filteredDepartmentBreakdown} layout="vertical" barSize={16}>
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} width={85} />
                          <Bar dataKey="value" radius={0}>
                            {filteredDepartmentBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <LabelList dataKey="value" position="right" formatter={(value) => `${value}%`} style={{ fill: '#a1a1aa', fontSize: 11 }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ClientOnlyChart>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-zinc-800/50 flex-shrink-0">
                    {filteredDepartmentBreakdown.map((dept) => (
                      <div key={dept.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5" style={{ backgroundColor: dept.color }} />
                          <span className="text-zinc-400">{dept.name}</span>
                        </div>
                        <span className="text-zinc-200 font-medium font-mono">{dept.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 flex flex-col min-h-[380px]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Table Header with Fullscreen Toggle */}
              <div className="relative z-10 px-4 py-2 flex items-center justify-between border-b border-zinc-800/50 flex-shrink-0">
                <h3 className="text-sm font-medium text-white">Interactions</h3>
                <button
                  onClick={() => setIsTableFullscreen(true)}
                  className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-white/[0.05] transition-colors"
                  title="Expand table"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 flex-1 overflow-auto min-h-0">
                <table className="w-full">
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
                      <SortableHeader label="Status" column="status" currentSort={sortConfig} onSort={handleSort} />
                      <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {paginatedEngagements.map((engagement) => (
                      <tr key={engagement.id} className="hover:bg-white/[0.02] transition-colors">
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
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${getStatusStyle(engagement.status)}`}>
                            {engagement.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {engagement.hasNotes ? (
                            <button className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors" title="View notes">
                              <FileText className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination & Download - Fixed at bottom */}
              <div className="relative z-10 px-4 py-3 flex items-center justify-between border-t border-zinc-800/50 flex-shrink-0 bg-zinc-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-zinc-500">
                    Showing <span className="text-zinc-300 font-medium">{((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sortedEngagements.length)}</span> of <span className="text-zinc-300 font-medium">{sortedEngagements.length}</span> interactions
                  </p>
                  <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-cyan-400 transition-colors" title="Download table data">
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 text-xs border border-zinc-700/50 transition-colors backdrop-blur-sm ${currentPage === 1
                        ? 'text-zinc-600 cursor-not-allowed'
                        : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                      }`}
                  >
                    Previous
                  </button>
                  {getPageNumbers().map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-xs text-zinc-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-xs transition-colors ${currentPage === page
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                            : 'border border-zinc-700/50 hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200 backdrop-blur-sm'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 text-xs border border-zinc-700/50 transition-colors backdrop-blur-sm ${currentPage === totalPages
                        ? 'text-zinc-600 cursor-not-allowed'
                        : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                      }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Table Overlay */}
      {isTableFullscreen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-16">
          {/* Dimmed backdrop */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setIsTableFullscreen(false)}
          />

          {/* Fullscreen table container */}
          <div className="relative w-full h-full bg-zinc-900 border border-zinc-700/50 flex flex-col shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            {/* Header with close button */}
            <div className="relative z-10 px-4 py-3 flex items-center justify-between border-b border-zinc-800/50 flex-shrink-0">
              <h3 className="text-sm font-medium text-white">Interactions</h3>
              <button
                onClick={() => setIsTableFullscreen(false)}
                className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-white/[0.05] transition-colors"
                title="Exit fullscreen"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
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
                    <SortableHeader label="Status" column="status" currentSort={sortConfig} onSort={handleSort} />
                    <th className="text-center text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {paginatedEngagements.map((engagement) => (
                    <tr key={engagement.id} className="hover:bg-white/[0.02] transition-colors">
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
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${getStatusStyle(engagement.status)}`}>
                          {engagement.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {engagement.hasNotes ? (
                          <button className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors" title="View notes">
                            <FileText className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - Fixed at bottom */}
            <div className="relative z-10 px-4 py-3 flex items-center justify-between border-t border-zinc-800/50 flex-shrink-0 bg-zinc-900">
              <div className="flex items-center gap-3">
                <p className="text-xs text-zinc-500">
                  Showing <span className="text-zinc-300 font-medium">{((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sortedEngagements.length)}</span> of <span className="text-zinc-300 font-medium">{sortedEngagements.length}</span> interactions
                </p>
                <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-cyan-400 transition-colors" title="Download table data">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 text-xs border border-zinc-700/50 transition-colors ${currentPage === 1
                      ? 'text-zinc-600 cursor-not-allowed'
                      : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                    }`}
                >
                  Previous
                </button>
                {getPageNumbers().map((page, idx) =>
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-fs-${idx}`} className="px-2 py-1.5 text-xs text-zinc-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`fs-${page}`}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-xs transition-colors ${currentPage === page
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                          : 'border border-zinc-700/50 hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 text-xs border border-zinc-700/50 transition-colors ${currentPage === totalPages
                      ? 'text-zinc-600 cursor-not-allowed'
                      : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

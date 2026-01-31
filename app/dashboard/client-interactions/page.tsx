'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Building2, Download, User, Loader2, Inbox, Briefcase } from 'lucide-react';
import MetricCards from '@/app/components/pages/client-interactions/MetricCards';
import ContributionGraph from '@/app/components/pages/client-interactions/ContributionGraph';
import DepartmentChart from '@/app/components/pages/client-interactions/DepartmentChart';
import InteractionsTable from '@/app/components/pages/client-interactions/InteractionsTable';
import NewInteractionForm, { InteractionFormData } from '@/app/components/pages/client-interactions/NewInteractionForm';
import { getEngagementsDashboardData, getEngagements } from '@/app/lib/api/engagements';
import { generateContributionData, teamMemberOffices } from '@/app/lib/data/engagements';
import type { EngagementMetric, DepartmentData, Engagement } from '@/app/lib/types/engagements';
import DashboardHeader from '@/app/components/DashboardHeader';

export default function EngagementsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [engagements, setEngagements] = useState<Engagement[]>([]);

  // Global filter state
  const [teamMemberFilter, setTeamMemberFilter] = useState('All Team Members');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [intakeTypeFilter, setIntakeTypeFilter] = useState('All Intake Types');
  const [projectTypeFilter, setProjectTypeFilter] = useState('All Project Types');
  const [period, setPeriod] = useState('1Y');
  const [isNewInteractionOpen, setIsNewInteractionOpen] = useState(false);

  // Flip card state for metric cards (supports multiple flip cards)
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flipStartTimeRef = useRef<number>(0);
  const lastFilterChangeRef = useRef<number>(0);

  // Track filter changes to prevent accidental flips after clicking dropdowns
  const handleFilterChange = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    lastFilterChangeRef.current = Date.now();
    setter(value);
  }, []);

  const handleCardEnter = useCallback((cardLabel: string) => {
    // Don't flip if a filter was just changed (prevents accidental flip after dropdown click)
    const timeSinceFilterChange = Date.now() - lastFilterChangeRef.current;
    if (timeSinceFilterChange < 1000) return;

    // Clear any pending unflip timeout
    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = null;
    }
    // Record when flip started
    flipStartTimeRef.current = Date.now();
    setFlippedCard(cardLabel);
  }, []);

  const handleCardLeave = useCallback(() => {
    const elapsed = Date.now() - flipStartTimeRef.current;
    const minDuration = 1000; // 1 second minimum flip time
    const remaining = Math.max(0, minDuration - elapsed);

    // If already flipped for 1+ second, flip back immediately; otherwise wait for remaining time
    flipTimeoutRef.current = setTimeout(() => {
      setFlippedCard(null);
      flipTimeoutRef.current = null;
    }, remaining);
  }, []);

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
      // Show "All Team Members", office locations, and current user for privacy
      teamMembers: ['All Team Members', 'Austin Office', 'Charlotte Office', currentUser],
      teamMemberGroups: [
        { label: 'Office', options: ['Austin Office', 'Charlotte Office'] },
        { label: 'Members', options: [currentUser] },
      ],
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
      // Team member filter (supports individual members and office locations)
      if (teamMemberFilter !== 'All Team Members') {
        if (teamMemberFilter === 'Charlotte Office') {
          const hasCharlotteMember = e.teamMembers.some(m => teamMemberOffices[m] === 'Charlotte');
          if (!hasCharlotteMember) return false;
        } else if (teamMemberFilter === 'Austin Office') {
          const hasAustinMember = e.teamMembers.some(m => teamMemberOffices[m] === 'Austin');
          if (!hasAustinMember) return false;
        } else if (!e.teamMembers.includes(teamMemberFilter)) {
          return false;
        }
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
    const now = new Date('2025-01-28');

    // Get period date ranges for comparison
    const getPeriodDates = (periodValue: string): { currentStart: Date; previousStart: Date; previousEnd: Date; label: string } => {
      switch (periodValue) {
        case '1W': {
          const currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const previousEnd = new Date(currentStart.getTime() - 1);
          const previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          return { currentStart, previousStart, previousEnd, label: 'vs prev week' };
        }
        case '1M': {
          const currentStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          const previousEnd = new Date(currentStart.getTime() - 1);
          const previousStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
          return { currentStart, previousStart, previousEnd, label: 'vs prev month' };
        }
        case '3M': {
          const currentStart = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          const previousEnd = new Date(currentStart.getTime() - 1);
          const previousStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          return { currentStart, previousStart, previousEnd, label: 'vs prev 3M' };
        }
        case '6M': {
          const currentStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          const previousEnd = new Date(currentStart.getTime() - 1);
          const previousStart = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
          return { currentStart, previousStart, previousEnd, label: 'vs prev 6M' };
        }
        case 'YTD': {
          const currentStart = new Date(now.getFullYear(), 0, 1);
          const previousEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          const previousStart = new Date(now.getFullYear() - 1, 0, 1);
          return { currentStart, previousStart, previousEnd, label: 'vs prev YTD' };
        }
        case '1Y':
        default: {
          const currentStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          const previousEnd = new Date(currentStart.getTime() - 1);
          const previousStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
          return { currentStart, previousStart, previousEnd, label: 'YoY' };
        }
        case 'ALL': {
          // For ALL, compare to nothing meaningful - just show the count
          const currentStart = new Date(2000, 0, 1);
          return { currentStart, previousStart: new Date(1990, 0, 1), previousEnd: new Date(1999, 11, 31), label: 'All Time' };
        }
      }
    };

    const periodDates = getPeriodDates(period);

    // Client Projects = GRRFs + IRQs - PCRs (PCRs that came from GRRF/IRQ intakes)
    const grffsAndIrqs = filteredEngagements.filter((e) => e.intakeType === 'GRRF' || e.intakeType === 'IRQ');
    const pcrsFromGrffsAndIrqs = grffsAndIrqs.filter((e) => e.type === 'PCR').length;
    const clientProjects = grffsAndIrqs.length - pcrsFromGrffsAndIrqs;

    // Calculate previous period's client projects for comparison
    const prevPeriodGrffsAndIrqs = engagements.filter((e) => {
      const startDate = new Date(e.dateStarted);
      return (e.intakeType === 'GRRF' || e.intakeType === 'IRQ') &&
        startDate >= periodDates.previousStart && startDate <= periodDates.previousEnd;
    });
    const prevClientProjects = prevPeriodGrffsAndIrqs.length - prevPeriodGrffsAndIrqs.filter((e) => e.type === 'PCR').length;
    const clientProjectsChangePercent = prevClientProjects > 0
      ? Math.round(((clientProjects - prevClientProjects) / prevClientProjects) * 100)
      : (clientProjects > 0 ? 100 : 0);
    const clientProjectsChangeStr = clientProjectsChangePercent >= 0 ? `+${clientProjectsChangePercent}%` : `${clientProjectsChangePercent}%`;

    // Calculate intake source breakdown for Client Projects (IRQ vs GRRF, excluding PCRs)
    const nonPcrProjects = grffsAndIrqs.filter((e) => e.type !== 'PCR');
    const irqProjects = nonPcrProjects.filter((e) => e.intakeType === 'IRQ');
    const grffProjects = nonPcrProjects.filter((e) => e.intakeType === 'GRRF');
    const irqCount = irqProjects.length;
    const grffCount = grffProjects.length;
    const totalProjects = irqCount + grffCount;

    const inProgress = filteredEngagements.filter((e) => e.status === 'In Progress').length;
    // Only count portfolios logged for GRRFs and IRQs that are not PCRs (GCG Ad-Hoc and PCRs don't have logged portfolios)
    const eligibleForPortfolio = filteredEngagements.filter((e) =>
      (e.intakeType === 'GRRF' || e.intakeType === 'IRQ') && e.type !== 'PCR'
    );
    const portfoliosLogged = eligibleForPortfolio.filter((e) => e.portfolioLogged).length;
    const gcgAdHocEngagements = filteredEngagements.filter((e) => e.intakeType === 'GCG Ad-Hoc');
    const gcgAdHoc = gcgAdHocEngagements.length;
    const portfolioPercent = eligibleForPortfolio.length > 0 ? Math.round((portfoliosLogged / eligibleForPortfolio.length) * 100) : 0;

    // Calculate NNA (Net New Assets) totals
    const totalNNA = filteredEngagements.reduce((sum, e) => sum + (e.nna || 0), 0);
    const nnaProjectCount = filteredEngagements.filter((e) => e.nna && e.nna > 0).length;

    // Format NNA as currency string
    const formatNNAValue = (value: number): string => {
      if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(1)}B`;
      } else if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(0)}M`;
      } else if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(0)}K`;
      }
      return `$${value}`;
    };

    // Calculate previous period's NNA for comparison
    const prevPeriodNNA = engagements
      .filter((e) => {
        const startDate = new Date(e.dateStarted);
        return startDate >= periodDates.previousStart && startDate <= periodDates.previousEnd;
      })
      .reduce((sum, e) => sum + (e.nna || 0), 0);
    const nnaChangePercent = prevPeriodNNA > 0
      ? Math.round(((totalNNA - prevPeriodNNA) / prevPeriodNNA) * 100)
      : (totalNNA > 0 ? 100 : 0);
    const nnaChangeStr = nnaChangePercent >= 0 ? `+${nnaChangePercent}%` : `${nnaChangePercent}%`;

    // Calculate NNA distribution tiers
    const nnaEngagements = filteredEngagements.filter((e) => e.nna && e.nna > 0);
    const nnaTiers = [
      { label: '<$50M', count: nnaEngagements.filter((e) => e.nna! < 50_000_000).length, color: '#0e7490' },
      { label: '$50-200M', count: nnaEngagements.filter((e) => e.nna! >= 50_000_000 && e.nna! < 200_000_000).length, color: '#22d3ee' },
      { label: '$200M+', count: nnaEngagements.filter((e) => e.nna! >= 200_000_000).length, color: '#39FF14' },
    ];

    // Create intake source breakdown object for Client Projects card
    const intakeSourceBreakdown = {
      irqCount,
      irqPercent: totalProjects > 0 ? Math.round((irqCount / totalProjects) * 100) : 0,
      grffCount,
      grffPercent: totalProjects > 0 ? Math.round((grffCount / totalProjects) * 100) : 0,
      portfoliosLogged,
      portfoliosTotal: eligibleForPortfolio.length,
      portfoliosPercent: portfolioPercent,
    };

    // Calculate intake breakdown for GCG Ad-Hoc
    const intakeCounts: Record<string, number> = {
      'In-Person': 0,
      'Email': 0,
      'Teams': 0,
    };
    gcgAdHocEngagements.forEach((e) => {
      if (e.adHocChannel && e.adHocChannel in intakeCounts) {
        intakeCounts[e.adHocChannel]++;
      }
    });
    const intakeColors: Record<string, string> = {
      'In-Person': '#a5f3fc', // light cyan (matches IAG)
      'Email': '#22d3ee',     // cyan (matches Broker-Dealer)
      'Teams': '#0e7490',     // dark cyan (matches Institution)
    };
    const intakeBreakdown = Object.entries(intakeCounts).map(([intake, count]) => ({
      intake,
      count,
      percent: gcgAdHoc > 0 ? Math.round((count / gcgAdHoc) * 100) : 0,
      color: intakeColors[intake] || '#71717a',
    }));

    // Calculate previous period's GCG Ad-Hoc for comparison
    const prevGcgAdHoc = engagements.filter((e) => {
      const startDate = new Date(e.dateStarted);
      return e.intakeType === 'GCG Ad-Hoc' &&
        startDate >= periodDates.previousStart && startDate <= periodDates.previousEnd;
    }).length;
    const gcgAdHocChangePercent = prevGcgAdHoc > 0
      ? Math.round(((gcgAdHoc - prevGcgAdHoc) / prevGcgAdHoc) * 100)
      : (gcgAdHoc > 0 ? 100 : 0);
    const gcgAdHocChangeStr = gcgAdHocChangePercent >= 0 ? `+${gcgAdHocChangePercent}%` : `${gcgAdHocChangePercent}%`;

    // Generate sparkline data for In Progress trend based on period
    const getSparklineConfig = (periodValue: string): { points: number; label: string } => {
      switch (periodValue) {
        case '1W': return { points: 7, label: 'vs prev day' };
        case '1M': return { points: 8, label: 'vs prev week' };
        case '3M': return { points: 12, label: 'vs prev week' };
        case '6M': return { points: 12, label: 'vs prev month' };
        case 'YTD': return { points: 12, label: 'vs prev month' };
        case '1Y': return { points: 12, label: 'vs prev month' };
        case 'ALL': return { points: 12, label: 'vs prev month' };
        default: return { points: 8, label: 'vs prev week' };
      }
    };

    const sparklineConfig = getSparklineConfig(period);
    const baseInProgress = Math.max(inProgress - 3, 5);
    const inProgressSparkline = Array.from({ length: sparklineConfig.points }, (_, i) => ({
      value: baseInProgress + Math.floor(Math.random() * 4) + (i < sparklineConfig.points / 2 ? 0 : Math.floor(i / 2))
    }));
    // Ensure the last point matches current value
    inProgressSparkline[sparklineConfig.points - 1] = { value: inProgress };

    // Calculate period-over-period change
    const prevInProgress = inProgressSparkline[sparklineConfig.points - 2].value;
    const inProgressChange = inProgress - prevInProgress;
    const inProgressChangeStr = inProgressChange >= 0 ? `+${inProgressChange}` : `${inProgressChange}`;

    return [
      { label: 'Client Projects', sublabel: periodDates.label, value: clientProjects.toLocaleString(), change: clientProjectsChangeStr, isPositive: clientProjectsChangePercent >= 0, icon: 'FileText', intakeSourceBreakdown },
      { label: 'GCG Ad-Hoc', sublabel: periodDates.label, value: gcgAdHoc.toLocaleString(), change: gcgAdHocChangeStr, isPositive: gcgAdHocChangePercent >= 0, icon: 'MessageSquare', intakeBreakdown },
      { label: 'In Progress', sublabel: sparklineConfig.label, value: inProgress.toLocaleString(), change: inProgressChangeStr, isPositive: inProgressChange >= 0, icon: 'PlayCircle', sparklineData: inProgressSparkline },
      { label: 'NNA', sublabel: `${nnaProjectCount} projects`, value: formatNNAValue(totalNNA), change: nnaChangeStr, isPositive: nnaChangePercent >= 0, icon: 'DollarSign', nnaTiers },
    ];
  }, [filteredEngagements, engagements, period]);

  // Compute filtered department breakdown (stable reference - only updates when counts change)
  const prevDeptBreakdownRef = useRef<DepartmentData[]>([]);
  const filteredDepartmentBreakdown = useMemo((): DepartmentData[] => {
    const deptCounts: Record<string, number> = { IAG: 0, 'Broker-Dealer': 0, Institution: 0 };
    filteredEngagements.forEach((e) => {
      deptCounts[e.internalClient.gcgDepartment]++;
    });

    const total = filteredEngagements.length || 1;
    const colors: Record<string, string> = { IAG: '#a5f3fc', 'Broker-Dealer': '#22d3ee', Institution: '#0e7490' };

    const newBreakdown = Object.entries(deptCounts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count,
      color: colors[name] || '#71717a',
    }));

    // Only return new array if values actually changed (prevents chart re-render on status change)
    const prev = prevDeptBreakdownRef.current;
    const hasChanged = prev.length !== newBreakdown.length ||
      newBreakdown.some((item, i) => prev[i]?.count !== item.count || prev[i]?.value !== item.value);

    if (hasChanged) {
      prevDeptBreakdownRef.current = newBreakdown;
      return newBreakdown;
    }
    return prev;
  }, [filteredEngagements]);

  // Compute filtered contribution data for heatmap
  const filteredContributionData = useMemo(() => {
    return generateContributionData(filteredEngagements);
  }, [filteredEngagements]);

  // Map internal client name to department
  const getClientDepartment = (clientName: string): 'IAG' | 'Broker-Dealer' | 'Institution' => {
    const deptMap: Record<string, 'IAG' | 'Broker-Dealer' | 'Institution'> = {
      'Jennifer Martinez': 'IAG', 'Robert Chen': 'IAG', 'Amanda Foster': 'IAG',
      'Michael Thompson': 'Broker-Dealer', 'Jessica Williams': 'Broker-Dealer', 'Daniel Park': 'Broker-Dealer',
      'Christopher Lee': 'Institution', 'Rachel Goldman': 'Institution', 'Andrew Mitchell': 'Institution',
    };
    return deptMap[clientName] || 'IAG';
  };

  // Handle new interaction form submission with optimistic UI update
  const handleNewInteraction = (data: InteractionFormData) => {
    // Format date for display
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Create new engagement from form data
    const newEngagement: Engagement = {
      id: Date.now(), // Use timestamp as unique ID
      externalClient: data.externalClient,
      internalClient: {
        name: data.internalClient,
        gcgDepartment: getClientDepartment(data.internalClient),
      },
      intakeType: data.intakeType as 'IRQ' | 'GRRF' | 'GCG Ad-Hoc',
      adHocChannel: data.adHocChannel,
      type: data.projectType,
      teamMembers: data.teamMembers,
      department: getClientDepartment(data.internalClient),
      dateStarted: formatDate(data.dateStarted),
      dateFinished: '—', // New interactions are not finished yet
      status: 'In Progress',
      portfolioLogged: data.portfolioLogged,
      nna: data.nna || undefined,
      notes: data.notes.trim() || undefined,
    };

    // Optimistically add to state (prepend so it appears first)
    setEngagements(prev => [newEngagement, ...prev]);

    // TODO: In production, POST to API and handle rollback on error
    console.log('New interaction created:', newEngagement);
  };

  // Handle status change with optimistic UI update
  const handleStatusChange = (engagementId: number, newStatus: string) => {
    setEngagements(prev => prev.map(eng => {
      if (eng.id === engagementId) {
        // If marking as Completed, set the finish date to today
        const dateFinished = newStatus === 'Completed'
          ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : newStatus === 'In Progress' ? '—' : eng.dateFinished;

        return { ...eng, status: newStatus, dateFinished };
      }
      return eng;
    }));
    // TODO: In production, PATCH to API and handle rollback on error
  };

  // Handle notes change with optimistic UI update
  const handleNotesChange = (engagementId: number, notes: string) => {
    setEngagements(prev => prev.map(eng => {
      if (eng.id === engagementId) {
        return { ...eng, notes: notes.trim() || undefined };
      }
      return eng;
    }));
    // TODO: In production, PATCH to API and handle rollback on error
  };

  return (
    <>
      {/* New Interaction Form */}
      <NewInteractionForm
        isOpen={isNewInteractionOpen}
        onClose={() => setIsNewInteractionOpen(false)}
        onSubmit={handleNewInteraction}
      />

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
            optionGroups: filterOptions.teamMemberGroups,
            value: teamMemberFilter,
            onChange: (v: string) => handleFilterChange(setTeamMemberFilter, v),
          },
          {
            id: 'department',
            icon: Building2,
            label: 'Department',
            options: filterOptions.departments,
            value: departmentFilter,
            onChange: (v: string) => handleFilterChange(setDepartmentFilter, v),
          },
          {
            id: 'intakeType',
            icon: Inbox,
            label: 'Intake Type',
            options: filterOptions.intakeTypes,
            value: intakeTypeFilter,
            onChange: (v: string) => handleFilterChange(setIntakeTypeFilter, v),
          },
          {
            id: 'projectType',
            icon: Briefcase,
            label: 'Project Type',
            options: filterOptions.projectTypes,
            value: projectTypeFilter,
            onChange: (v: string) => handleFilterChange(setProjectTypeFilter, v),
          },
        ]}
        period={period}
        onPeriodChange={(v: string) => handleFilterChange(setPeriod, v)}
        actionButtonLabel="+ New Interaction"
        onActionButtonClick={() => setIsNewInteractionOpen(true)}
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
            <MetricCards
              metrics={filteredMetrics}
              flippedCard={flippedCard}
              onCardEnter={handleCardEnter}
              onCardLeave={handleCardLeave}
            />

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
                  <DepartmentChart data={filteredDepartmentBreakdown} />
                </div>
              </div>
            </div>

            {/* Table Section */}
            <InteractionsTable
              engagements={filteredEngagements}
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
            />
          </>
        )}
      </div>
    </>
  );
}

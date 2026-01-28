'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, Building2, ChevronDown, MoreHorizontal, FileText, ArrowUpRight, ArrowDownRight, Download, User, Check, X, PlayCircle, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { getEngagementsDashboardData, getEngagements } from '@/app/lib/api/engagements';
import type { EngagementMetric, DepartmentData, Engagement, DayData } from '@/app/lib/types/engagements';
import Sidebar from '@/app/components/Sidebar';

// Icon mapping for metrics (since we can't store React components in JSON/API)
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  PlayCircle,
  CheckCircle2,
  MessageSquare,
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
              title={`${day.count} projects on ${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
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

// Loading skeleton component
const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-zinc-800 rounded w-1/3 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-zinc-800 rounded"></div>
      <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
    </div>
  </div>
);

export default function EngagementsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<EngagementMetric[]>([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<DepartmentData[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [contributionData, setContributionData] = useState<DayData[][]>([]);

  // Fetch all dashboard data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getEngagementsDashboardData();
        setMetrics(data.metrics);
        setDepartmentBreakdown(data.departments);
        setEngagements(data.engagements);
        setContributionData(data.contributionData);
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
    <div className="h-screen bg-black flex overflow-hidden">
      <Sidebar className="flex-shrink-0" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Filters - Glassy */}
        <header className="flex-shrink-0 bg-black/80 backdrop-blur-md border-b border-zinc-800/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Client Projects</h2>
                <p className="text-zinc-500 text-sm">Track and manage client projects across all departments</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="px-2 py-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/10 border border-cyan-500/20 backdrop-blur-sm">Viewing: 1YR</span>
              </div>
            </div>
            {/* Global Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search clients, team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-colors">
                <User className="w-4 h-4 text-zinc-500" />
                All Team Members
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-colors">
                <Building2 className="w-4 h-4 text-zinc-500" />
                All Departments
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-colors">
                <Filter className="w-4 h-4 text-zinc-500" />
                All Types
                <ChevronDown className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium hover:from-blue-500 hover:to-cyan-400 transition-all">
                <Calendar className="w-4 h-4" />
                1YR
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 flex-1 flex flex-col overflow-hidden min-h-0">
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
              {/* Metrics Row - Clean Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6 flex-shrink-0">
                {metrics.map((metric, index) => {
                  const IconComponent = iconMap[metric.icon] || FileText;
                  return (
                    <div
                      key={index}
                      className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 group hover:border-zinc-700/50 transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
                      <div className="relative z-10">
                        <p className="text-zinc-400 text-sm mb-1">{metric.label}</p>
                        <p className="text-4xl font-bold text-white mb-2 tracking-tight">{metric.value}</p>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 backdrop-blur-sm ${
                            metric.isPositive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {metric.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {metric.change}
                          </span>
                          <span className="text-xs text-zinc-500">{metric.sublabel}</span>
                        </div>
                      </div>
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-3 gap-4 mb-6 flex-shrink-0" style={{ height: '280px' }}>
                {/* Project Frequency - GitHub-style Contribution Graph */}
                <div className="col-span-2 relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <div>
                        <h3 className="text-sm font-medium text-white">Project Frequency</h3>
                        <p className="text-xs text-zinc-500">Daily project activity (1YR)</p>
                      </div>
                      <button className="p-1.5 bg-zinc-800/50 backdrop-blur-sm text-zinc-400 hover:text-cyan-400 transition-colors" title="Download chart data">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1" style={{ minHeight: 0 }}>
                      {contributionData.length > 0 && <ContributionGraph data={contributionData} />}
                    </div>
                  </div>
                </div>

                {/* Department Breakdown - Glassy */}
                <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 h-full">
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
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={departmentBreakdown} layout="vertical" barSize={16}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} width={85} />
                          <Bar dataKey="value" radius={0}>
                            {departmentBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-zinc-800/50 flex-shrink-0">
                      {departmentBreakdown.map((dept) => (
                        <div key={dept.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5" style={{ backgroundColor: dept.color }} />
                            <span className="text-zinc-400">{dept.name}</span>
                          </div>
                          <span className="text-zinc-200 font-medium font-mono">{dept.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Section - Takes remaining space with internal scroll */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 flex-1 flex flex-col min-h-0">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10 flex-1 overflow-auto min-h-0">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-zinc-800/95 backdrop-blur-sm z-10">
                      <tr>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Client</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Intake Type</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Project Type</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Team Members</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Date Started</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Date Finished</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Portfolio Logged</th>
                        <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {engagements.map((engagement) => (
                        <tr key={engagement.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-zinc-200">{engagement.client}</span>
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
                          <td className="px-4 py-3">
                            <button className="p-1.5 hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
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
                      Showing <span className="text-zinc-300 font-medium">1–{engagements.length}</span> of <span className="text-zinc-300 font-medium">847</span> projects
                    </p>
                    <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-cyan-400 transition-colors" title="Download table data">
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="px-3 py-1.5 text-xs border border-zinc-700/50 hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200 transition-colors backdrop-blur-sm">
                      Previous
                    </button>
                    <button className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                      1
                    </button>
                    <button className="px-3 py-1.5 text-xs border border-zinc-700/50 hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200 transition-colors backdrop-blur-sm">
                      2
                    </button>
                    <button className="px-3 py-1.5 text-xs border border-zinc-700/50 hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200 transition-colors backdrop-blur-sm">
                      3
                    </button>
                    <button className="px-3 py-1.5 text-xs border border-zinc-700/50 hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200 transition-colors backdrop-blur-sm">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

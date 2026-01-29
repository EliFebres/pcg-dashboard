'use client';

import React, { useState, useMemo } from 'react';
import { Building2, ArrowUpRight, ArrowDownRight, PieChart, Target, User, ChevronDown, ChevronUp, Briefcase, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import type { LoggedPortfolio } from '@/app/lib/types/trends';
import {
  loggedPortfolios,
  extractFilterOptions,
  filterPortfolios,
  computePortfolioMetrics,
  computeFixedIncomeMetrics,
  computeBenchmarkComparison,
} from '@/app/lib/data/portfolioTrends';
import DashboardHeader from '@/app/components/DashboardHeader';

type SortColumn = keyof LoggedPortfolio | 'positionCount' | 'internalClientName' | 'department';

// Sort icon component
function SortIcon({ column, sortColumn, sortDirection }: { column: SortColumn; sortColumn: SortColumn; sortDirection: 'asc' | 'desc' }) {
  if (sortColumn !== column) return null;
  return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
}

export default function PortfolioTrendsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [teamMemberFilter, setTeamMemberFilter] = useState('All Team Members');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [period, setPeriod] = useState('1Y');

  // Portfolios table state
  const [expandedPortfolioId, setExpandedPortfolioId] = useState<number | null>(null);
  const [portfoliosSortColumn, setPortfoliosSortColumn] = useState<SortColumn>('loggedAt');
  const [portfoliosSortDirection, setPortfoliosSortDirection] = useState<'asc' | 'desc'>('desc');
  const [portfoliosPage, setPortfoliosPage] = useState(1);
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);
  const portfoliosPerPage = 5;

  // Extract filter options from portfolio data
  const filterOptions = useMemo(() => extractFilterOptions(loggedPortfolios), []);

  // Apply filters to get filtered portfolios
  const filteredPortfolios = useMemo(() => {
    return filterPortfolios(loggedPortfolios, teamMemberFilter, departmentFilter, period);
  }, [teamMemberFilter, departmentFilter, period]);

  // Compute all dashboard data from filtered portfolios
  const portfolioMetrics = useMemo(() => computePortfolioMetrics(filteredPortfolios), [filteredPortfolios]);
  const fixedIncomeMetrics = useMemo(() => computeFixedIncomeMetrics(filteredPortfolios), [filteredPortfolios]);
  const benchmarkComparison = useMemo(() => computeBenchmarkComparison(filteredPortfolios), [filteredPortfolios]);

  // Sort and paginate portfolios
  const sortedPortfolios = useMemo(() => {
    const sorted = [...filteredPortfolios].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (portfoliosSortColumn) {
        case 'positionCount':
          aVal = a.positions.length;
          bVal = b.positions.length;
          break;
        case 'internalClientName':
          aVal = a.internalClient.name;
          bVal = b.internalClient.name;
          break;
        case 'department':
          aVal = a.internalClient.gcgDepartment;
          bVal = b.internalClient.gcgDepartment;
          break;
        case 'loggedAt':
          aVal = new Date(a.loggedAt).getTime();
          bVal = new Date(b.loggedAt).getTime();
          break;
        case 'dataAsOf':
          aVal = new Date(a.dataAsOf).getTime();
          bVal = new Date(b.dataAsOf).getTime();
          break;
        default:
          aVal = String(a[portfoliosSortColumn as keyof LoggedPortfolio] ?? '');
          bVal = String(b[portfoliosSortColumn as keyof LoggedPortfolio] ?? '');
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return portfoliosSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return portfoliosSortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [filteredPortfolios, portfoliosSortColumn, portfoliosSortDirection]);

  const paginatedPortfolios = useMemo(() => {
    const start = (portfoliosPage - 1) * portfoliosPerPage;
    return sortedPortfolios.slice(start, start + portfoliosPerPage);
  }, [sortedPortfolios, portfoliosPage]);

  const totalPortfolioPages = Math.ceil(sortedPortfolios.length / portfoliosPerPage);

  const handlePortfolioSort = (column: SortColumn) => {
    if (portfoliosSortColumn === column) {
      setPortfoliosSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setPortfoliosSortColumn(column);
      setPortfoliosSortDirection('desc');
    }
  };

  return (
    <>
        {/* Top Bar with Filters */}
        <DashboardHeader
          title="Portfolio Trends"
          subtitle="Portfolio construction insights and client analytics"
          searchPlaceholder="Search clients, portfolios..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
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
          ]}
          period={period}
          onPeriodChange={setPeriod}
          periodOptions={filterOptions.periods}
          className="sticky top-0 z-10"
        />

        <div className="p-6 space-y-6">
          {/* ==================== SECTION 1: PORTFOLIO CONSTRUCTION ==================== */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Portfolio Construction Trends</h3>
              <span className="text-xs text-zinc-500 ml-2">How clients are building portfolios (1YR)</span>
            </div>

            {/* Charts Row: Style Map + Asset Class + Benchmark Delta */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Style Map - Market Cap vs P/B */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-white">Style Map</h4>
                      <p className="text-xs text-zinc-500">Avg client vs MSCI ACWI IMI (1YR)</p>
                    </div>
                    <Target className="w-4 h-4 text-zinc-500" />
                  </div>

                  <div className="flex">
                    <div className="flex items-center justify-center" style={{ width: '20px' }}>
                      <span className="-rotate-90 text-xs text-zinc-500 whitespace-nowrap">Wtd Avg Mkt Cap ($B)</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex">
                        <div className="flex flex-col justify-between text-right pr-2" style={{ width: '28px', height: '140px' }}>
                          <span className="text-xs text-zinc-600">600</span>
                          <span className="text-xs text-zinc-600">400</span>
                          <span className="text-xs text-zinc-600">200</span>
                        </div>

                        <div className="flex-1 relative border-l border-b border-zinc-700/50 overflow-hidden" style={{ height: '140px' }}>
                          <div className="absolute left-1/2 top-0 bottom-0 border-l border-zinc-800/30" />
                          <div className="absolute top-1/2 left-0 right-0 border-t border-zinc-800/30" />
                          <div className="absolute left-0 right-0 border-t border-zinc-500/50" style={{ top: '35%' }} />
                          <div className="absolute top-0 bottom-0 border-l border-zinc-500/50" style={{ left: '60%' }} />
                          <div
                            className="absolute w-4 h-4 rounded-full bg-zinc-500 border-2 border-zinc-400 z-10"
                            style={{ left: '60%', top: '35%', transform: 'translate(-50%, -50%)' }}
                          />
                          <div
                            className="absolute w-4 h-4 rounded-full bg-cyan-500 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 z-10"
                            style={{ left: '45%', top: '50%', transform: 'translate(-50%, -50%)' }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between pl-7 pr-0 mt-1">
                        <span className="text-xs text-zinc-600">2.0</span>
                        <span className="text-xs text-zinc-600">3.0</span>
                        <span className="text-xs text-zinc-600">4.0</span>
                      </div>

                      <div className="text-center mt-1">
                        <span className="text-xs text-zinc-500">Wtd Avg P/B</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-zinc-500 border border-zinc-400" />
                      <span className="text-xs text-zinc-400">MSCI ACWI IMI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-400" />
                      <span className="text-xs text-zinc-400">Avg Client</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profitability Map */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-white">Profitability Map</h4>
                      <p className="text-xs text-zinc-500">Avg client vs MSCI ACWI IMI (1YR)</p>
                    </div>
                    <Target className="w-4 h-4 text-zinc-500" />
                  </div>

                  <div className="flex">
                    <div className="flex items-center justify-center" style={{ width: '20px' }}>
                      <span className="-rotate-90 text-xs text-zinc-500 whitespace-nowrap">Wtd Avg Profitability</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex">
                        <div className="flex flex-col justify-between text-right pr-2" style={{ width: '28px', height: '140px' }}>
                          <span className="text-xs text-zinc-600">.60</span>
                          <span className="text-xs text-zinc-600">.45</span>
                          <span className="text-xs text-zinc-600">.30</span>
                        </div>

                        <div className="flex-1 relative border-l border-b border-zinc-700/50 overflow-hidden" style={{ height: '140px' }}>
                          <div className="absolute left-1/2 top-0 bottom-0 border-l border-zinc-800/30" />
                          <div className="absolute top-1/2 left-0 right-0 border-t border-zinc-800/30" />
                          <div className="absolute left-0 right-0 border-t border-zinc-500/50" style={{ top: '40%' }} />
                          <div className="absolute top-0 bottom-0 border-l border-zinc-500/50" style={{ left: '55%' }} />
                          <div
                            className="absolute w-4 h-4 rounded-full bg-zinc-500 border-2 border-zinc-400 z-10"
                            style={{ left: '55%', top: '40%', transform: 'translate(-50%, -50%)' }}
                          />
                          <div
                            className="absolute w-4 h-4 rounded-full bg-cyan-500 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 z-10"
                            style={{ left: '42%', top: '35%', transform: 'translate(-50%, -50%)' }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between pl-7 pr-0 mt-1">
                        <span className="text-xs text-zinc-600">2.0</span>
                        <span className="text-xs text-zinc-600">3.0</span>
                        <span className="text-xs text-zinc-600">4.0</span>
                      </div>

                      <div className="text-center mt-1">
                        <span className="text-xs text-zinc-500">Wtd Avg P/B</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-zinc-500 border border-zinc-400" />
                      <span className="text-xs text-zinc-400">MSCI ACWI IMI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-400" />
                      <span className="text-xs text-zinc-400">Avg Client</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benchmark Comparison */}
              <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-white">vs MSCI ACWI IMI</h4>
                      <p className="text-xs text-zinc-500">Regional delta to benchmark (1YR)</p>
                    </div>
                    <Target className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="space-y-3">
                    {benchmarkComparison.map((item) => (
                      <div key={item.metric} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">{item.metric}</span>
                          <span className={`font-medium font-mono ${item.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.delta >= 0 ? '+' : ''}{item.delta}%
                          </span>
                        </div>
                        <div className="flex gap-1 h-4">
                          <div
                            className="bg-cyan-500/80 rounded-sm"
                            style={{ width: `${item.client}%` }}
                            title={`Client: ${item.client}%`}
                          />
                          <div
                            className="bg-zinc-600/50 rounded-sm"
                            style={{ width: `${item.acwi}%` }}
                            title={`ACWI: ${item.acwi}%`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>Client: {item.client}%</span>
                          <span>ACWI: {item.acwi}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Equity Metrics Row */}
            <div className="grid grid-cols-4 gap-4 mt-4 mb-4">
              {portfolioMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-4 group hover:border-zinc-700/50 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-xs mb-1">{metric.label}</p>
                        <p className="text-xl font-bold text-white">{metric.value}</p>
                      </div>
                      <div className="text-right">
                        <span className={`flex items-center gap-1 text-xs font-medium ${metric.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {metric.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {metric.change}
                        </span>
                        {metric.benchmark && (
                          <span className="text-xs text-zinc-500">{metric.benchmark}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fixed Income Metrics Row */}
            <div className="grid grid-cols-3 gap-4">
              {fixedIncomeMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-4 group hover:border-zinc-700/50 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-xs mb-1">{metric.label}</p>
                        <p className="text-xl font-bold text-white">{metric.value}</p>
                      </div>
                      <div className="text-right">
                        <span className={`flex items-center gap-1 text-xs font-medium ${metric.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {metric.change !== '—' && (metric.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                          {metric.change}
                        </span>
                        <span className="text-xs text-zinc-500">{metric.benchmark}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================== SECTION 2: LOGGED PORTFOLIOS ==================== */}
          <div>
            <div className="flex items-center gap-2 mb-4 mt-8">
              <Briefcase className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Logged Portfolios</h3>
              <span className="text-xs text-zinc-500 ml-2">Client portfolios that have been analyzed ({filteredPortfolios.length} total)</span>
            </div>

            {/* Portfolios Table */}
            <div className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 min-h-[380px] flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Table Header with Fullscreen Toggle */}
              <div className="relative z-10 px-4 py-2 flex items-center justify-between border-b border-zinc-800/50 flex-shrink-0">
                <h4 className="text-sm font-medium text-white">Portfolios</h4>
                <button
                  onClick={() => setIsTableFullscreen(true)}
                  className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-white/[0.05] transition-colors"
                  title="Expand table"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 overflow-x-auto flex-1">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-800/30">
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('externalClient')}
                      >
                        <div className="flex items-center gap-1">
                          External Client
                          <SortIcon column="externalClient" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('internalClientName')}
                      >
                        <div className="flex items-center gap-1">
                          Internal Client
                          <SortIcon column="internalClientName" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('department')}
                      >
                        <div className="flex items-center gap-1">
                          Department
                          <SortIcon column="department" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('loggedBy')}
                      >
                        <div className="flex items-center gap-1">
                          Logged By
                          <SortIcon column="loggedBy" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('loggedAt')}
                      >
                        <div className="flex items-center gap-1">
                          Logged At
                          <SortIcon column="loggedAt" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('dataAsOf')}
                      >
                        <div className="flex items-center gap-1">
                          Data As Of
                          <SortIcon column="dataAsOf" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('positionCount')}
                      >
                        <div className="flex items-center gap-1">
                          Positions
                          <SortIcon column="positionCount" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                        Top Holdings
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {paginatedPortfolios.map((portfolio) => (
                      <React.Fragment key={portfolio.id}>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-white">{portfolio.externalClient}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-zinc-300">{portfolio.internalClient.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 ${
                              portfolio.internalClient.gcgDepartment === 'IAG'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : portfolio.internalClient.gcgDepartment === 'Broker-Dealer'
                                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {portfolio.internalClient.gcgDepartment}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-zinc-400">{portfolio.loggedBy}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-zinc-400">{portfolio.loggedAt}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-zinc-400">{portfolio.dataAsOf}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono text-zinc-300">{portfolio.positions.length}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              {portfolio.positions.slice(0, 3).map((pos, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded">
                                  {pos.ticker}
                                </span>
                              ))}
                              {portfolio.positions.length > 3 && (
                                <span className="text-xs text-zinc-500">+{portfolio.positions.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setExpandedPortfolioId(expandedPortfolioId === portfolio.id ? null : portfolio.id)}
                              className="p-1.5 hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              {expandedPortfolioId === portfolio.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                        {/* Expanded Row */}
                        {expandedPortfolioId === portfolio.id && (
                          <tr className="bg-zinc-900/40">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="grid grid-cols-3 gap-6">
                                {/* Positions List */}
                                <div>
                                  <h5 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">All Positions</h5>
                                  <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {portfolio.positions.map((pos, i) => (
                                      <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-cyan-400">{pos.ticker}</span>
                                          <span className="text-zinc-500 text-xs truncate max-w-[120px]">{pos.name}</span>
                                        </div>
                                        <span className="text-zinc-300 font-mono">{(pos.weight * 100).toFixed(1)}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Characteristics */}
                                <div>
                                  <h5 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Characteristics</h5>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Mkt Cap</span>
                                      <span className="text-zinc-300">${portfolio.characteristics.weightedAvgMarketCap.toFixed(0)}B</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">P/B</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.weightedAvgPB.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Value</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.valueAllocation}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Growth</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.growthAllocation}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">US</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.usEquityAllocation}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Dev ex-US</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.devExUsAllocation}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">EM</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.emAllocation}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Duration</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.duration.toFixed(1)} yrs</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Returns */}
                                <div>
                                  <h5 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Returns</h5>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">1 Year</span>
                                      <span className={portfolio.returns.oneYear !== null ? (portfolio.returns.oneYear >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}>
                                        {portfolio.returns.oneYear !== null ? `${portfolio.returns.oneYear.toFixed(1)}%` : '—'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">3 Year</span>
                                      <span className={portfolio.returns.threeYear !== null ? (portfolio.returns.threeYear >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}>
                                        {portfolio.returns.threeYear !== null ? `${portfolio.returns.threeYear.toFixed(1)}%` : '—'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">5 Year</span>
                                      <span className={portfolio.returns.fiveYear !== null ? (portfolio.returns.fiveYear >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}>
                                        {portfolio.returns.fiveYear !== null ? `${portfolio.returns.fiveYear.toFixed(1)}%` : '—'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">10 Year</span>
                                      <span className={portfolio.returns.tenYear !== null ? (portfolio.returns.tenYear >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}>
                                        {portfolio.returns.tenYear !== null ? `${portfolio.returns.tenYear.toFixed(1)}%` : '—'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPortfolioPages > 1 && (
                <div className="relative z-10 flex items-center justify-between px-4 py-3 border-t border-zinc-800/50">
                  <div className="text-xs text-zinc-500">
                    Showing {((portfoliosPage - 1) * portfoliosPerPage) + 1} to {Math.min(portfoliosPage * portfoliosPerPage, sortedPortfolios.length)} of {sortedPortfolios.length} portfolios
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPortfoliosPage(prev => Math.max(1, prev - 1))}
                      disabled={portfoliosPage === 1}
                      className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-zinc-400">
                      Page {portfoliosPage} of {totalPortfolioPages}
                    </span>
                    <button
                      onClick={() => setPortfoliosPage(prev => Math.min(totalPortfolioPages, prev + 1))}
                      disabled={portfoliosPage === totalPortfolioPages}
                      className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
                <h3 className="text-sm font-medium text-white">Logged Portfolios</h3>
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
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('externalClient')}
                      >
                        <div className="flex items-center gap-1">
                          External Client
                          <SortIcon column="externalClient" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('internalClientName')}
                      >
                        <div className="flex items-center gap-1">
                          Internal Client
                          <SortIcon column="internalClientName" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('department')}
                      >
                        <div className="flex items-center gap-1">
                          Department
                          <SortIcon column="department" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('loggedBy')}
                      >
                        <div className="flex items-center gap-1">
                          Logged By
                          <SortIcon column="loggedBy" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('loggedAt')}
                      >
                        <div className="flex items-center gap-1">
                          Logged At
                          <SortIcon column="loggedAt" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('dataAsOf')}
                      >
                        <div className="flex items-center gap-1">
                          Data As Of
                          <SortIcon column="dataAsOf" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th
                        className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-zinc-200"
                        onClick={() => handlePortfolioSort('positionCount')}
                      >
                        <div className="flex items-center gap-1">
                          Positions
                          <SortIcon column="positionCount" sortColumn={portfoliosSortColumn} sortDirection={portfoliosSortDirection} />
                        </div>
                      </th>
                      <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">
                        Top Holdings
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {paginatedPortfolios.map((portfolio) => (
                      <React.Fragment key={`fs-${portfolio.id}`}>
                        <tr className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-white">{portfolio.externalClient}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-zinc-300">{portfolio.internalClient.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 ${
                              portfolio.internalClient.gcgDepartment === 'IAG'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : portfolio.internalClient.gcgDepartment === 'Broker-Dealer'
                                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {portfolio.internalClient.gcgDepartment}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-zinc-400">{portfolio.loggedBy}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-zinc-400">{portfolio.loggedAt}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-zinc-400">{portfolio.dataAsOf}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono text-zinc-300">{portfolio.positions.length}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              {portfolio.positions.slice(0, 3).map((pos, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded">
                                  {pos.ticker}
                                </span>
                              ))}
                              {portfolio.positions.length > 3 && (
                                <span className="text-xs text-zinc-500">+{portfolio.positions.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setExpandedPortfolioId(expandedPortfolioId === portfolio.id ? null : portfolio.id)}
                              className="p-1.5 hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              {expandedPortfolioId === portfolio.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                        {/* Expanded Row */}
                        {expandedPortfolioId === portfolio.id && (
                          <tr className="bg-zinc-900/40">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="grid grid-cols-3 gap-6">
                                {/* Positions List */}
                                <div>
                                  <h5 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">All Positions</h5>
                                  <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {portfolio.positions.map((pos, i) => (
                                      <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-cyan-400">{pos.ticker}</span>
                                          <span className="text-zinc-500 text-xs truncate max-w-[120px]">{pos.name}</span>
                                        </div>
                                        <span className="text-zinc-300 font-mono">{(pos.weight * 100).toFixed(1)}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Characteristics */}
                                <div>
                                  <h5 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Characteristics</h5>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Mkt Cap</span>
                                      <span className="text-zinc-300">${portfolio.characteristics.weightedAvgMarketCap.toFixed(0)}B</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">P/B</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.weightedAvgPB.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Value</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.valueAllocation}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Growth</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.growthAllocation}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">US</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.usEquityAllocation}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Dev ex-US</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.devExUsAllocation}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">EM</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.emAllocation}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Duration</span>
                                      <span className="text-zinc-300">{portfolio.characteristics.duration.toFixed(1)} yrs</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Returns */}
                                <div>
                                  <h5 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Returns</h5>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">1 Year</span>
                                      <span className={portfolio.returns.oneYear !== null ? (portfolio.returns.oneYear >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}>
                                        {portfolio.returns.oneYear !== null ? `${portfolio.returns.oneYear.toFixed(1)}%` : '—'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">3 Year</span>
                                      <span className={portfolio.returns.threeYear !== null ? (portfolio.returns.threeYear >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}>
                                        {portfolio.returns.threeYear !== null ? `${portfolio.returns.threeYear.toFixed(1)}%` : '—'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">5 Year</span>
                                      <span className={portfolio.returns.fiveYear !== null ? (portfolio.returns.fiveYear >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}>
                                        {portfolio.returns.fiveYear !== null ? `${portfolio.returns.fiveYear.toFixed(1)}%` : '—'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">10 Year</span>
                                      <span className={portfolio.returns.tenYear !== null ? (portfolio.returns.tenYear >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-600'}>
                                        {portfolio.returns.tenYear !== null ? `${portfolio.returns.tenYear.toFixed(1)}%` : '—'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Fixed at bottom */}
              {totalPortfolioPages > 1 && (
                <div className="relative z-10 flex items-center justify-between px-4 py-3 border-t border-zinc-800/50 flex-shrink-0 bg-zinc-900">
                  <div className="text-xs text-zinc-500">
                    Showing {((portfoliosPage - 1) * portfoliosPerPage) + 1} to {Math.min(portfoliosPage * portfoliosPerPage, sortedPortfolios.length)} of {sortedPortfolios.length} portfolios
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPortfoliosPage(prev => Math.max(1, prev - 1))}
                      disabled={portfoliosPage === 1}
                      className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-zinc-400">
                      Page {portfoliosPage} of {totalPortfolioPages}
                    </span>
                    <button
                      onClick={() => setPortfoliosPage(prev => Math.min(totalPortfolioPages, prev + 1))}
                      disabled={portfoliosPage === totalPortfolioPages}
                      className="p-1.5 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
}

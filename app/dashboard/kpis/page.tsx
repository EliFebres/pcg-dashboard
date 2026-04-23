'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Inbox, Loader2 } from 'lucide-react';
import DashboardHeader from '@/app/components/dashboard/shared/DashboardHeader';
import ScopeSelector from '@/app/components/dashboard/kpis/ScopeSelector';
import HeroKPICards from '@/app/components/dashboard/kpis/HeroKPICards';
import JourneyExplorer from '@/app/components/dashboard/kpis/JourneyExplorer';
import GcgDeptChart from '@/app/components/dashboard/kpis/GcgDeptChart';
import NnaConcentrationCard from '@/app/components/dashboard/kpis/NnaConcentrationCard';
import ActivityHeatmap from '@/app/components/dashboard/kpis/ActivityHeatmap';
import InProgressTrendChart from '@/app/components/dashboard/kpis/InProgressTrendChart';
import IntakeYieldTable from '@/app/components/dashboard/kpis/IntakeYieldTable';
import AdHocChannelCard from '@/app/components/dashboard/kpis/AdHocChannelCard';
import StaleEngagementsTable from '@/app/components/dashboard/kpis/StaleEngagementsTable';
import DormantClientsTable from '@/app/components/dashboard/kpis/DormantClientsTable';
import TopTickersChart from '@/app/components/dashboard/kpis/TopTickersChart';
import PortfolioCoverageCard from '@/app/components/dashboard/kpis/PortfolioCoverageCard';
import DataQualityStrip from '@/app/components/dashboard/kpis/DataQualityStrip';
import { getKpiDashboardData, type KpiDashboardData, type KpiScope } from '@/app/lib/api/kpi';

const GCG_DEPT_OPTIONS = ['All Departments', 'IAG', 'Broker-Dealer', 'Institutional', 'Retirement Group'];
const INTAKE_OPTIONS = ['All Intake Types', 'IRQ', 'SERF', 'GCG Ad-Hoc'];

export default function KpiDashboard() {
  const [scope, setScope] = useState<KpiScope>('all');
  const [period, setPeriod] = useState('1Y');
  const [gcgDepts, setGcgDepts] = useState<string[]>([]);
  const [intakeTypes, setIntakeTypes] = useState<string[]>([]);

  const [data, setData] = useState<KpiDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    // Defer the setState so it's not synchronously inside the effect body,
    // matching the pattern used by the Client Interactions page.
    const id = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await getKpiDashboardData(
          { scope, period, gcgDepts, intakeTypes },
          controller.signal
        );
        setData(result);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to load KPI dashboard:', err);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 0);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [scope, period, gcgDepts, intakeTypes]);

  const subtitle = data?.scope.kind === 'team'
    ? `Team · ${data.scope.team}`
    : 'Cross-team aggregate';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent">
      <DashboardHeader
        title="Team KPIs"
        subtitle={subtitle}
        searchPlaceholder="Search (not used on KPI view)"
        searchValue=""
        onSearchChange={() => {}}
        alwaysShowFilters
        period={period}
        onPeriodChange={setPeriod}
        periodOptions={['1M', '3M', '6M', 'YTD', '1Y', 'ALL']}
        filters={[
          {
            id: 'gcg-dept',
            icon: Building2,
            label: 'GCG Department',
            options: GCG_DEPT_OPTIONS,
            value: gcgDepts,
            onChange: (v) => setGcgDepts(Array.isArray(v) ? v : []),
            multiSelect: true,
          },
          {
            id: 'intake',
            icon: Inbox,
            label: 'Intake Type',
            options: INTAKE_OPTIONS,
            value: intakeTypes,
            onChange: (v) => setIntakeTypes(Array.isArray(v) ? v : []),
            multiSelect: true,
          },
        ]}
        rightContent={
          <div className="flex items-center gap-3">
            {isLoading && (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading…
              </span>
            )}
            <span className="text-xs uppercase tracking-wider text-muted font-medium">Scope</span>
            <ScopeSelector value={scope} onChange={setScope} />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {data ? (
          <>
            <DataQualityStrip data={data.dataQuality} />

            <HeroKPICards heroKpis={data.heroKpis} />

            <JourneyExplorer sankey={data.journeySankey} templates={data.journeyTemplates} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <GcgDeptChart data={data.gcgDepts} />
              <NnaConcentrationCard data={data.nnaConcentration} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ActivityHeatmap data={data.activityHeatmap} />
              <InProgressTrendChart data={data.inProgressTrend} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <IntakeYieldTable data={data.intakeYield} />
              <AdHocChannelCard data={data.adHocChannels} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <StaleEngagementsTable data={data.staleEngagements} />
              <DormantClientsTable data={data.dormantClients} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <TopTickersChart data={data.topTickers} />
              <PortfolioCoverageCard data={data.portfolioCoverage} />
            </div>
          </>
        ) : !isLoading ? (
          <div className="py-20 text-center text-muted">Failed to load KPI data.</div>
        ) : null}
      </div>
    </div>
  );
}

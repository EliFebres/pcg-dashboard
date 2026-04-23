export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  kpiConstraint,
  isValidKpiScope,
  type KpiScope,
} from '@/app/lib/auth/require-auth';
import {
  computeHeroKpis,
  computeJourneySankey,
  computeJourneyTemplates,
  computeGcgDeptBreakdown,
  computeNnaConcentration,
  computeActivityHeatmap,
  computeInProgressTrend,
  computeIntakeYield,
  computeAdHocChannelHealth,
  computeStaleEngagements,
  computeDormantClients,
  computeTopTickers,
  computePortfolioCoverage,
  computeDataQuality,
} from '@/app/lib/db/kpi-aggregations';
import type { KpiFilters } from '@/app/lib/api/kpi';

// POST /api/kpi/dashboard
// Body: { scope, period, gcgDepts, intakeTypes }
// Returns team-level / cross-team KPI aggregates. No individual-level data.
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  let body: Partial<KpiFilters>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const scope = body.scope;
  if (!isValidKpiScope(scope)) {
    return NextResponse.json({ error: 'Invalid scope.' }, { status: 400 });
  }

  const filters: KpiFilters = {
    scope: scope as KpiScope,
    period: body.period || '1Y',
    gcgDepts: Array.isArray(body.gcgDepts) ? body.gcgDepts : [],
    intakeTypes: Array.isArray(body.intakeTypes) ? body.intakeTypes : [],
  };

  const constraints = kpiConstraint(filters.scope);

  try {
    const [
      heroKpis,
      journeySankey,
      journeyTemplates,
      gcgDepts,
      nnaConcentration,
      activityHeatmap,
      inProgressTrend,
      intakeYield,
      adHocChannels,
      staleEngagements,
      dormantClients,
      topTickers,
      portfolioCoverage,
      dataQuality,
    ] = await Promise.all([
      computeHeroKpis(filters, constraints),
      computeJourneySankey(filters, constraints),
      computeJourneyTemplates(filters, constraints),
      computeGcgDeptBreakdown(filters, constraints),
      computeNnaConcentration(filters, constraints),
      computeActivityHeatmap(filters, constraints),
      computeInProgressTrend(filters, constraints),
      computeIntakeYield(filters, constraints),
      computeAdHocChannelHealth(filters, constraints),
      computeStaleEngagements(filters, constraints),
      computeDormantClients(filters, constraints),
      computeTopTickers(filters, constraints),
      computePortfolioCoverage(filters, constraints),
      computeDataQuality(filters, constraints),
    ]);

    return NextResponse.json({
      scope: filters.scope === 'all'
        ? { kind: 'all' }
        : { kind: 'team', team: filters.scope.slice('team:'.length) },
      periodLabel: heroKpis.periodLabel,
      heroKpis,
      journeySankey,
      journeyTemplates,
      gcgDepts,
      nnaConcentration,
      activityHeatmap,
      inProgressTrend,
      intakeYield,
      adHocChannels,
      staleEngagements,
      dormantClients,
      topTickers,
      portfolioCoverage,
      dataQuality,
    });
  } catch (err) {
    console.error('POST /api/kpi/dashboard error:', err);
    return NextResponse.json({ error: 'Failed to load KPI dashboard data.' }, { status: 500 });
  }
}

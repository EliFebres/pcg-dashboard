export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import {
  computeMetrics,
  computeDepartmentBreakdown,
  computeContributionData,
  computeEngagementsList,
  STATIC_FILTER_OPTIONS,
} from '@/app/lib/db/aggregations';
import { getMockFilterOptions } from '@/app/lib/api/mock-computations';
import type { EngagementFilters } from '@/app/lib/api/client-interactions';

// POST /api/client-interactions/dashboard
// Body: EngagementFilters (camelCase)
// Returns all dashboard data in a single parallel request for fast initial page load.
export async function POST(req: NextRequest) {
  try {
    const filters: EngagementFilters = await req.json();

    const [metrics, departments, contributionData, engagements] = await Promise.all([
      computeMetrics(filters),
      computeDepartmentBreakdown(filters),
      computeContributionData(filters),
      computeEngagementsList(filters),
    ]);

    return NextResponse.json({
      metrics,
      departments,
      contributionData,
      engagements,
      filterOptions: process.env.DUCKDB_PATH ? STATIC_FILTER_OPTIONS : getMockFilterOptions(),
    });
  } catch (err) {
    console.error('POST /api/client-interactions/dashboard error:', err);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}

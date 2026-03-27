export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { computeContributionData } from '@/app/lib/db/aggregations';
import type { EngagementFilters } from '@/app/lib/api/client-interactions';

// POST /api/client-interactions/contribution-data
// Body: EngagementFilters (camelCase)
export async function POST(req: NextRequest) {
  try {
    const filters: EngagementFilters = await req.json();
    const data = await computeContributionData(filters);
    return NextResponse.json(data);
  } catch (err) {
    console.error('POST /api/client-interactions/contribution-data error:', err);
    return NextResponse.json({ error: 'Failed to compute contribution data' }, { status: 500 });
  }
}

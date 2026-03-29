export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { computeContributionData } from '@/app/lib/db/aggregations';
import { requireAuth, teamConstraint } from '@/app/lib/auth/require-auth';
import type { EngagementFilters } from '@/app/lib/api/client-interactions';

// POST /api/client-interactions/contribution-data
// Body: EngagementFilters (camelCase)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const sc = teamConstraint(auth.payload);

  try {
    const filters: EngagementFilters = await req.json();
    const data = await computeContributionData(filters, sc);
    return NextResponse.json(data);
  } catch (err) {
    console.error('POST /api/client-interactions/contribution-data error:', err);
    return NextResponse.json({ error: 'Failed to compute contribution data' }, { status: 500 });
  }
}

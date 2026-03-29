export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { computeDepartmentBreakdown } from '@/app/lib/db/aggregations';
import { requireAuth, teamConstraint } from '@/app/lib/auth/require-auth';
import type { EngagementFilters } from '@/app/lib/api/client-interactions';

// POST /api/client-interactions/departments
// Body: EngagementFilters (camelCase)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const sc = teamConstraint(auth.payload);

  try {
    const filters: EngagementFilters = await req.json();
    const departments = await computeDepartmentBreakdown(filters, sc);
    return NextResponse.json(departments);
  } catch (err) {
    console.error('POST /api/client-interactions/departments error:', err);
    return NextResponse.json({ error: 'Failed to compute department breakdown' }, { status: 500 });
  }
}

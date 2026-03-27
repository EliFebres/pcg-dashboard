export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { computeDepartmentBreakdown } from '@/app/lib/db/aggregations';
import type { EngagementFilters } from '@/app/lib/api/client-interactions';

// POST /api/client-interactions/departments
// Body: EngagementFilters (camelCase)
export async function POST(req: NextRequest) {
  try {
    const filters: EngagementFilters = await req.json();
    const departments = await computeDepartmentBreakdown(filters);
    return NextResponse.json(departments);
  } catch (err) {
    console.error('POST /api/client-interactions/departments error:', err);
    return NextResponse.json({ error: 'Failed to compute department breakdown' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/app/lib/db';

// PATCH /api/client-interactions/engagements/:id/nna
// Body: { nna: number | null }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.DUCKDB_PATH) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }
  try {
    const { id } = await params;
    const engagementId = Number(id);
    const { nna } = await req.json();

    await execute(
      `UPDATE engagements SET nna = ? WHERE id = ?`,
      [nna ?? null, engagementId]
    );

    return NextResponse.json({ id: engagementId, nna: nna ?? undefined });
  } catch (err) {
    console.error('PATCH .../nna error:', err);
    return NextResponse.json({ error: 'Failed to update NNA' }, { status: 500 });
  }
}

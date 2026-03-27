export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/app/lib/db';

// PATCH /api/client-interactions/engagements/:id/notes
// Body: { notes: string | null }
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
    const { notes } = await req.json();

    await execute(
      `UPDATE engagements SET notes = ? WHERE id = ?`,
      [notes || null, engagementId]
    );

    return NextResponse.json({ id: engagementId, notes: notes || '' });
  } catch (err) {
    console.error('PATCH .../notes error:', err);
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
  }
}

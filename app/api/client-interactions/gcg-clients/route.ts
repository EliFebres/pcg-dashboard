export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { engagements as mockEngagements } from '@/app/lib/data/engagements';

export async function GET() {
  try {
    if (!process.env.DUCKDB_DIR) {
      // Mock fallback: derive unique clients from in-memory mock data
      const clientMap = new Map<string, string>();
      mockEngagements.forEach(e => {
        clientMap.set(e.internalClient.name, e.internalClient.gcgDepartment);
      });
      const clients = Array.from(clientMap.entries())
        .map(([name, dept]) => ({ name, dept }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json({ clients });
    }

    const rows = await query<{ name: string; dept: string }>(
      `SELECT DISTINCT internal_client_name AS name, internal_client_dept AS dept
       FROM engagements
       ORDER BY internal_client_name ASC`
    );
    return NextResponse.json({ clients: rows });
  } catch (err) {
    console.error('[GET /api/client-interactions/gcg-clients]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

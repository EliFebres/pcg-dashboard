export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/app/lib/db';
import { verifyJWT, SESSION_COOKIE } from '@/app/lib/auth/jwt';
import type { NoteEntry } from '@/app/lib/types/engagements';

type RouteParams = { params: Promise<{ id: string; noteId: string }> };

function rowToNoteEntry(row: Record<string, unknown>): NoteEntry {
  return {
    id: Number(row.id),
    engagementId: Number(row.engagement_id),
    noteText: row.note_text as string,
    authorName: row.author_name as string,
    authorId: row.author_id as string,
    createdAt: String(row.created_at),
  };
}

// PATCH /api/client-interactions/engagements/:id/notes/:noteId
// Updates note text. Only the note's author may edit it.
// Body: { noteText: string }
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  if (!process.env.DUCKDB_DIR) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    let payload;
    try { payload = await verifyJWT(token); } catch {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }

    const { noteId } = await params;
    const id = Number(noteId);
    const { noteText } = await req.json();

    if (!noteText || !noteText.trim()) {
      return NextResponse.json({ error: 'noteText is required.' }, { status: 400 });
    }

    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM engagement_notes WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    }
    if (rows[0].author_id !== payload.sub) {
      return NextResponse.json({ error: 'You can only edit your own notes.' }, { status: 403 });
    }

    await execute(
      `UPDATE engagement_notes SET note_text = ? WHERE id = ?`,
      [noteText.trim(), id]
    );

    const updated = await query<Record<string, unknown>>(
      `SELECT * FROM engagement_notes WHERE id = ?`,
      [id]
    );
    return NextResponse.json(rowToNoteEntry(updated[0]));
  } catch (err) {
    console.error('PATCH .../notes/:noteId error:', err);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/client-interactions/engagements/:id/notes/:noteId
// Deletes a note. Only the note's author may delete it.
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  if (!process.env.DUCKDB_DIR) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    let payload;
    try { payload = await verifyJWT(token); } catch {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }

    const { id: engagementId, noteId } = await params;
    const id = Number(noteId);

    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM engagement_notes WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    }
    if (rows[0].author_id !== payload.sub) {
      return NextResponse.json({ error: 'You can only delete your own notes.' }, { status: 403 });
    }

    await execute(`DELETE FROM engagement_notes WHERE id = ?`, [id]);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('DELETE .../notes/:noteId error:', err);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}

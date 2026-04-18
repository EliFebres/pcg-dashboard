import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import { verifyJWT, SESSION_COOKIE } from '../auth/jwt';
import type { JWTPayload } from '../auth/jwt';
import { executeActivity } from '../db/activity';
import { emitActivityLog, type ActivityLogRow } from '../events';

export interface LogActivityParams {
  action: string;
  entityType?: string | null;
  entityId?: string | number | null;
  details?: Record<string, unknown> | null;
  // Use when the request isn't authenticated yet (e.g. failed login, signup).
  userOverride?: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
  };
}

function extractIp(req: NextRequest | null): string | null {
  if (!req) return null;
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? null;
}

function extractUserAgent(req: NextRequest | null): string | null {
  if (!req) return null;
  return req.headers.get('user-agent') ?? null;
}

async function resolvePayload(req: NextRequest | null): Promise<JWTPayload | null> {
  if (!req) return null;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyJWT(token);
  } catch {
    return null;
  }
}

export async function logActivity(
  req: NextRequest | null,
  params: LogActivityParams
): Promise<void> {
  try {
    const payload = await resolvePayload(req);

    const userId = params.userOverride?.id ?? payload?.sub ?? null;
    const userEmail = params.userOverride?.email ?? payload?.email ?? null;
    const userName = params.userOverride?.name
      ?? (payload ? `${payload.firstName} ${payload.lastName}`.trim() : null);

    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const entityId = params.entityId == null ? null : String(params.entityId);
    const detailsJson = params.details ? JSON.stringify(params.details) : null;
    const ip = extractIp(req);
    const userAgent = extractUserAgent(req);

    await executeActivity(
      `INSERT INTO activity_logs
       (id, timestamp, user_id, user_email, user_name, action, entity_type, entity_id, details, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        timestamp,
        userId,
        userEmail,
        userName,
        params.action,
        params.entityType ?? null,
        entityId,
        detailsJson,
        ip,
        userAgent,
      ]
    );

    const row: ActivityLogRow = {
      id,
      timestamp,
      userId,
      userEmail,
      userName,
      action: params.action,
      entityType: params.entityType ?? null,
      entityId,
      details: params.details ?? null,
      ip,
      userAgent,
    };
    emitActivityLog(row);
  } catch (err) {
    // Logging must never break the request path.
    console.error('[activity] logActivity failed:', err);
  }
}

export async function touchPresence(
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  try {
    await executeActivity(
      `INSERT OR REPLACE INTO user_presence (user_id, user_email, user_name, last_seen)
       VALUES (?, ?, ?, now())`,
      [userId, userEmail, userName]
    );
  } catch (err) {
    console.error('[activity] touchPresence failed:', err);
  }
}

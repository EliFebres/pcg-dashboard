import type { DuckDBConnection } from '@duckdb/node-api';
import path from 'path';
import fs from 'fs';
import { serializeWrite } from './writeQueue';
import { openDuckDbWithWalRecovery, registerCheckpointOnExit } from './shutdown';

const g = global as typeof globalThis & {
  _activityConnectionPromise?: Promise<DuckDBConnection>;
};

const QUEUE_KEY = 'activity';

async function columnExists(
  conn: DuckDBConnection,
  table: string,
  column: string,
): Promise<boolean> {
  const reader = await conn.runAndReadAll(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = ? AND column_name = ?`,
    [table, column],
  );
  return reader.getRowObjects().length > 0;
}

export async function getActivityConnection(): Promise<DuckDBConnection> {
  if (!g._activityConnectionPromise) {
    const p = (async () => {
      const dbDir = process.env.DUCKDB_DIR;
      if (!dbDir) throw new Error('DUCKDB_DIR environment variable is not set');

      const resolvedDir = path.resolve(dbDir);
      if (!fs.existsSync(resolvedDir)) {
        fs.mkdirSync(resolvedDir, { recursive: true });
      }
      const resolved = path.join(resolvedDir, 'activity.duckdb');

      // Activity is telemetry with 30-day retention — allow recreate as a last
      // resort if both WAL and main file are unrecoverable.
      const conn = await openDuckDbWithWalRecovery(resolved, {
        logTag: 'activity',
        allowRecreate: true,
      });

      await conn.run(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id           VARCHAR     PRIMARY KEY,
          timestamp    TIMESTAMPTZ NOT NULL DEFAULT now(),
          user_id      VARCHAR,
          user_email   VARCHAR,
          user_name    VARCHAR,
          user_office  VARCHAR,
          action       VARCHAR     NOT NULL,
          entity_type  VARCHAR,
          entity_id    VARCHAR,
          details      JSON,
          ip           VARCHAR,
          user_agent   VARCHAR
        )
      `);

      // Additive migration, gated on a column-existence check so we don't
      // churn the WAL with a failing ALTER on every boot.
      if (!(await columnExists(conn, 'activity_logs', 'user_office'))) {
        await conn.run(`ALTER TABLE activity_logs ADD COLUMN user_office VARCHAR`);
      }

      await conn.run(`CREATE INDEX IF NOT EXISTS idx_activity_ts     ON activity_logs (timestamp)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_activity_user   ON activity_logs (user_id)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_logs (action)`);

      // Retention: drop activity_logs older than 30 days on connection init.
      // Client Interactions (engagements) live in a separate DB and are untouched.
      try {
        await conn.run(`DELETE FROM activity_logs WHERE timestamp < now() - INTERVAL 30 DAY`);
      } catch (err) {
        console.error('[activity] retention cleanup failed at init:', err);
      }

      await conn.run(`
        CREATE TABLE IF NOT EXISTS user_presence (
          user_id    VARCHAR     PRIMARY KEY,
          user_email VARCHAR     NOT NULL,
          user_name  VARCHAR     NOT NULL,
          last_seen  TIMESTAMPTZ NOT NULL
        )
      `);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON user_presence (last_seen)`);

      // Flush any WAL content produced by schema work back into the main file.
      // Keeping the WAL small minimizes the replay surface if the next boot
      // follows an unclean shutdown.
      try { await conn.run(`CHECKPOINT`); } catch { /* best-effort */ }

      registerCheckpointOnExit('activity', conn);

      return conn;
    })();
    g._activityConnectionPromise = p;
    p.catch(() => { g._activityConnectionPromise = undefined; });
  }
  return g._activityConnectionPromise!;
}

export async function queryActivity<T = Record<string, unknown>>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<T[]> {
  const conn = await getActivityConnection();
  const reader = await conn.runAndReadAll(sql, params.length ? params : undefined);
  return reader.getRowObjects() as T[];
}

export async function executeActivity(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<void> {
  return serializeWrite(QUEUE_KEY, async () => {
    const conn = await getActivityConnection();
    await conn.run(sql, params.length ? params : undefined);
  });
}

// Use for mutations that return rows (UPDATE/DELETE/INSERT ... RETURNING).
// Goes through the activity write queue.
export async function queryWriteActivity<T = Record<string, unknown>>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<T[]> {
  return serializeWrite(QUEUE_KEY, async () => {
    const conn = await getActivityConnection();
    const reader = await conn.runAndReadAll(sql, params.length ? params : undefined);
    return reader.getRowObjects() as T[];
  });
}

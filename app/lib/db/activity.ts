import { DuckDBInstance } from '@duckdb/node-api';
import type { DuckDBConnection } from '@duckdb/node-api';
import path from 'path';
import fs from 'fs';
import { serializeWrite } from './writeQueue';

const g = global as typeof globalThis & {
  _activityConnectionPromise?: Promise<DuckDBConnection>;
  _activityShutdownHooked?: boolean;
};

const QUEUE_KEY = 'activity';

// True when the error message indicates DuckDB could not replay the WAL journal.
function isWalReplayError(err: unknown): boolean {
  const msg = String((err as Error | undefined)?.message ?? err);
  return msg.includes('replaying WAL') || msg.includes('WAL file');
}

// Open the activity DB with self-healing for corrupted WAL/DB files.
// Activity logs are telemetry with 30-day retention, so recreating the DB on
// unrecoverable corruption is an acceptable trade-off.
async function openActivityDb(filePath: string): Promise<DuckDBConnection> {
  try {
    const instance = await DuckDBInstance.create(filePath);
    return await instance.connect();
  } catch (err) {
    if (!isWalReplayError(err)) throw err;

    // First attempt: discard the WAL journal and retry. The main file may be fine.
    const walPath = `${filePath}.wal`;
    try { if (fs.existsSync(walPath)) fs.unlinkSync(walPath); } catch { /* ignore */ }
    try {
      const instance = await DuckDBInstance.create(filePath);
      const conn = await instance.connect();
      console.warn('[activity] recovered from corrupted WAL by discarding activity.duckdb.wal');
      return conn;
    } catch (err2) {
      if (!isWalReplayError(err2)) throw err2;
    }

    // Last resort: recreate the DB from scratch. Loses historical telemetry only.
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* ignore */ }
    try { if (fs.existsSync(walPath)) fs.unlinkSync(walPath); } catch { /* ignore */ }
    const instance = await DuckDBInstance.create(filePath);
    const conn = await instance.connect();
    console.warn('[activity] recovered from unrecoverable corruption by recreating activity.duckdb');
    return conn;
  }
}

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

      const conn = await openActivityDb(resolved);

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

      // Best-effort graceful shutdown: checkpoint on Ctrl+C / SIGTERM / process exit.
      // Guarded with a global flag so HMR in dev doesn't stack handlers.
      if (!g._activityShutdownHooked) {
        g._activityShutdownHooked = true;
        const checkpointAndExit = (signal: NodeJS.Signals | 'beforeExit') => {
          conn.run(`CHECKPOINT`)
            .catch(() => {})
            .finally(() => {
              if (signal === 'beforeExit') return;
              process.exit(0);
            });
        };
        process.once('SIGINT', () => checkpointAndExit('SIGINT'));
        process.once('SIGTERM', () => checkpointAndExit('SIGTERM'));
        process.once('beforeExit', () => checkpointAndExit('beforeExit'));
      }

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

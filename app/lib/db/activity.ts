import { DuckDBInstance } from '@duckdb/node-api';
import type { DuckDBConnection } from '@duckdb/node-api';
import path from 'path';
import fs from 'fs';

const g = global as typeof globalThis & {
  _activityConnectionPromise?: Promise<DuckDBConnection>;
};

let _activityWriteQueue: Promise<unknown> = Promise.resolve();

function serializedActivityWrite<T>(fn: () => Promise<T>): Promise<T> {
  const result = _activityWriteQueue.then(fn);
  _activityWriteQueue = result.then(() => {}, () => {});
  return result;
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

      const instance = await DuckDBInstance.create(resolved);
      const conn = await instance.connect();

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
      // Additive migration for pre-existing databases created before user_office existed.
      try { await conn.run(`ALTER TABLE activity_logs ADD COLUMN user_office VARCHAR`); } catch { /* already exists */ }
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
  return serializedActivityWrite(async () => {
    const conn = await getActivityConnection();
    await conn.run(sql, params.length ? params : undefined);
  });
}

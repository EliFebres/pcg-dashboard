import { DuckDBInstance } from '@duckdb/node-api';
import type { DuckDBConnection } from '@duckdb/node-api';
import path from 'path';
import fs from 'fs';

// Store on `global` so the connection survives Next.js hot reloads in dev mode.
const g = global as typeof globalThis & {
  _usersConnectionPromise?: Promise<DuckDBConnection>;
};

export async function getUsersConnection(): Promise<DuckDBConnection> {
  if (!g._usersConnectionPromise) {
    g._usersConnectionPromise = (async () => {
      const dbDir = process.env.DUCKDB_DIR;
      if (!dbDir) throw new Error('DUCKDB_DIR environment variable is not set');

      const resolvedDir = path.resolve(dbDir);
      if (!fs.existsSync(resolvedDir)) {
        fs.mkdirSync(resolvedDir, { recursive: true });
      }
      const resolved = path.join(resolvedDir, 'users.duckdb');

      const instance = await DuckDBInstance.create(resolved);
      const conn = await instance.connect();

      // Bootstrap schema on first connection — all statements are idempotent (IF NOT EXISTS)
      await conn.run(`
        CREATE TABLE IF NOT EXISTS users (
          id             VARCHAR     PRIMARY KEY,
          email          VARCHAR     NOT NULL UNIQUE,
          first_name     VARCHAR     NOT NULL,
          last_name      VARCHAR     NOT NULL,
          title          VARCHAR     NOT NULL,
          department     VARCHAR     NOT NULL DEFAULT 'ISG',
          team           VARCHAR     NOT NULL,
          office         VARCHAR     NOT NULL,
          role           VARCHAR     NOT NULL DEFAULT 'user',
          status         VARCHAR     NOT NULL DEFAULT 'pending',
          password_hash  VARCHAR     NOT NULL,
          created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          approved_at    TIMESTAMPTZ,
          approved_by_id VARCHAR
        )
      `);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_users_email  ON users (email)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_users_status ON users (status)`);

      return conn;
    })();
  }
  return g._usersConnectionPromise;
}

export async function queryUsers<T = Record<string, unknown>>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<T[]> {
  const conn = await getUsersConnection();
  const reader = await conn.runAndReadAll(sql, params.length ? params : undefined);
  return reader.getRowObjects() as T[];
}

export async function executeUsers(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<void> {
  const conn = await getUsersConnection();
  await conn.run(sql, params.length ? params : undefined);
}

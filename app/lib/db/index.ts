import { DuckDBInstance } from '@duckdb/node-api';
import type { DuckDBConnection } from '@duckdb/node-api';
import path from 'path';
import fs from 'fs';

// Store on `global` so the connection survives Next.js hot reloads in dev mode.
// Module-level variables get reset on each reload, leaving the old connection
// holding the file lock and causing "file already open" errors.
const g = global as typeof globalThis & {
  _engagementsConnectionPromise?: Promise<DuckDBConnection>;
};

export async function getConnection(): Promise<DuckDBConnection> {
  if (!g._engagementsConnectionPromise) {
    g._engagementsConnectionPromise = (async () => {
      const dbDir = process.env.DUCKDB_DIR;
      if (!dbDir) throw new Error('DUCKDB_DIR environment variable is not set');

      // Ensure the data directory exists before DuckDB tries to create the file
      const resolvedDir = path.resolve(dbDir);
      if (!fs.existsSync(resolvedDir)) {
        fs.mkdirSync(resolvedDir, { recursive: true });
      }
      const resolved = path.join(resolvedDir, 'engagements.duckdb');

      const instance = await DuckDBInstance.create(resolved);
      const conn = await instance.connect();

      // Bootstrap schema on first connection — all statements are idempotent (IF NOT EXISTS)
      await conn.run(`
        CREATE TABLE IF NOT EXISTS engagements (
          id                   INTEGER PRIMARY KEY,
          external_client      VARCHAR,
          internal_client_name VARCHAR    NOT NULL,
          internal_client_dept VARCHAR    NOT NULL,
          intake_type          VARCHAR    NOT NULL,
          ad_hoc_channel       VARCHAR,
          type                 VARCHAR    NOT NULL,
          team_members         VARCHAR    NOT NULL DEFAULT '[]',
          department           VARCHAR    NOT NULL,
          date_started         DATE       NOT NULL,
          date_finished        DATE,
          status               VARCHAR    NOT NULL,
          portfolio_logged     BOOLEAN    NOT NULL DEFAULT FALSE,
          portfolio            VARCHAR,
          nna                  BIGINT,
          notes                VARCHAR,
          tickers_mentioned    VARCHAR
        )
      `);
      await conn.run(`CREATE SEQUENCE IF NOT EXISTS engagements_id_seq START 1`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_date_started ON engagements (date_started)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_status       ON engagements (status)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_department   ON engagements (department)`);

      return conn;
    })();
  }
  return g._engagementsConnectionPromise;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<T[]> {
  const conn = await getConnection();
  const reader = await conn.runAndReadAll(sql, params.length ? params : undefined);
  // getRowObjects() returns column-name keyed objects; getRows() returns positional arrays
  return reader.getRowObjects() as T[];
}

export async function execute(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<void> {
  const conn = await getConnection();
  await conn.run(sql, params.length ? params : undefined);
}

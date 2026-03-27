import { DuckDBInstance } from '@duckdb/node-api';
import type { DuckDBConnection } from '@duckdb/node-api';
import path from 'path';
import fs from 'fs';

let connectionPromise: Promise<DuckDBConnection> | null = null;

export async function getConnection(): Promise<DuckDBConnection> {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      const dbPath = process.env.DUCKDB_PATH;
      if (!dbPath) throw new Error('DUCKDB_PATH environment variable is not set');

      const resolved = path.resolve(dbPath);

      // Ensure the parent directory exists before DuckDB tries to create the file
      const dir = path.dirname(resolved);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

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
  return connectionPromise;
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

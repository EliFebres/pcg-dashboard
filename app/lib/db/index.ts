import { DuckDBInstance } from '@duckdb/node-api';
import type { DuckDBConnection } from '@duckdb/node-api';
import path from 'path';
import fs from 'fs';
import { serializeWrite } from './writeQueue';

// Store on `global` so the connection survives Next.js hot reloads in dev mode.
// Module-level variables get reset on each reload, leaving the old connection
// holding the file lock and causing "file already open" errors.
const g = global as typeof globalThis & {
  _engagementsConnectionPromise?: Promise<DuckDBConnection>;
};

const QUEUE_KEY = 'engagements';

// Backwards-compat re-export for any legacy caller; new code should use the
// per-DB helpers below or `serializeWrite` from ./writeQueue directly.
export function serializedWrite<T>(fn: () => Promise<T>): Promise<T> {
  return serializeWrite(QUEUE_KEY, fn);
}

// Use for multi-statement transactions. Wraps the callback in a single serialized
// block so no other write can interleave between BEGIN and COMMIT.
export async function executeTransaction(
  fn: (conn: DuckDBConnection) => Promise<void>
): Promise<void> {
  return serializeWrite(QUEUE_KEY, async () => {
    const conn = await getConnection();
    await conn.run('BEGIN');
    try {
      await fn(conn);
      await conn.run('COMMIT');
    } catch (err) {
      await conn.run('ROLLBACK');
      throw err;
    }
  });
}

export async function getConnection(): Promise<DuckDBConnection> {
  if (!g._engagementsConnectionPromise) {
    const p = (async () => {
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
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_date_started    ON engagements (date_started)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_status           ON engagements (status)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_department       ON engagements (department)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_date_finished    ON engagements (date_finished)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_intake_type      ON engagements (intake_type)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_started_status   ON engagements (date_started, status)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_dept_started     ON engagements (internal_client_dept, date_started)`);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_date_fin_started ON engagements (date_finished, date_started)`);

      // Optimistic locking: version counter — incremented on every update.
      // Allows concurrent edits to detect conflicts instead of silently overwriting each other.
      // Use information_schema check instead of ALTER TABLE ADD COLUMN IF NOT EXISTS
      // because older DuckDB versions don't support that syntax.
      const versionCheck = await conn.runAndReadAll(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'engagements' AND column_name = 'version'`
      );
      if (versionCheck.getRowObjects().length === 0) {
        await conn.run(`ALTER TABLE engagements ADD COLUMN version INTEGER DEFAULT 1`);
      }

      // Engagement notes — append-only log with author attribution
      await conn.run(`CREATE SEQUENCE IF NOT EXISTS engagement_notes_id_seq START 1`);
      await conn.run(`
        CREATE TABLE IF NOT EXISTS engagement_notes (
          id            INTEGER     PRIMARY KEY DEFAULT nextval('engagement_notes_id_seq'),
          engagement_id INTEGER     NOT NULL,
          note_text     VARCHAR     NOT NULL,
          author_name   VARCHAR     NOT NULL,
          author_id     VARCHAR     NOT NULL,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await conn.run(`CREATE INDEX IF NOT EXISTS idx_engagement_notes_engagement_id ON engagement_notes (engagement_id)`);

      // One-time migration: copy legacy free-text notes into the new log table.
      // Guard: only migrate engagements that have no entries yet, so re-runs are safe.
      await conn.run(`
        INSERT INTO engagement_notes (engagement_id, note_text, author_name, author_id, created_at)
        SELECT id, notes, 'Imported Note', 'system', now()
        FROM engagements
        WHERE notes IS NOT NULL
          AND notes != ''
          AND id NOT IN (SELECT DISTINCT engagement_id FROM engagement_notes)
      `);

      // One-time migration: rename department value 'Institution' → 'Institutional'
      await conn.run(`UPDATE engagements SET internal_client_dept = 'Institutional' WHERE internal_client_dept = 'Institution'`);

      // One-time migration: add team column for team-based data isolation
      const teamCheck = await conn.runAndReadAll(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'engagements' AND column_name = 'team'`
      );
      if (teamCheck.getRowObjects().length === 0) {
        await conn.run(`ALTER TABLE engagements ADD COLUMN team VARCHAR`);
        // All existing rows are PCG data — backfill accordingly
        await conn.run(`UPDATE engagements SET team = 'Portfolio Consulting Group' WHERE team IS NULL`);
        await conn.run(`CREATE INDEX IF NOT EXISTS idx_team ON engagements (team)`);
      }

      // One-time migration: add creator tracking columns
      const creatorCheck = await conn.runAndReadAll(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'engagements' AND column_name = 'created_by_id'`
      );
      if (creatorCheck.getRowObjects().length === 0) {
        await conn.run(`ALTER TABLE engagements ADD COLUMN created_by_id VARCHAR`);
        await conn.run(`ALTER TABLE engagements ADD COLUMN created_by_name VARCHAR`);
      }

      return conn;
    })();
    g._engagementsConnectionPromise = p;
    // If bootstrap fails, clear the cached promise so the next request retries
    // instead of permanently returning a rejected promise.
    p.catch(() => { g._engagementsConnectionPromise = undefined; });
  }
  return g._engagementsConnectionPromise!;
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

// Use for mutations that return rows (UPDATE/DELETE/INSERT ... RETURNING).
// Goes through the engagements write queue so it can't interleave with other writes.
export async function queryWrite<T = Record<string, unknown>>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<T[]> {
  return serializeWrite(QUEUE_KEY, async () => {
    const conn = await getConnection();
    const reader = await conn.runAndReadAll(sql, params.length ? params : undefined);
    return reader.getRowObjects() as T[];
  });
}

export async function execute(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<void> {
  return serializeWrite(QUEUE_KEY, async () => {
    const conn = await getConnection();
    await conn.run(sql, params.length ? params : undefined);
  });
}

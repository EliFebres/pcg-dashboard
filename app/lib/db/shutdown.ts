import { DuckDBInstance } from '@duckdb/node-api';
import type { DuckDBConnection } from '@duckdb/node-api';
import fs from 'fs';

// Stored on `global` so HMR reloads reuse the same registry and signal handlers
// aren't stacked each time a db module re-imports this file.
const g = global as typeof globalThis & {
  _dbShutdownHooks?: Map<string, DuckDBConnection>;
  _dbShutdownInstalled?: boolean;
};

function isWalReplayError(err: unknown): boolean {
  const msg = String((err as Error | undefined)?.message ?? err);
  return msg.includes('replaying WAL') || msg.includes('WAL file');
}

function timestampSuffix(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

// Open a DuckDB file. If the initial open fails with a WAL-replay error, rename
// the offending .wal aside (preserving it for manual inspection / backup
// restore) and retry. For DBs where losing the whole file is acceptable (e.g.
// activity telemetry), pass { allowRecreate: true } to unlink the main file as
// a last resort. For DBs with real user data, leave allowRecreate: false so we
// fail loudly instead of silently destroying it.
export async function openDuckDbWithWalRecovery(
  filePath: string,
  opts: { logTag: string; allowRecreate?: boolean },
): Promise<DuckDBConnection> {
  const { logTag, allowRecreate = false } = opts;

  try {
    const instance = await DuckDBInstance.create(filePath);
    return await instance.connect();
  } catch (err) {
    if (!isWalReplayError(err)) throw err;

    const walPath = `${filePath}.wal`;
    if (fs.existsSync(walPath)) {
      const savedPath = `${walPath}.corrupt-${timestampSuffix()}`;
      try {
        fs.renameSync(walPath, savedPath);
        console.warn(`[${logTag}] WAL replay failed; renamed ${walPath} aside to ${savedPath}`);
      } catch (renameErr) {
        console.error(`[${logTag}] could not rename corrupt WAL aside:`, renameErr);
        throw err;
      }
    }

    try {
      const instance = await DuckDBInstance.create(filePath);
      const conn = await instance.connect();
      console.warn(`[${logTag}] recovered from corrupted WAL by renaming it aside`);
      return conn;
    } catch (err2) {
      if (!isWalReplayError(err2)) throw err2;

      if (!allowRecreate) {
        console.error(
          `[${logTag}] unrecoverable WAL corruption AND main DB appears damaged. ` +
          `Auto-recreate is disabled for this database to prevent data loss. ` +
          `Stop the server and run 'npm run db:restore' to restore the most recent backup.`
        );
        throw err2;
      }

      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* ignore */ }
      const instance = await DuckDBInstance.create(filePath);
      const conn = await instance.connect();
      console.warn(`[${logTag}] recovered from unrecoverable corruption by recreating ${filePath}`);
      return conn;
    }
  }
}

function installProcessHandlersOnce(): void {
  if (g._dbShutdownInstalled) return;
  g._dbShutdownInstalled = true;

  const checkpointAll = async (): Promise<void> => {
    const hooks = g._dbShutdownHooks;
    if (!hooks || hooks.size === 0) return;
    await Promise.all(
      Array.from(hooks.entries()).map(async ([name, conn]) => {
        try {
          await conn.run(`CHECKPOINT`);
        } catch (err) {
          console.error(`[${name}] CHECKPOINT on shutdown failed:`, err);
        }
      }),
    );
  };

  const onSignal = () => {
    checkpointAll().finally(() => process.exit(0));
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
  // beforeExit runs when the loop is empty — flush but don't force-exit,
  // Node may still have legitimate work queued.
  process.once('beforeExit', () => { checkpointAll(); });
}

// Register a connection to be CHECKPOINTed on Ctrl+C / SIGTERM / beforeExit.
// Keyed by name so HMR re-registrations replace rather than duplicate.
export function registerCheckpointOnExit(
  name: string,
  conn: DuckDBConnection,
): void {
  if (!g._dbShutdownHooks) g._dbShutdownHooks = new Map();
  g._dbShutdownHooks.set(name, conn);
  installProcessHandlersOnce();
}

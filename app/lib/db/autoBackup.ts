import fs from 'fs';
import path from 'path';
import type { DuckDBConnection } from '@duckdb/node-api';
import { runBackup, type LiveSources } from './backupCore';
import { getUsersConnectionIfOpen } from './users';
import { getActivityConnectionIfOpen } from './activity';

const MARKER_FILE = '.last-auto-backup';
// Fire once per day. 20h (not 24h) so a user who starts the server at ~8am
// today and ~9am tomorrow still gets a second snapshot.
const INTERVAL_MS = 20 * 3600 * 1000;

// Hoisted on global so HMR reloads share the in-flight promise and we never
// run two auto-backups in parallel.
const g = global as typeof globalThis & {
  _autoBackupInFlight?: Promise<void> | null;
};

// Called once per day from the engagements connection bootstrap. Fire-and-
// forget: any error is logged and swallowed so a backup failure can never
// prevent the app from serving requests. The caller passes in its own
// connection (engagements) so the backup can copy the live DB without needing
// to re-enter getConnection() mid-bootstrap.
export function maybeRunDailyAutoBackup(
  engagementsConn?: DuckDBConnection,
): Promise<void> {
  if (g._autoBackupInFlight) return g._autoBackupInFlight;

  const p = (async () => {
    const dbDir = process.env.DUCKDB_DIR;
    const backupDir = process.env.BACKUP_DIR;
    if (!dbDir || !backupDir) return;

    const resolvedBackup = path.resolve(backupDir);
    const resolvedDb = path.resolve(dbDir);
    try {
      fs.mkdirSync(resolvedBackup, { recursive: true });
    } catch (err) {
      console.error('[auto-backup] could not create BACKUP_DIR:', err);
      return;
    }

    const marker = path.join(resolvedBackup, MARKER_FILE);
    try {
      if (fs.existsSync(marker)) {
        const raw = fs.readFileSync(marker, 'utf8').trim();
        const last = Number(raw);
        if (Number.isFinite(last) && Date.now() - last < INTERVAL_MS) return;
      }
    } catch {
      /* corrupt marker — just proceed and overwrite it */
    }

    // Gather live connections so the copy goes through DuckDB's ATTACH/COPY
    // path instead of fs.copyFileSync, which fails with EBUSY on Windows while
    // the DB file is held open. Users/activity are opportunistic — only
    // included if their connection has already been initialized elsewhere.
    const liveSources: LiveSources = {};
    if (engagementsConn) liveSources['engagements.duckdb'] = engagementsConn;
    const usersPromise = getUsersConnectionIfOpen();
    if (usersPromise) {
      try { liveSources['users.duckdb'] = await usersPromise; }
      catch { /* bootstrap failed — fall back to fs copy */ }
    }
    const activityPromise = getActivityConnectionIfOpen();
    if (activityPromise) {
      try { liveSources['activity.duckdb'] = await activityPromise; }
      catch { /* bootstrap failed — fall back to fs copy */ }
    }

    try {
      const result = await runBackup({
        dbDir: resolvedDb,
        backupDir: resolvedBackup,
        liveSources,
        log: (m) => console.log('[auto-backup]', m),
      });
      if (result.skipped) {
        console.warn('[auto-backup] snapshot skipped:', result.skipReason);
        // Deliberately do NOT touch the marker on skip — we want to keep
        // retrying so the user sees the warning on every boot until resolved.
        return;
      }
      if (result.backupPath) {
        fs.writeFileSync(marker, String(Date.now()));
        console.log(
          `[auto-backup] snapshot created: ${path.basename(result.backupPath)}` +
            (result.prunedCount ? ` (pruned ${result.prunedCount} old)` : '')
        );
      }
    } catch (err) {
      console.error('[auto-backup] failed:', err);
    }
  })();

  g._autoBackupInFlight = p;
  p.finally(() => { g._autoBackupInFlight = null; });
  return p;
}

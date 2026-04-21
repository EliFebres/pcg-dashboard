import fs from 'fs';
import path from 'path';
import type { DuckDBConnection } from '@duckdb/node-api';

export const DB_FILES = ['engagements.duckdb', 'users.duckdb', 'activity.duckdb'] as const;

// Map keyed by DB filename (e.g. 'engagements.duckdb') → its live connection.
// When a connection is supplied, runBackup copies via DuckDB's own ATTACH/COPY
// mechanism instead of fs.copyFileSync — necessary on Windows where the open
// DB file is exclusively locked by the running server.
export type LiveSources = Partial<Record<(typeof DB_FILES)[number], DuckDBConnection>>;

// Folder-name pattern for auto-backups. pre-restore-* snapshots and any other
// human-named folders intentionally don't match this and are never auto-pruned.
export const AUTO_BACKUP_PATTERN = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;

export const DEFAULT_RETENTION_DAYS = 14;

// Schema-only DuckDB files (no rows) are ~12KB. Any DB with real data is
// comfortably above this threshold. Used to detect "empty-DB" snapshots so we
// don't overwrite the backup history with them.
export const EMPTY_DB_THRESHOLD_BYTES = 30 * 1024;

type Logger = (msg: string) => void;

function pad(n: number): string { return String(n).padStart(2, '0'); }

export function backupTimestamp(d: Date = new Date()): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  );
}

export function isAutoBackupDir(name: string): boolean {
  return AUTO_BACKUP_PATTERN.test(name);
}

export function fileSize(p: string): number {
  try { return fs.statSync(p).size; } catch { return 0; }
}

export function copyIfExists(src: string, dest: string): boolean {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

// Copy a DuckDB file that's currently open by the app. Uses the live connection
// to CHECKPOINT (flush WAL into main), then ATTACH the destination path and
// COPY FROM DATABASE into it. This is the only reliable way to snapshot an open
// DB on Windows, where the main file is held with an exclusive lock.
export async function copyLiveDuckDb(
  conn: DuckDBConnection,
  destPath: string,
): Promise<void> {
  await conn.run(`CHECKPOINT`);
  // ATTACH refuses to overwrite an existing file — clear any stale target first.
  if (fs.existsSync(destPath)) fs.unlinkSync(destPath);

  const srcReader = await conn.runAndReadAll(`SELECT current_database() AS db`);
  const srcAlias = String((srcReader.getRowObjects()[0] as { db: string }).db);

  const bakAlias = `bak_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  // ATTACH doesn't support bound parameters for the path — interpolate, with
  // forward slashes (Windows-safe) and single-quote escaping.
  const sqlPath = destPath.replace(/\\/g, '/').replace(/'/g, "''");
  await conn.run(`ATTACH '${sqlPath}' AS ${bakAlias}`);
  try {
    await conn.run(`COPY FROM DATABASE "${srcAlias}" TO ${bakAlias}`);
  } finally {
    try { await conn.run(`DETACH ${bakAlias}`); } catch { /* best-effort */ }
  }
}

export function listAutoBackups(backupDir: string): string[] {
  if (!fs.existsSync(backupDir)) return [];
  return fs.readdirSync(backupDir).filter(isAutoBackupDir).sort();
}

export function mostRecentAutoBackup(backupDir: string): string | null {
  const all = listAutoBackups(backupDir);
  return all.length === 0 ? null : path.join(backupDir, all[all.length - 1]);
}

function parseBackupFolderDate(name: string): Date | null {
  const m = name.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
}

export interface BackupResult {
  backupPath: string | null;
  skipped: boolean;
  skipReason?: string;
  prunedCount: number;
}

// Take a pre-restore safety snapshot. Folder name starts with 'pre-restore-'
// so it never matches AUTO_BACKUP_PATTERN and is never auto-pruned.
export function takePreRestoreSnapshot(
  dbDir: string,
  backupDir: string,
): string {
  const target = path.join(backupDir, `pre-restore-${backupTimestamp()}`);
  fs.mkdirSync(target, { recursive: true });
  for (const f of DB_FILES) {
    const src = path.join(dbDir, f);
    copyIfExists(src, path.join(target, f));
    copyIfExists(`${src}.wal`, path.join(target, `${f}.wal`));
  }
  return target;
}

// Copy the DB files (main + WAL) into a new timestamped folder under backupDir,
// then prune old folders older than retentionDays. Refuses to snapshot an
// apparently-empty DB over a non-empty history unless `force` is true.
export async function runBackup(opts: {
  dbDir: string;
  backupDir: string;
  retentionDays?: number;
  force?: boolean;
  log?: Logger;
  liveSources?: LiveSources;
}): Promise<BackupResult> {
  const {
    dbDir,
    backupDir,
    retentionDays = DEFAULT_RETENTION_DAYS,
    force = false,
    log = () => {},
    liveSources = {},
  } = opts;

  fs.mkdirSync(backupDir, { recursive: true });

  if (!force) {
    const currentEngagements = path.join(dbDir, 'engagements.duckdb');
    const currentSize = fileSize(currentEngagements);
    const lastDir = mostRecentAutoBackup(backupDir);
    if (lastDir) {
      const lastSize = fileSize(path.join(lastDir, 'engagements.duckdb'));
      if (currentSize < EMPTY_DB_THRESHOLD_BYTES && lastSize >= EMPTY_DB_THRESHOLD_BYTES) {
        const reason =
          `engagements.duckdb is ${currentSize} bytes (appears empty) but the most recent backup ` +
          `is ${lastSize} bytes. Refusing to overwrite the backup history with an empty snapshot. ` +
          `Pass { force: true } or use '--force' on the CLI to override.`;
        log(`SKIP: ${reason}`);
        return { backupPath: null, skipped: true, skipReason: reason, prunedCount: 0 };
      }
    }
  }

  const ts = backupTimestamp();
  const target = path.join(backupDir, ts);
  fs.mkdirSync(target);

  let any = false;
  for (const f of DB_FILES) {
    const src = path.join(dbDir, f);
    const destMain = path.join(target, f);
    const liveConn = liveSources[f];

    if (liveConn) {
      // Live DB: use DuckDB's own copy mechanism; the source file is locked by
      // the running server, so fs.copyFileSync would fail with EBUSY on Windows.
      // After CHECKPOINT inside copyLiveDuckDb, the WAL is empty, so there's
      // nothing to copy separately.
      try {
        await copyLiveDuckDb(liveConn, destMain);
        const sz = (fs.statSync(destMain).size / 1024).toFixed(1);
        log(`  ✓ ${f} (${sz} KB, live copy)`);
        any = true;
      } catch (err) {
        log(`  ! ${f} live copy failed: ${(err as Error).message}`);
      }
      continue;
    }

    const copiedMain = copyIfExists(src, destMain);
    const copiedWal  = copyIfExists(`${src}.wal`, path.join(target, `${f}.wal`));
    if (copiedMain) {
      const sz = (fs.statSync(src).size / 1024).toFixed(1);
      log(`  ✓ ${f} (${sz} KB)${copiedWal ? ' + .wal' : ''}`);
      any = true;
    } else {
      log(`  - ${f} not found, skipped`);
    }
  }

  if (!any) {
    fs.rmSync(target, { recursive: true });
    log('No database files found. Nothing to back up.');
    return { backupPath: null, skipped: true, skipReason: 'no source files', prunedCount: 0 };
  }

  const cutoff = Date.now() - retentionDays * 24 * 3600 * 1000;
  let pruned = 0;
  for (const name of fs.readdirSync(backupDir)) {
    if (!isAutoBackupDir(name)) continue;   // skip pre-restore-*, custom names, etc.
    if (name === ts) continue;              // never prune the one we just made
    const folderDate = parseBackupFolderDate(name);
    if (folderDate && folderDate.getTime() < cutoff) {
      fs.rmSync(path.join(backupDir, name), { recursive: true });
      log(`  ✗ pruned ${name}`);
      pruned++;
    }
  }

  return { backupPath: target, skipped: false, prunedCount: pruned };
}

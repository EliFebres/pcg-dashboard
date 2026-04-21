import fs from 'fs';
import path from 'path';

export const DB_FILES = ['engagements.duckdb', 'users.duckdb', 'activity.duckdb'] as const;

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
}): Promise<BackupResult> {
  const {
    dbDir,
    backupDir,
    retentionDays = DEFAULT_RETENTION_DAYS,
    force = false,
    log = () => {},
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
    const copiedMain = copyIfExists(src, path.join(target, f));
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

/**
 * =============================================================================
 * DuckDB Backup Script
 * =============================================================================
 *
 * Copies the DuckDB database files to a timestamped backup directory and
 * prunes old backups, keeping the 8 most recent (≈ 2 months at weekly cadence).
 *
 * Usage:
 *   npm run db:backup
 *
 * Requires in .env.local:
 *   DUCKDB_DIR  — path to directory containing the .duckdb files
 *   BACKUP_DIR  — path to directory where backups will be stored
 *
 * Backup format:
 *   <BACKUP_DIR>/
 *     2026-03-27_02-00-00/
 *       engagements.duckdb
 *       engagements.duckdb.wal   (if present)
 *       users.duckdb
 *       users.duckdb.wal         (if present)
 *       manifest.json
 *
 * Safe to run while the app is running — DuckDB ensures the main .duckdb file
 * is always in a consistent state. If a .wal file exists, it is copied too so
 * the backup pair can self-recover on first open.
 * =============================================================================
 */

// Load .env.local before anything else
import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';

const KEEP_BACKUPS = 8;
const DB_FILES = ['engagements.duckdb', 'users.duckdb'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function timestamp(): string {
  const d = new Date();
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  );
}

function isBackupDir(name: string): boolean {
  return /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(name);
}

function copyIfExists(src: string, dest: string): boolean {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

async function main() {
  const dbDir = process.env.DUCKDB_DIR;
  const backupDir = process.env.BACKUP_DIR;

  if (!dbDir) {
    console.error('ERROR: DUCKDB_DIR is not set. Add it to .env.local');
    process.exit(1);
  }
  if (!backupDir) {
    console.error('ERROR: BACKUP_DIR is not set. Add it to .env.local');
    process.exit(1);
  }

  const resolvedDbDir = path.resolve(dbDir);
  const resolvedBackupDir = path.resolve(backupDir);

  if (!fs.existsSync(resolvedDbDir)) {
    console.error(`ERROR: DUCKDB_DIR does not exist: ${resolvedDbDir}`);
    process.exit(1);
  }

  // Create the root backup directory if needed
  fs.mkdirSync(resolvedBackupDir, { recursive: true });

  // Create timestamped backup subdirectory
  const ts = timestamp();
  const backupTarget = path.join(resolvedBackupDir, ts);
  fs.mkdirSync(backupTarget);

  console.log(`\nPCG Dashboard — Database Backup`);
  console.log(`  Source : ${resolvedDbDir}`);
  console.log(`  Dest   : ${backupTarget}`);
  console.log('');

  const manifest: { timestamp: string; files: { file: string; copied: boolean }[] } = {
    timestamp: new Date().toISOString(),
    files: [],
  };

  let anyFileCopied = false;
  for (const dbFile of DB_FILES) {
    const srcMain = path.join(resolvedDbDir, dbFile);
    const srcWal  = `${srcMain}.wal`;

    const copiedMain = copyIfExists(srcMain, path.join(backupTarget, dbFile));
    const copiedWal  = copyIfExists(srcWal,  path.join(backupTarget, `${dbFile}.wal`));

    manifest.files.push({ file: dbFile, copied: copiedMain });
    if (copiedWal) manifest.files.push({ file: `${dbFile}.wal`, copied: true });

    if (copiedMain) {
      const size = (fs.statSync(srcMain).size / 1024).toFixed(1);
      console.log(`  ✓ ${dbFile} (${size} KB)${copiedWal ? ' + .wal' : ''}`);
      anyFileCopied = true;
    } else {
      console.log(`  - ${dbFile} not found, skipped`);
    }
  }

  // Write manifest
  fs.writeFileSync(
    path.join(backupTarget, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  if (!anyFileCopied) {
    // Nothing was backed up — remove the empty directory
    fs.rmSync(backupTarget, { recursive: true });
    console.log('\nNo database files found. Nothing to back up.');
    process.exit(0);
  }

  console.log('');

  // Prune old backups — keep the KEEP_BACKUPS most recent
  const allBackups = fs
    .readdirSync(resolvedBackupDir)
    .filter(isBackupDir)
    .sort()
    .reverse(); // newest first

  const toDelete = allBackups.slice(KEEP_BACKUPS);
  if (toDelete.length > 0) {
    console.log(`  Pruning ${toDelete.length} old backup(s) (keeping ${KEEP_BACKUPS}):`);
    for (const old of toDelete) {
      fs.rmSync(path.join(resolvedBackupDir, old), { recursive: true });
      console.log(`    ✗ ${old}`);
    }
    console.log('');
  }

  console.log(`Backup complete. ${allBackups.length - toDelete.length} backup(s) retained.\n`);
}

main().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});

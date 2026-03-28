/**
 * =============================================================================
 * DuckDB Restore Script
 * =============================================================================
 *
 * Restores database files from a backup created by backup-db.ts.
 *
 * Usage:
 *   npm run db:restore                          # Restore most recent backup (both DBs)
 *   npm run db:restore -- --backup 2026-03-27_02-00-00
 *   npm run db:restore -- --db engagements
 *   npm run db:restore -- --db users
 *   npm run db:restore -- --yes                 # Skip confirmation prompt
 *
 * IMPORTANT: Stop the app server before restoring.
 * DuckDB requires exclusive access to write to the database files.
 * =============================================================================
 */

// Load .env.local before anything else
import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const DB_FILES = ['engagements.duckdb', 'users.duckdb'];

function isBackupDir(name: string): boolean {
  return /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(name);
}

function getArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
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

  if (!fs.existsSync(resolvedBackupDir)) {
    console.error(`ERROR: BACKUP_DIR does not exist: ${resolvedBackupDir}`);
    console.error('Run "npm run db:backup" first.');
    process.exit(1);
  }

  // List available backups
  const backups = fs
    .readdirSync(resolvedBackupDir)
    .filter(isBackupDir)
    .sort()
    .reverse(); // newest first

  if (backups.length === 0) {
    console.error('No backups found in BACKUP_DIR.');
    process.exit(1);
  }

  // Determine which backup to restore
  const requestedBackup = getArg('--backup');
  let chosen: string;
  if (requestedBackup) {
    if (!backups.includes(requestedBackup)) {
      console.error(`ERROR: Backup "${requestedBackup}" not found.`);
      console.error('\nAvailable backups:');
      backups.forEach((b, i) => console.error(`  ${i === 0 ? '(latest) ' : '         '}${b}`));
      process.exit(1);
    }
    chosen = requestedBackup;
  } else {
    chosen = backups[0]; // default: most recent
  }

  // Determine which databases to restore
  const dbArg = getArg('--db');
  let filesToRestore: string[];
  if (!dbArg || dbArg === 'both') {
    filesToRestore = DB_FILES;
  } else if (dbArg === 'engagements') {
    filesToRestore = ['engagements.duckdb'];
  } else if (dbArg === 'users') {
    filesToRestore = ['users.duckdb'];
  } else {
    console.error(`ERROR: Unknown --db value "${dbArg}". Use: engagements, users, or both`);
    process.exit(1);
  }

  const chosenDir = path.join(resolvedBackupDir, chosen);

  console.log(`\nPCG Dashboard — Database Restore`);
  console.log(`  Backup : ${chosen}`);
  console.log(`  Target : ${resolvedDbDir}`);
  console.log(`  Files  : ${filesToRestore.join(', ')}`);
  console.log('');
  console.log('  ⚠  STOP THE APP SERVER before continuing.');
  console.log('     Restoring while the app is running will cause data corruption.');
  console.log('');

  // Confirm unless --yes flag is provided
  if (!hasFlag('--yes')) {
    const ok = await confirm('  Proceed with restore? (y/N) ');
    if (!ok) {
      console.log('\nRestore cancelled.');
      process.exit(0);
    }
    console.log('');
  }

  // Ensure data directory exists
  fs.mkdirSync(resolvedDbDir, { recursive: true });

  // Restore each file
  for (const dbFile of filesToRestore) {
    const srcMain = path.join(chosenDir, dbFile);
    const srcWal  = `${srcMain}.wal`;
    const destMain = path.join(resolvedDbDir, dbFile);
    const destWal  = `${destMain}.wal`;

    if (!fs.existsSync(srcMain)) {
      console.log(`  - ${dbFile} not in this backup, skipped`);
      continue;
    }

    // Remove any existing WAL file first (stale WAL from old DB would corrupt restore)
    if (fs.existsSync(destWal)) {
      fs.rmSync(destWal);
    }

    fs.copyFileSync(srcMain, destMain);
    const size = (fs.statSync(destMain).size / 1024).toFixed(1);

    if (fs.existsSync(srcWal)) {
      fs.copyFileSync(srcWal, destWal);
      console.log(`  ✓ ${dbFile} (${size} KB) + .wal`);
    } else {
      console.log(`  ✓ ${dbFile} (${size} KB)`);
    }
  }

  console.log('\nRestore complete. You can now restart the app server.\n');
}

main().catch(err => {
  console.error('Restore failed:', err);
  process.exit(1);
});

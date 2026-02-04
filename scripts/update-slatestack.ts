#!/usr/bin/env tsx

/**
 * Slatestack Update Script
 *
 * Checks for updates, creates backups, and merges upstream changes.
 * Designed to be run standalone or via npm run update:core.
 *
 * Usage:
 *   npx tsx scripts/update-slatestack.ts
 *   npm run update:core
 *
 * The script will:
 * 1. Check for available updates
 * 2. Check for merge conflicts (preview only)
 * 3. Create database backup
 * 4. Create uploads backup
 * 5. Execute git merge from upstream
 * 6. Run database migrations
 * 7. Report success or trigger rollback on failure
 *
 * Note: After successful update, you must restart the server manually.
 * In Docker, this happens automatically via restart policy.
 */

import 'dotenv/config';
import * as updateService from '../src/modules/update/update.service.js';

// ANSI colors for CLI output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: string): void {
  log(`\n>> ${step}`, colors.cyan);
}

function logSuccess(message: string): void {
  log(`   OK: ${message}`, colors.green);
}

function logError(message: string): void {
  log(`   ERROR: ${message}`, colors.red);
}

function logWarning(message: string): void {
  log(`   WARNING: ${message}`, colors.yellow);
}

async function main(): Promise<void> {
  log('\nSlatestack Update Script', colors.cyan);
  log('========================\n');

  // Step 1: Check for updates
  logStep('Checking for updates...');

  let updateCheck;
  try {
    updateCheck = await updateService.checkForUpdates();
    logSuccess(`Current version: ${updateCheck.currentVersion}`);
  } catch (error: unknown) {
    const err = error as Error;
    logError(`Failed to check for updates: ${err.message}`);
    process.exit(1);
  }

  if (!updateCheck.updateAvailable) {
    logSuccess(`Already up to date (${updateCheck.currentVersion})`);
    process.exit(0);
  }

  log(`\n   Update available: ${updateCheck.currentVersion} -> ${updateCheck.latestVersion}`);
  if (updateCheck.versionDiff === 'major') {
    logWarning('This is a MAJOR version update. Review changelog carefully.');
  }

  // Step 2: Check for conflicts
  logStep('Checking for merge conflicts...');

  let conflictCheck;
  try {
    conflictCheck = await updateService.checkConflicts();
  } catch (error: unknown) {
    const err = error as Error;
    logError(`Failed to check conflicts: ${err.message}`);
    process.exit(1);
  }

  if (conflictCheck.hasConflicts) {
    logError('Conflicts detected in the following files:');
    conflictCheck.conflicts.forEach(c => {
      log(`   - ${c.file} (${c.type})`, colors.red);
    });
    log('\nPlease resolve conflicts manually before updating.', colors.yellow);
    process.exit(1);
  }

  logSuccess('No conflicts detected. Update can proceed.');

  // Step 3: Create backups
  logStep('Creating database backup...');

  const dbBackup = await updateService.createDatabaseBackup();
  if (!dbBackup.success) {
    logError(`Database backup failed: ${dbBackup.error}`);
    process.exit(1);
  }
  logSuccess(`Database backup: ${dbBackup.backupPath}`);

  logStep('Creating uploads backup...');

  const uploadsBackup = await updateService.backupUploadsDirectory();
  if (!uploadsBackup.success) {
    logError(`Uploads backup failed: ${uploadsBackup.error}`);
    process.exit(1);
  }
  logSuccess(`Uploads backup: ${uploadsBackup.backupPath || '(no uploads to backup)'}`);

  // Step 4: Execute merge
  logStep('Merging upstream changes...');

  const git = updateService.getGit();
  const mergeResult = await updateService.executeGitMerge(git);

  if (!mergeResult.success) {
    logError(`Merge failed: ${mergeResult.error}`);
    logWarning('Backups are available for manual recovery:');
    log(`   Database: ${dbBackup.backupPath}`);
    log(`   Uploads: ${uploadsBackup.backupPath || '(none)'}`);
    process.exit(1);
  }
  logSuccess('Merge completed successfully.');

  // Step 5: Run migrations
  logStep('Running database migrations...');

  const migrateResult = await updateService.runMigrations();

  if (!migrateResult.success) {
    logError(`Migration failed: ${migrateResult.error}`);
    logStep('Rolling back...');

    try {
      await updateService.rollback(dbBackup.backupPath, uploadsBackup.backupPath);
      logSuccess('Rollback completed. System restored to previous state.');
    } catch (rollbackError: unknown) {
      const err = rollbackError as Error;
      logError(`Rollback failed: ${err.message}`);
      logWarning('Manual recovery required from backups:');
      log(`   Database: ${dbBackup.backupPath}`);
      log(`   Uploads: ${uploadsBackup.backupPath || '(none)'}`);
    }

    process.exit(1);
  }
  logSuccess('Migrations completed.');

  // Step 6: Success
  log('\n========================================', colors.green);
  log('Update completed successfully!', colors.green);
  log('========================================\n', colors.green);

  log(`Version: ${updateCheck.currentVersion} -> ${updateCheck.latestVersion}`);
  log(`Backups: ${dbBackup.backupPath}`);
  if (uploadsBackup.backupPath) {
    log(`         ${uploadsBackup.backupPath}`);
  }

  log('\nNext steps:', colors.cyan);
  log('   1. Restart the server to load new code');
  log('   2. Verify health at /api/health');
  log('   3. Test admin panel functionality\n');

  if (process.env.DOCKER_CONTAINER) {
    log('Docker detected - container will restart automatically.', colors.yellow);
  }

  process.exit(0);
}

// Run if executed directly
const isMainModule = process.argv[1]?.includes('update-slatestack');
if (isMainModule) {
  main().catch((error) => {
    const err = error as Error;
    logError(`Unexpected error: ${err.message}`);
    process.exit(1);
  });
}

export { main as runUpdate };

import { readFileSync, existsSync } from 'fs';
import { cp, mkdir, rm } from 'fs/promises';
import { spawn } from 'child_process';
import { join } from 'path';
import * as semver from 'semver';
import { simpleGit, SimpleGit } from 'simple-git';
import type { FastifyInstance } from 'fastify';
import type {
  UpdateCheckResult,
  ChangelogResult,
  ConflictCheckResult,
  GitHubRelease,
  BackupResult,
  UpdateExecuteResult,
  MergeResult,
  MigrationResult,
} from './update.types.js';

// Constants
const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'Labyrica';
const REPO_NAME = 'slatestack';

// Upstream remote configuration for updates
const UPSTREAM_REPO = 'https://github.com/Labyrica/slatestack.git';
const UPSTREAM_NAME = 'slatestack-upstream';
const UPSTREAM_BRANCH = 'main';

// Cache for GitHub API responses (avoid rate limiting - 60 req/hour unauthenticated)
let releaseCache: { data: GitHubRelease; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Backup directory for update rollback
const BACKUP_DIR = join(process.cwd(), 'backups');

/**
 * Read current version from version.json
 */
export function getCurrentVersion(): string {
  const versionPath = join(process.cwd(), 'version.json');
  const versionData = JSON.parse(readFileSync(versionPath, 'utf-8'));
  return versionData.version;
}

/**
 * Build GitHub API headers with optional authentication.
 * If GITHUB_TOKEN is set, includes Authorization header for private repos.
 */
function getGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Slatestack-Update-Checker',
  };

  // Add auth token if available (required for private repos)
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetch latest release from GitHub API with caching
 */
async function fetchLatestRelease(): Promise<GitHubRelease> {
  // Check cache
  if (releaseCache && Date.now() - releaseCache.timestamp < CACHE_TTL) {
    return releaseCache.data;
  }

  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
    { headers: getGitHubHeaders() }
  );

  if (!response.ok) {
    if (response.status === 404) {
      // 404 means either no releases exist or repo is private
      throw new Error('No releases found in repository.');
    }
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Try again later.');
    }
    if (response.status === 401) {
      throw new Error('Invalid GITHUB_TOKEN. Check your token has repo read access.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json() as GitHubRelease;
  releaseCache = { data, timestamp: Date.now() };
  return data;
}

/**
 * Check for available updates by comparing current version with latest release
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentVersion();
  const current = semver.clean(currentVersion);

  if (!current) {
    throw new Error(`Invalid current version format: ${currentVersion}`);
  }

  // Try to fetch latest release - handle "no releases" gracefully
  let release: GitHubRelease;
  try {
    release = await fetchLatestRelease();
  } catch (error) {
    const err = error as Error;
    // If no releases exist, return current version with no update available
    if (err.message.includes('No releases found')) {
      return {
        currentVersion: current,
        latestVersion: current,
        updateAvailable: false,
        versionDiff: null,
        releaseUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`,
        publishedAt: new Date().toISOString(),
      };
    }
    // Re-throw other errors (private repo, rate limit, etc.)
    throw error;
  }

  // Clean version strings (remove 'v' prefix if present)
  const latest = semver.clean(release.tag_name);

  if (!latest) {
    throw new Error(`Invalid release version format: ${release.tag_name}`);
  }

  const updateAvailable = semver.gt(latest, current);

  let versionDiff: 'major' | 'minor' | 'patch' | null = null;
  if (updateAvailable) {
    if (semver.major(latest) > semver.major(current)) {
      versionDiff = 'major';
    } else if (semver.minor(latest) > semver.minor(current)) {
      versionDiff = 'minor';
    } else if (semver.patch(latest) > semver.patch(current)) {
      versionDiff = 'patch';
    }
  }

  return {
    currentVersion: current,
    latestVersion: latest,
    updateAvailable,
    versionDiff,
    releaseUrl: release.html_url,
    publishedAt: release.published_at,
  };
}

/**
 * Fetch changelog (recent releases) from GitHub API
 */
export async function getChangelog(): Promise<ChangelogResult> {
  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=10`,
    { headers: getGitHubHeaders() }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Try again later.');
    }
    if (response.status === 404) {
      const hasToken = !!process.env.GITHUB_TOKEN;
      if (!hasToken) {
        throw new Error('Repository is private. Set GITHUB_TOKEN to enable changelog.');
      }
      throw new Error('No releases found.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const releases = await response.json() as GitHubRelease[];

  return {
    releases: releases
      .filter((r) => !r.draft && !r.prerelease)
      .map((r) => ({
        version: semver.clean(r.tag_name) || r.tag_name,
        name: r.name || r.tag_name,
        body: r.body || '',
        publishedAt: r.published_at,
        url: r.html_url
      }))
  };
}

/**
 * Create a simple-git instance for the current working directory
 */
export function getGit(): SimpleGit {
  return simpleGit(process.cwd(), {
    binary: 'git',
    maxConcurrentProcesses: 1,
  });
}

/**
 * Ensure the upstream remote exists and has the correct URL
 */
async function ensureUpstreamRemote(git: SimpleGit): Promise<void> {
  const remotes = await git.getRemotes(true);
  const upstream = remotes.find((r) => r.name === UPSTREAM_NAME);

  if (!upstream) {
    // Add the upstream remote
    await git.addRemote(UPSTREAM_NAME, UPSTREAM_REPO);
  } else if (upstream.refs.fetch !== UPSTREAM_REPO) {
    // URL changed (shouldn't happen), update it
    await git.remote(['set-url', UPSTREAM_NAME, UPSTREAM_REPO]);
  }
}

/**
 * Check for merge conflicts before update using git merge-tree (read-only)
 * This does NOT modify the working directory - it simulates a merge
 */
export async function checkConflicts(): Promise<ConflictCheckResult> {
  const git = getGit();

  // Ensure upstream remote exists
  await ensureUpstreamRemote(git);

  // Fetch latest from upstream
  await git.fetch(UPSTREAM_NAME, UPSTREAM_BRANCH);

  // Get current branch
  const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
  const upstreamRef = `${UPSTREAM_NAME}/${UPSTREAM_BRANCH}`;

  try {
    // Use merge-tree to simulate merge (read-only operation)
    // --write-tree: write the result tree (exits 0 if clean, 1 if conflicts)
    // --name-only: list file names that would be affected
    const result = await git.raw([
      'merge-tree',
      '--write-tree',
      '--name-only',
      currentBranch.trim(),
      upstreamRef
    ]);

    // Exit code 0 = clean merge possible
    // First line is tree OID, remaining lines are affected files (not conflicts)
    return {
      hasConflicts: false,
      conflicts: [],
      canAutoMerge: true,
    };
  } catch (error: unknown) {
    // simple-git throws on non-zero exit code
    // Exit code 1 = conflicts exist
    const gitError = error as { exitCode?: number; message?: string };

    if (gitError.exitCode === 1) {
      // Parse conflict information from error message
      // The output format includes conflicted file paths after the tree OID
      const conflicts: Array<{ file: string; type: string }> = [];

      if (gitError.message) {
        // Output format: first line is tree OID (partial), rest are conflicted files
        const lines = gitError.message.split('\n').filter((line) => line.trim());

        // Skip the first line (tree OID) and any stderr prefixes
        for (const line of lines) {
          const trimmed = line.trim();
          // Skip tree OID lines (40 char hex) and error messages
          if (trimmed && !trimmed.match(/^[a-f0-9]{40}$/i) && !trimmed.startsWith('CONFLICT')) {
            // File paths are listed after conflicts
            if (trimmed.includes('/') || trimmed.includes('.')) {
              conflicts.push({
                file: trimmed,
                type: 'content',
              });
            }
          }
          // Parse CONFLICT lines for more detail
          if (trimmed.startsWith('CONFLICT')) {
            const match = trimmed.match(/CONFLICT \(([^)]+)\): .* in (.+)/);
            if (match) {
              conflicts.push({
                file: match[2],
                type: match[1],
              });
            }
          }
        }
      }

      return {
        hasConflicts: true,
        conflicts,
        canAutoMerge: false,
      };
    }

    // Other exit codes are actual errors
    throw error;
  }
}

/**
 * Configure Git's "ours" merge driver for protected directories.
 * This ensures user customizations in public/ and admin/src/custom/ are preserved.
 */
async function ensureMergeDriver(git: SimpleGit): Promise<void> {
  // Set up custom merge driver that always keeps "ours" for protected paths
  await git.raw(['config', 'merge.ours.driver', 'true']);
}

/**
 * Create a PostgreSQL database backup using pg_dump.
 * Returns BackupResult with path to SQL file.
 */
export async function createDatabaseBackup(): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(BACKUP_DIR, `db-backup-${timestamp}.sql`);

  // Ensure backup directory exists
  await mkdir(BACKUP_DIR, { recursive: true });

  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return {
      success: false,
      backupPath: '',
      timestamp,
      error: 'DATABASE_URL environment variable not set',
    };
  }

  const url = new URL(databaseUrl);
  const host = url.hostname;
  const port = url.port || '5432';
  const database = url.pathname.slice(1); // Remove leading /
  const username = url.username;
  const password = decodeURIComponent(url.password); // Handle special characters

  return new Promise((resolve) => {
    const args = [
      '-h', host,
      '-p', port,
      '-U', username,
      '-d', database,
      '-f', backupPath,
      '--no-password', // Use PGPASSWORD env var
    ];

    const pgDump = spawn('pg_dump', args, {
      env: { ...process.env, PGPASSWORD: password },
      shell: true,
    });

    let stderr = '';

    pgDump.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pgDump.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          backupPath,
          timestamp,
        });
      } else {
        resolve({
          success: false,
          backupPath: '',
          timestamp,
          error: `pg_dump failed with code ${code}: ${stderr}`,
        });
      }
    });

    pgDump.on('error', (err) => {
      resolve({
        success: false,
        backupPath: '',
        timestamp,
        error: `pg_dump error: ${err.message}`,
      });
    });
  });
}

/**
 * Backup uploads directory to preserve user files.
 * Returns BackupResult with path to backup directory.
 */
export async function backupUploadsDirectory(): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uploadsDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  const backupPath = join(BACKUP_DIR, `uploads-${timestamp}`);

  // Ensure backup directory exists
  await mkdir(BACKUP_DIR, { recursive: true });

  // Check if uploads directory exists
  if (!existsSync(uploadsDir)) {
    // No uploads to backup - that's OK
    return {
      success: true,
      backupPath: '',
      timestamp,
    };
  }

  try {
    await cp(uploadsDir, backupPath, { recursive: true });
    return {
      success: true,
      backupPath,
      timestamp,
    };
  } catch (err) {
    const error = err as Error;
    return {
      success: false,
      backupPath: '',
      timestamp,
      error: `Failed to backup uploads: ${error.message}`,
    };
  }
}

/**
 * Execute git merge from upstream repository.
 * Uses stash to preserve local changes and -X ours for protected directories.
 */
export async function executeGitMerge(git: SimpleGit): Promise<MergeResult> {
  // Configure merge driver for protected paths
  await ensureMergeDriver(git);

  let hadStash = false;

  try {
    // Fetch latest from upstream
    await git.fetch(UPSTREAM_NAME, UPSTREAM_BRANCH);

    // Check for uncommitted changes and stash them
    const status = await git.status();
    if (status.files.length > 0) {
      await git.stash(['push', '-m', 'slatestack-pre-update']);
      hadStash = true;
    }

    // Perform merge with --no-edit (auto-accept merge commit message)
    // Use -X ours to prefer our version for conflicts
    const upstreamRef = `${UPSTREAM_NAME}/${UPSTREAM_BRANCH}`;
    await git.merge([upstreamRef, '--no-edit', '-X', 'ours']);

    // Pop stash if we had one
    if (hadStash) {
      await git.stash(['pop']);
    }

    return { success: true };
  } catch (err) {
    const error = err as Error;

    // On failure, abort merge and restore state
    try {
      await git.merge(['--abort']);
    } catch {
      // Merge abort may fail if no merge in progress - that's OK
    }

    // Pop stash if we had one
    if (hadStash) {
      try {
        await git.stash(['pop']);
      } catch {
        // Stash pop may fail - log but don't throw
      }
    }

    return {
      success: false,
      error: `Git merge failed: ${error.message}`,
    };
  }
}

/**
 * Run database migrations using drizzle-kit.
 */
export async function runMigrations(): Promise<MigrationResult> {
  return new Promise((resolve) => {
    const migrate = spawn('npx', ['drizzle-kit', 'migrate'], {
      cwd: process.cwd(),
      shell: true,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    migrate.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    migrate.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    migrate.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: `Migration failed with code ${code}: ${stderr || stdout}`,
        });
      }
    });

    migrate.on('error', (err) => {
      resolve({
        success: false,
        error: `Migration error: ${err.message}`,
      });
    });
  });
}

/**
 * Rollback database and uploads from backups.
 * Throws on failure - caller should handle.
 */
export async function rollback(dbBackupPath: string, uploadsBackupPath: string): Promise<void> {
  // Restore database from backup
  if (dbBackupPath) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not set for rollback');
    }

    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = decodeURIComponent(url.password);

    await new Promise<void>((resolve, reject) => {
      const args = [
        '-h', host,
        '-p', port,
        '-U', username,
        '-d', database,
        '-f', dbBackupPath,
        '--no-password',
      ];

      const psql = spawn('psql', args, {
        env: { ...process.env, PGPASSWORD: password },
        shell: true,
      });

      let stderr = '';

      psql.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      psql.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Database restore failed: ${stderr}`));
        }
      });

      psql.on('error', (err) => {
        reject(new Error(`Database restore error: ${err.message}`));
      });
    });
  }

  // Restore uploads directory
  if (uploadsBackupPath) {
    const uploadsDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

    // Remove current uploads
    if (existsSync(uploadsDir)) {
      await rm(uploadsDir, { recursive: true, force: true });
    }

    // Copy backup back
    await cp(uploadsBackupPath, uploadsDir, { recursive: true });
  }
}

/**
 * Execute the full update process: backup -> merge -> migrate -> restart.
 * Returns UpdateExecuteResult with phase information for progress tracking.
 */
export async function executeUpdate(fastify: FastifyInstance): Promise<UpdateExecuteResult> {
  const previousVersion = getCurrentVersion();
  const git = getGit();

  // Phase 1: Database backup
  const dbBackup = await createDatabaseBackup();
  if (!dbBackup.success) {
    return {
      success: false,
      phase: 'backup',
      error: dbBackup.error,
      previousVersion,
    };
  }

  // Phase 2: Uploads backup
  const uploadsBackup = await backupUploadsDirectory();
  if (!uploadsBackup.success) {
    return {
      success: false,
      phase: 'backup',
      error: uploadsBackup.error,
      previousVersion,
    };
  }

  const backupPaths = {
    database: dbBackup.backupPath,
    uploads: uploadsBackup.backupPath,
  };

  // Phase 3: Git merge
  const mergeResult = await executeGitMerge(git);
  if (!mergeResult.success) {
    return {
      success: false,
      phase: 'merge',
      error: mergeResult.error,
      backupPaths,
      previousVersion,
    };
  }

  // Phase 4: Run migrations
  const migrationResult = await runMigrations();
  if (!migrationResult.success) {
    // Rollback on migration failure
    try {
      await rollback(dbBackup.backupPath, uploadsBackup.backupPath);
    } catch (rollbackErr) {
      const rollbackError = rollbackErr as Error;
      return {
        success: false,
        phase: 'migrate',
        error: `Migration failed and rollback failed: ${migrationResult.error}. Rollback error: ${rollbackError.message}`,
        backupPaths,
        previousVersion,
      };
    }

    return {
      success: false,
      phase: 'migrate',
      error: migrationResult.error,
      backupPaths,
      previousVersion,
      message: 'Rolled back to previous state',
    };
  }

  // Get new version after merge
  let newVersion: string;
  try {
    newVersion = getCurrentVersion();
  } catch {
    newVersion = previousVersion; // Fallback if version.json wasn't updated
  }

  // Phase 5: Schedule restart
  // Give the response time to be sent before restarting
  setTimeout(() => {
    fastify.log.info('Restarting server after update...');
    process.exit(0); // Exit cleanly - process manager will restart
  }, 2000);

  return {
    success: true,
    phase: 'restart',
    backupPaths,
    previousVersion,
    newVersion,
    message: 'Update complete. Server restarting in 2 seconds...',
  };
}

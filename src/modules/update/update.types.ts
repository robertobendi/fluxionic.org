export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  versionDiff: 'major' | 'minor' | 'patch' | null;
  releaseUrl: string;
  publishedAt: string;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: Array<{ file: string; type: string }>;
  canAutoMerge: boolean;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
}

export interface ChangelogResult {
  releases: Array<{
    version: string;
    name: string;
    body: string;
    publishedAt: string;
    url: string;
  }>;
}

export interface BackupResult {
  success: boolean;
  backupPath: string;
  timestamp: string;
  error?: string;
}

export interface UpdateExecuteResult {
  success: boolean;
  phase: 'backup' | 'merge' | 'migrate' | 'restart' | 'health' | 'complete';
  error?: string;
  backupPaths?: {
    database: string;
    uploads: string;
  };
  previousVersion: string;
  newVersion?: string;
  message?: string;
}

export interface MergeResult {
  success: boolean;
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  error?: string;
}

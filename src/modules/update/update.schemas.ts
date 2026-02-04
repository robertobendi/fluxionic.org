import { Type, Static } from '@sinclair/typebox';

export const UpdateCheckResponse = Type.Object({
  currentVersion: Type.String(),
  latestVersion: Type.String(),
  updateAvailable: Type.Boolean(),
  versionDiff: Type.Union([
    Type.Literal('major'),
    Type.Literal('minor'),
    Type.Literal('patch'),
    Type.Null()
  ]),
  releaseUrl: Type.String(),
  publishedAt: Type.String(),
});

export type UpdateCheckResponseType = Static<typeof UpdateCheckResponse>;

export const ConflictCheckResponse = Type.Object({
  hasConflicts: Type.Boolean(),
  conflicts: Type.Array(Type.Object({
    file: Type.String(),
    type: Type.String(),
  })),
  canAutoMerge: Type.Boolean(),
});

export type ConflictCheckResponseType = Static<typeof ConflictCheckResponse>;

export const ChangelogResponse = Type.Object({
  releases: Type.Array(Type.Object({
    version: Type.String(),
    name: Type.String(),
    body: Type.String(),
    publishedAt: Type.String(),
    url: Type.String(),
  })),
});

export type ChangelogResponseType = Static<typeof ChangelogResponse>;

export const UpdateExecuteResponse = Type.Object({
  success: Type.Boolean(),
  phase: Type.Union([
    Type.Literal('backup'),
    Type.Literal('merge'),
    Type.Literal('migrate'),
    Type.Literal('restart'),
    Type.Literal('health'),
    Type.Literal('complete'),
  ]),
  error: Type.Optional(Type.String()),
  backupPaths: Type.Optional(Type.Object({
    database: Type.String(),
    uploads: Type.String(),
  })),
  previousVersion: Type.String(),
  newVersion: Type.Optional(Type.String()),
  message: Type.Optional(Type.String()),
});

export type UpdateExecuteResponseType = Static<typeof UpdateExecuteResponse>;

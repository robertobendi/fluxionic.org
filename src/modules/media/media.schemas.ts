import { Type } from "@sinclair/typebox";

export const MediaFileResponseSchema = Type.Object({
  id: Type.String(),
  filename: Type.String(),
  originalName: Type.String(),
  mimeType: Type.String(),
  size: Type.Number(),
  width: Type.Union([Type.Number(), Type.Null()]),
  height: Type.Union([Type.Number(), Type.Null()]),
  altText: Type.Union([Type.String(), Type.Null()]),
  path: Type.String(),
  thumbnailPath: Type.Union([Type.String(), Type.Null()]),
  url: Type.String(),
  thumbnailUrl: Type.Union([Type.String(), Type.Null()]),
  uploadedBy: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const UploadResponseSchema = Type.Object({
  files: Type.Array(MediaFileResponseSchema),
});

export const MediaListQuerySchema = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  type: Type.Optional(Type.String()),
  q: Type.Optional(Type.String()),
});

export const PaginatedMediaListSchema = Type.Object({
  data: Type.Array(MediaFileResponseSchema),
  meta: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    totalPages: Type.Number(),
  }),
});

export const UpdateMediaSchema = Type.Object({
  altText: Type.Optional(Type.String()),
});

export const MediaIdParamSchema = Type.Object({
  id: Type.String(),
});

export const CropImageSchema = Type.Object({
  left: Type.Integer({ minimum: 0 }),
  top: Type.Integer({ minimum: 0 }),
  width: Type.Integer({ minimum: 1 }),
  height: Type.Integer({ minimum: 1 }),
});

export const ImageInfoSchema = Type.Object({
  width: Type.Number(),
  height: Type.Number(),
  format: Type.String(),
});

export const StorageStatsSchema = Type.Object({
  total: Type.Number(),  // Total bytes across all files
  breakdown: Type.Object({
    images: Type.Number(),
    videos: Type.Number(),
    documents: Type.Number(),
    audio: Type.Number(),
  }),
});

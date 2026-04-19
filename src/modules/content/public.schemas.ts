import { Type, Static } from '@sinclair/typebox';

/**
 * Public entry schema - exposes only public-facing fields.
 * The data object may be populated with resolved references when ?populate=
 * is used, so values can be Unknown (nested objects or arrays).
 */
export const PublicEntrySchema = Type.Object({
  slug: Type.String(),
  data: Type.Record(Type.String(), Type.Unknown()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});
export type PublicEntry = Static<typeof PublicEntrySchema>;

/**
 * Legacy pagination metadata. Kept for backward compat with existing
 * consumers (admin + any frontends that rely on { page, totalPages }).
 */
export const PaginationMetaSchema = Type.Object({
  page: Type.Number(),
  limit: Type.Number(),
  total: Type.Number(),
  totalPages: Type.Number(),
});

/**
 * New offset-based pagination envelope introduced with rich query params.
 */
export const PaginationOffsetSchema = Type.Object({
  total: Type.Number(),
  limit: Type.Number(),
  offset: Type.Number(),
  hasMore: Type.Boolean(),
});

/**
 * Public entry list response — emits both legacy `meta` and new `pagination`
 * alongside the data array so callers can migrate at their own pace.
 */
export const PublicEntryListSchema = Type.Object({
  data: Type.Array(PublicEntrySchema),
  meta: PaginationMetaSchema,
  pagination: PaginationOffsetSchema,
});
export type PublicEntryList = Static<typeof PublicEntryListSchema>;

/**
 * Single entry response
 */
export const PublicEntryDetailSchema = Type.Object({
  data: PublicEntrySchema,
});

/**
 * Error response
 */
export const ErrorResponseSchema = Type.Object({
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
  }),
});

/**
 * Permissive query schema — actual parsing happens in query.parser.ts so we
 * accept any string-valued keys here (where[...], sort, fields, populate,
 * limit, offset, page, preview).
 */
export const ListEntriesQuerySchema = Type.Object(
  {
    page: Type.Optional(Type.String()),
    limit: Type.Optional(Type.String()),
    offset: Type.Optional(Type.String()),
    sort: Type.Optional(Type.String()),
    fields: Type.Optional(Type.String()),
    populate: Type.Optional(Type.String()),
    preview: Type.Optional(Type.String()),
  },
  { additionalProperties: Type.String() }
);

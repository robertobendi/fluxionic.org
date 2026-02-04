import { Type, Static } from '@sinclair/typebox';

/**
 * Public entry schema - exposes only public-facing fields
 */
export const PublicEntrySchema = Type.Object({
  slug: Type.String(),
  data: Type.Record(Type.String(), Type.Unknown()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});
export type PublicEntry = Static<typeof PublicEntrySchema>;

/**
 * Pagination metadata
 */
export const PaginationMetaSchema = Type.Object({
  page: Type.Number(),
  limit: Type.Number(),
  total: Type.Number(),
  totalPages: Type.Number(),
});

/**
 * Public entry list response with pagination
 */
export const PublicEntryListSchema = Type.Object({
  data: Type.Array(PublicEntrySchema),
  meta: PaginationMetaSchema,
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
 * Query parameters for listing entries
 * Query params are strings by default, so we use String and parse in the handler
 */
export const ListEntriesQuerySchema = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
});

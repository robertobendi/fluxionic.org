import { Type, Static } from '@sinclair/typebox';

// Entry data is dynamic based on collection schema
// We use Record<string, unknown> and validate at runtime
export const CreateEntrySchema = Type.Object({
  data: Type.Record(Type.String(), Type.Unknown()),
  status: Type.Optional(Type.Union([Type.Literal('draft'), Type.Literal('published')])),
});
export type CreateEntryInput = Static<typeof CreateEntrySchema>;

export const UpdateEntrySchema = Type.Object({
  data: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  status: Type.Optional(Type.Union([Type.Literal('draft'), Type.Literal('published')])),
  position: Type.Optional(Type.Number({ minimum: 0 })),
});
export type UpdateEntryInput = Static<typeof UpdateEntrySchema>;

export const EntryResponseSchema = Type.Object({
  id: Type.String(),
  collectionId: Type.String(),
  slug: Type.String(),
  data: Type.Record(Type.String(), Type.Unknown()),
  status: Type.Union([Type.Literal('draft'), Type.Literal('published')]),
  position: Type.Number(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});
export type EntryResponse = Static<typeof EntryResponseSchema>;

export const EntryListResponseSchema = Type.Array(EntryResponseSchema);

// Params schemas
export const CollectionIdParamSchema = Type.Object({
  collectionId: Type.String(),
});

export const EntryIdParamSchema = Type.Object({
  collectionId: Type.String(),
  entryId: Type.String(),
});

// Reorder schema
export const ReorderEntriesSchema = Type.Object({
  orderedIds: Type.Array(Type.String()),
});

// Search and filter schema for query string (strings from URL)
export const SearchEntriesQuerySchema = Type.Object({
  q: Type.Optional(Type.String({ minLength: 1 })),  // Search query
  status: Type.Optional(Type.Union([Type.Literal('draft'), Type.Literal('published')])),
  page: Type.Optional(Type.String({ pattern: '^[0-9]+$' })),  // Numeric string
  limit: Type.Optional(Type.String({ pattern: '^[0-9]+$' })),  // Numeric string
});

// Search and filter options for service layer (with actual numbers)
export type SearchEntriesQuery = {
  q?: string;
  status?: 'draft' | 'published';
  page?: number;
  limit?: number;
};

// Paginated response schema
export const PaginatedEntryListSchema = Type.Object({
  data: Type.Array(EntryResponseSchema),
  meta: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    totalPages: Type.Number(),
  }),
});

// Stats schema
export const EntryStatsResponseSchema = Type.Object({
  total: Type.Number(),
});

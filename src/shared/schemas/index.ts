/**
 * Shared TypeBox schemas for consistent API responses
 */
import { Type, Static } from '@sinclair/typebox';

/**
 * Standard error response schema
 */
export const ErrorResponseSchema = Type.Object({
  error: Type.String(),
});
export type ErrorResponse = Static<typeof ErrorResponseSchema>;

/**
 * Validation error response schema (with field-level details)
 */
export const ValidationErrorResponseSchema = Type.Object({
  error: Type.String(),
  details: Type.Optional(
    Type.Array(
      Type.Object({
        field: Type.String(),
        message: Type.String(),
      })
    )
  ),
});
export type ValidationErrorResponse = Static<typeof ValidationErrorResponseSchema>;

/**
 * Pagination query parameters
 */
export const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
});
export type PaginationQuery = Static<typeof PaginationQuerySchema>;

/**
 * Paginated response wrapper
 */
export const paginatedResponse = <T extends ReturnType<typeof Type.Object>>(itemSchema: T) =>
  Type.Object({
    items: Type.Array(itemSchema),
    total: Type.Number(),
    page: Type.Number(),
    limit: Type.Number(),
    totalPages: Type.Number(),
  });

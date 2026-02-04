import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { listPublishedEntries, getPublishedEntry } from './entry.service.js';
import {
  PublicEntryListSchema,
  PublicEntryDetailSchema,
  ErrorResponseSchema,
  ListEntriesQuerySchema,
} from './public.schemas.js';

/**
 * Public content API routes - NO authentication required
 * These routes serve published content to frontend applications
 */
export const publicContentRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * List published entries in a collection
   * GET /api/content/:collection
   */
  fastify.get(
    '/api/content/:collection',
    {
      schema: {
        params: Type.Object({
          collection: Type.String(),
        }),
        querystring: ListEntriesQuerySchema,
        response: {
          200: PublicEntryListSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { collection } = request.params as { collection: string };
      const query = request.query as {
        page?: string;
        limit?: string;
      };

      // Parse query parameters with defaults
      const page = query.page ? parseInt(query.page, 10) : 1;
      const limit = query.limit ? parseInt(query.limit, 10) : 20;

      // Validate parsed values
      if (isNaN(page) || page < 1) {
        return reply.code(400).send({
          error: {
            code: 'INVALID_PARAMETER',
            message: 'page must be a positive number',
          },
        });
      }
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return reply.code(400).send({
          error: {
            code: 'INVALID_PARAMETER',
            message: 'limit must be a number between 1 and 100',
          },
        });
      }

      try {
        const { entries, total } = await listPublishedEntries(collection, {
          page,
          limit,
        });

        const totalPages = Math.ceil(total / limit);

        return reply.code(200).send({
          data: entries,
          meta: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      } catch (error: any) {
        if (error.message === 'Collection not found') {
          return reply.code(404).send({
            error: {
              code: 'COLLECTION_NOT_FOUND',
              message: `Collection '${collection}' not found`,
            },
          });
        }
        throw error;
      }
    }
  );

  /**
   * Get a single published entry
   * GET /api/content/:collection/:slug
   */
  fastify.get(
    '/api/content/:collection/:slug',
    {
      schema: {
        params: Type.Object({
          collection: Type.String(),
          slug: Type.String(),
        }),
        response: {
          200: PublicEntryDetailSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { collection, slug } = request.params as {
        collection: string;
        slug: string;
      };

      try {
        const entry = await getPublishedEntry(collection, slug);

        if (!entry) {
          return reply.code(404).send({
            error: {
              code: 'ENTRY_NOT_FOUND',
              message: 'Entry not found',
            },
          });
        }

        return reply.code(200).send({
          data: entry,
        });
      } catch (error: any) {
        if (error.message === 'Collection not found') {
          return reply.code(404).send({
            error: {
              code: 'COLLECTION_NOT_FOUND',
              message: `Collection '${collection}' not found`,
            },
          });
        }
        throw error;
      }
    }
  );
};

import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { requireRole } from '../auth/auth.service.js';
import { ErrorResponseSchema, ValidationErrorResponseSchema } from '../../shared/schemas/index.js';
import { isAppError, NotFoundError, ValidationError } from '../../shared/errors/index.js';
import {
  createEntry,
  getEntry,
  listEntries,
  updateEntry,
  deleteEntry,
  reorderEntries,
  searchEntries,
  getEntryStats,
} from './entry.service.js';
import {
  CreateEntrySchema,
  UpdateEntrySchema,
  EntryResponseSchema,
  EntryListResponseSchema,
  CollectionIdParamSchema,
  EntryIdParamSchema,
  ReorderEntriesSchema,
  SearchEntriesQuerySchema,
  PaginatedEntryListSchema,
  EntryStatsResponseSchema,
} from './entry.schemas.js';

export const entryRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // GET /api/admin/entries/stats - Get total entry count across all collections
  app.get('/api/admin/entries/stats', {
    preHandler: [requireRole('editor')],
    schema: {
      response: {
        200: EntryStatsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const stats = await getEntryStats();
      return reply.send(stats);
    },
  });

  // GET /api/admin/collections/:collectionId/entries - List/search entries
  app.get('/api/admin/collections/:collectionId/entries', {
    preHandler: [requireRole('editor')],
    schema: {
      params: CollectionIdParamSchema,
      querystring: SearchEntriesQuerySchema,
      response: {
        200: PaginatedEntryListSchema,
      },
    },
    handler: async (request, reply) => {
      const { collectionId } = request.params;
      const { q, status, page: pageStr, limit: limitStr } = request.query;

      // Parse numeric query params
      const page = pageStr ? parseInt(pageStr, 10) : 1;
      const limit = limitStr ? parseInt(limitStr, 10) : 20;

      // Use searchEntries if query provided, otherwise listEntries
      const result = q || pageStr || limitStr
        ? await searchEntries(collectionId, { q, status, page, limit })
        : await listEntries(collectionId, status ? { status } : undefined);

      const totalPages = Math.ceil(result.total / limit);

      return reply.send({
        data: result.entries,
        meta: {
          page,
          limit,
          total: result.total,
          totalPages,
        },
      });
    },
  });

  // GET /api/admin/collections/:collectionId/entries/:entryId - Get single entry
  app.get('/api/admin/collections/:collectionId/entries/:entryId', {
    preHandler: [requireRole('editor')],
    schema: {
      params: EntryIdParamSchema,
      response: {
        200: EntryResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { collectionId, entryId } = request.params;
      const entry = await getEntry(collectionId, entryId);

      if (!entry) {
        return reply.status(404).send({ error: 'Entry not found' });
      }

      return reply.send(entry);
    },
  });

  // POST /api/admin/collections/:collectionId/entries - Create entry
  app.post('/api/admin/collections/:collectionId/entries', {
    preHandler: [requireRole('editor')],
    schema: {
      params: CollectionIdParamSchema,
      body: CreateEntrySchema,
      response: {
        201: EntryResponseSchema,
        400: ValidationErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { collectionId } = request.params;
      try {
        const newEntry = await createEntry(collectionId, request.body);
        return reply.status(201).send(newEntry);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message });
        }
        if (error instanceof ValidationError) {
          return reply.status(400).send({
            error: error.message,
            details: error.details,
          });
        }
        throw error;
      }
    },
  });

  // PATCH /api/admin/collections/:collectionId/entries/:entryId - Update entry
  app.patch('/api/admin/collections/:collectionId/entries/:entryId', {
    preHandler: [requireRole('editor')],
    schema: {
      params: EntryIdParamSchema,
      body: UpdateEntrySchema,
      response: {
        200: EntryResponseSchema,
        400: ValidationErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { collectionId, entryId } = request.params;
      try {
        const updatedEntry = await updateEntry(collectionId, entryId, request.body);
        return reply.send(updatedEntry);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message });
        }
        if (error instanceof ValidationError) {
          return reply.status(400).send({
            error: error.message,
            details: error.details,
          });
        }
        throw error;
      }
    },
  });

  // DELETE /api/admin/collections/:collectionId/entries/:entryId - Delete entry
  app.delete('/api/admin/collections/:collectionId/entries/:entryId', {
    preHandler: [requireRole('editor')],
    schema: {
      params: EntryIdParamSchema,
      response: {
        204: Type.Null(),
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { collectionId, entryId } = request.params;
      try {
        await deleteEntry(collectionId, entryId);
        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    },
  });

  // POST /api/admin/collections/:collectionId/entries/reorder - Reorder entries
  app.post('/api/admin/collections/:collectionId/entries/reorder', {
    preHandler: [requireRole('editor')],
    schema: {
      params: CollectionIdParamSchema,
      body: ReorderEntriesSchema,
      response: {
        204: Type.Null(),
      },
    },
    handler: async (request, reply) => {
      const { collectionId } = request.params;
      const { orderedIds } = request.body;
      await reorderEntries(collectionId, orderedIds);
      return reply.status(204).send(null);
    },
  });
};

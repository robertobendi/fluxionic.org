import { FastifyPluginAsync } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { requireRole, requireCollectionAccess } from '../auth/auth.service.js';
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
  findReferencers,
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
import { listRevisions, getRevision, restoreRevision, recordRevision } from './revision.service.js';
import { exportCollection, importCollection } from './import-export.service.js';
import { issuePreviewToken } from './preview.service.js';

export const entryRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // GET /api/admin/entries/stats
  app.get('/api/admin/entries/stats', {
    preHandler: [requireRole('viewer')],
    schema: {
      response: { 200: EntryStatsResponseSchema },
    },
    handler: async () => getEntryStats(),
  });

  // GET /api/admin/collections/:collectionId/entries
  app.get('/api/admin/collections/:collectionId/entries', {
    preHandler: [requireCollectionAccess('read')],
    schema: {
      params: CollectionIdParamSchema,
      querystring: SearchEntriesQuerySchema,
      response: { 200: PaginatedEntryListSchema },
    },
    handler: async (request, reply) => {
      const { collectionId } = request.params;
      const { q, status, page: pageStr, limit: limitStr } = request.query;

      const page = pageStr ? parseInt(pageStr, 10) : 1;
      const limit = limitStr ? parseInt(limitStr, 10) : 20;

      const result = q || pageStr || limitStr
        ? await searchEntries(collectionId, { q, status, page, limit })
        : await listEntries(collectionId, status ? { status } : undefined);

      const totalPages = Math.ceil(result.total / limit);
      return reply.send({
        data: result.entries,
        meta: { page, limit, total: result.total, totalPages },
      });
    },
  });

  // GET /api/admin/collections/:collectionId/entries/:entryId
  app.get('/api/admin/collections/:collectionId/entries/:entryId', {
    preHandler: [requireCollectionAccess('read')],
    schema: {
      params: EntryIdParamSchema,
      response: { 200: EntryResponseSchema, 404: ErrorResponseSchema },
    },
    handler: async (request, reply) => {
      const { collectionId, entryId } = request.params;
      const entry = await getEntry(collectionId, entryId);
      if (!entry) return reply.status(404).send({ error: 'Entry not found' });
      return reply.send(entry);
    },
  });

  // POST /api/admin/collections/:collectionId/entries
  app.post('/api/admin/collections/:collectionId/entries', {
    preHandler: [requireCollectionAccess('write')],
    schema: {
      params: CollectionIdParamSchema,
      body: CreateEntrySchema,
      response: { 201: EntryResponseSchema, 400: ValidationErrorResponseSchema, 404: ErrorResponseSchema },
    },
    handler: async (request, reply) => {
      const { collectionId } = request.params;
      try {
        const newEntry = await createEntry(collectionId, request.body);
        return reply.status(201).send(newEntry);
      } catch (error) {
        if (error instanceof NotFoundError) return reply.status(404).send({ error: error.message });
        if (error instanceof ValidationError) {
          return reply.status(400).send({ error: error.message, details: error.details });
        }
        throw error;
      }
    },
  });

  // PATCH /api/admin/collections/:collectionId/entries/:entryId
  app.patch('/api/admin/collections/:collectionId/entries/:entryId', {
    preHandler: [requireCollectionAccess('write')],
    schema: {
      params: EntryIdParamSchema,
      body: UpdateEntrySchema,
      response: { 200: EntryResponseSchema, 400: ValidationErrorResponseSchema, 404: ErrorResponseSchema },
    },
    handler: async (request, reply) => {
      const { collectionId, entryId } = request.params;
      try {
        const updatedEntry = await updateEntry(collectionId, entryId, request.body, request.user?.id ?? null);
        return reply.send(updatedEntry);
      } catch (error) {
        if (error instanceof NotFoundError) return reply.status(404).send({ error: error.message });
        if (error instanceof ValidationError) {
          return reply.status(400).send({ error: error.message, details: error.details });
        }
        throw error;
      }
    },
  });

  // DELETE /api/admin/collections/:collectionId/entries/:entryId
  app.delete('/api/admin/collections/:collectionId/entries/:entryId', {
    preHandler: [requireCollectionAccess('write')],
    schema: {
      params: EntryIdParamSchema,
      response: { 204: Type.Null(), 404: ErrorResponseSchema },
    },
    handler: async (request, reply) => {
      const { collectionId, entryId } = request.params;
      try {
        await deleteEntry(collectionId, entryId);
        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof NotFoundError) return reply.status(404).send({ error: error.message });
        throw error;
      }
    },
  });

  // POST /api/admin/collections/:collectionId/entries/reorder
  app.post('/api/admin/collections/:collectionId/entries/reorder', {
    preHandler: [requireCollectionAccess('write')],
    schema: {
      params: CollectionIdParamSchema,
      body: ReorderEntriesSchema,
      response: { 204: Type.Null() },
    },
    handler: async (request, reply) => {
      const { collectionId } = request.params;
      const { orderedIds } = request.body;
      await reorderEntries(collectionId, orderedIds);
      return reply.status(204).send(null);
    },
  });

  // GET /api/admin/collections/:collectionId/entries/:entryId/referencers
  app.get('/api/admin/collections/:collectionId/entries/:entryId/referencers', {
    preHandler: [requireCollectionAccess('read')],
    schema: { params: EntryIdParamSchema },
    handler: async (request) => {
      const { entryId } = request.params;
      return findReferencers(entryId);
    },
  });

  // GET /api/admin/collections/:collectionId/entries/:entryId/revisions
  app.get('/api/admin/collections/:collectionId/entries/:entryId/revisions', {
    preHandler: [requireCollectionAccess('read')],
    schema: { params: EntryIdParamSchema },
    handler: async (request) => listRevisions(request.params.entryId),
  });

  // POST /api/admin/collections/:collectionId/entries/:entryId/revisions/:version/restore
  app.post('/api/admin/collections/:collectionId/entries/:entryId/revisions/:version/restore', {
    preHandler: [requireCollectionAccess('write')],
    schema: {
      params: Type.Object({
        collectionId: Type.String(),
        entryId: Type.String(),
        version: Type.String(),
      }),
    },
    handler: async (request, reply) => {
      const { collectionId, entryId, version } = request.params as any;
      const v = parseInt(version, 10);
      if (Number.isNaN(v)) return reply.status(400).send({ error: 'invalid version' });
      const rev = await restoreRevision(entryId, v);
      if (!rev) return reply.status(404).send({ error: 'revision not found' });
      const updated = await getEntry(collectionId, entryId);
      if (updated) {
        await recordRevision(entryId, { data: updated.data, status: updated.status }, request.user?.id ?? null);
      }
      return reply.send(updated);
    },
  });

  // POST /api/admin/collections/:collectionId/entries/:entryId/preview-token
  app.post('/api/admin/collections/:collectionId/entries/:entryId/preview-token', {
    preHandler: [requireCollectionAccess('write')],
    schema: { params: EntryIdParamSchema },
    handler: async (request) => {
      return issuePreviewToken(request.params.entryId);
    },
  });

  // GET /api/admin/collections/:collectionId/export
  app.get('/api/admin/collections/:collectionId/export', {
    preHandler: [requireCollectionAccess('read')],
    schema: { params: CollectionIdParamSchema },
    handler: async (request, reply) => {
      const { collectionId } = request.params;
      const data = await exportCollection(collectionId);
      reply.header('content-disposition', `attachment; filename="${data.collection.slug}-export.json"`);
      return data;
    },
  });

  // POST /api/admin/collections/:collectionId/import
  app.post('/api/admin/collections/:collectionId/import', {
    preHandler: [requireCollectionAccess('write')],
    schema: {
      params: CollectionIdParamSchema,
      body: Type.Object({
        entries: Type.Array(
          Type.Object({
            slug: Type.Optional(Type.String()),
            status: Type.Optional(Type.Union([Type.Literal('draft'), Type.Literal('published')])),
            position: Type.Optional(Type.Number()),
            data: Type.Record(Type.String(), Type.Unknown()),
          })
        ),
        replace: Type.Optional(Type.Boolean()),
      }),
    },
    handler: async (request, reply) => {
      const { collectionId } = request.params;
      try {
        const body = request.body as any;
        const result = await importCollection(collectionId, { entries: body.entries }, { replace: body.replace });
        return reply.send(result);
      } catch (error) {
        if (error instanceof NotFoundError) return reply.status(404).send({ error: error.message });
        throw error;
      }
    },
  });
};

import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  queryPublishedEntries,
  getPublishedEntry,
} from './entry.service.js';
import { getCollection } from './collection.service.js';
import { parseContentQuery } from './query.parser.js';
import { populateReferences } from './reference.service.js';
import {
  PublicEntryListSchema,
  PublicEntryDetailSchema,
  ErrorResponseSchema,
  ListEntriesQuerySchema,
} from './public.schemas.js';
import { BadRequestError, NotFoundError, isAppError } from '../../shared/errors/index.js';

/**
 * Public content API routes - NO authentication required
 * These routes serve published content to frontend applications
 */
export const publicContentRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * List published entries in a collection with rich query support:
   *   ?where[field]=value              (eq)
   *   ?where[field][op]=value          (ne,gt,gte,lt,lte,contains,in,notIn)
   *   ?sort=-date,title
   *   ?limit=10&offset=20              (or legacy ?page=2)
   *   ?fields=title,slug
   *   ?populate=authorRef
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

      const coll = await getCollection(collection);
      if (!coll) {
        return reply.code(404).send({
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: `Collection '${collection}' not found`,
          },
        });
      }

      let parsed;
      try {
        parsed = parseContentQuery(
          request.query as Record<string, string | undefined>,
          { fields: coll.fields }
        );
      } catch (err) {
        if (isAppError(err)) {
          return reply.code(err.statusCode === 404 ? 404 : 400).send({
            error: { code: err.code, message: err.message },
          });
        }
        throw err;
      }

      try {
        const { entries, total } = await queryPublishedEntries(collection, parsed);

        const populated = parsed.populate.length > 0
          ? await populateReferences(entries, coll.fields, parsed.populate)
          : entries;

        const page = Math.floor(parsed.offset / parsed.limit) + 1;
        const totalPages = parsed.limit > 0 ? Math.ceil(total / parsed.limit) : 0;

        return reply.code(200).send({
          data: populated,
          meta: { page, limit: parsed.limit, total, totalPages },
          pagination: {
            total,
            limit: parsed.limit,
            offset: parsed.offset,
            hasMore: parsed.offset + entries.length < total,
          },
        });
      } catch (error: any) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: { code: 'COLLECTION_NOT_FOUND', message: error.message },
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
        querystring: Type.Object({
          populate: Type.Optional(Type.String()),
          preview: Type.Optional(Type.String()),
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
      const { populate, preview } = request.query as { populate?: string; preview?: string };

      const coll = await getCollection(collection);
      if (!coll) {
        return reply.code(404).send({
          error: { code: 'COLLECTION_NOT_FOUND', message: `Collection '${collection}' not found` },
        });
      }

      try {
        const entry = await getPublishedEntry(collection, slug, { previewToken: preview });

        if (!entry) {
          return reply.code(404).send({
            error: { code: 'ENTRY_NOT_FOUND', message: 'Entry not found' },
          });
        }

        let payload = entry;
        if (populate) {
          const populateFields = populate.split(',').map((s) => s.trim()).filter(Boolean);
          const [populated] = await populateReferences([entry], coll.fields, populateFields);
          payload = populated;
        }

        return reply.code(200).send({ data: payload });
      } catch (error: any) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: { code: 'COLLECTION_NOT_FOUND', message: error.message },
          });
        }
        throw error;
      }
    }
  );
};

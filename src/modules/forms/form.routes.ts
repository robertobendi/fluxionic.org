import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { requireRole } from '../auth/auth.service.js';
import { submitForm, listSubmissions, deleteSubmission } from './form.service.js';
import { BadRequestError, NotFoundError, ValidationError, isAppError } from '../../shared/errors/index.js';

export const formRoutes: FastifyPluginAsync = async (fastify) => {
  // Public submission endpoint — no auth required.
  fastify.post('/api/forms/:slug', {
    schema: {
      params: Type.Object({ slug: Type.String() }),
      body: Type.Record(Type.String(), Type.Unknown()),
    },
    handler: async (request, reply) => {
      const { slug } = request.params as { slug: string };
      try {
        const result = await submitForm(slug, request.body as Record<string, unknown>, {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] ?? null,
        });
        return reply.code(201).send(result);
      } catch (err) {
        if (err instanceof ValidationError) {
          return reply.code(400).send({ error: err.message, details: err.details });
        }
        if (err instanceof NotFoundError) {
          return reply.code(404).send({ error: err.message });
        }
        if (err instanceof BadRequestError) {
          return reply.code(400).send({ error: err.message });
        }
        throw err;
      }
    },
  });

  // Admin: list submissions for a form collection.
  fastify.get('/api/admin/collections/:collectionId/submissions', {
    preHandler: [requireRole('viewer')],
    schema: { params: Type.Object({ collectionId: Type.String() }) },
    handler: async (request) => {
      const { collectionId } = request.params as { collectionId: string };
      return listSubmissions(collectionId);
    },
  });

  fastify.delete('/api/admin/submissions/:id', {
    preHandler: [requireRole('editor')],
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const ok = await deleteSubmission(id);
      if (!ok) return reply.code(404).send({ error: 'Not found' });
      return reply.code(204).send();
    },
  });
};

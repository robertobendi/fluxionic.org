import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { requireRole } from '../auth/auth.service.js';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
  ApiKeyScopes,
} from './apikey.service.js';

const ScopesSchema = Type.Object({
  read: Type.Union([Type.Literal('*'), Type.Array(Type.String())]),
  write: Type.Union([Type.Literal('*'), Type.Array(Type.String())]),
});

export const apiKeyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/admin/api-keys', {
    preHandler: [requireRole('admin')],
    handler: async () => listApiKeys(),
  });

  fastify.post('/api/admin/api-keys', {
    preHandler: [requireRole('admin')],
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 100 }),
        scopes: ScopesSchema,
        expiresAt: Type.Optional(Type.String()),
      }),
    },
    handler: async (request, reply) => {
      const body = request.body as { name: string; scopes: ApiKeyScopes; expiresAt?: string };
      const result = await createApiKey({
        name: body.name,
        scopes: body.scopes,
        createdBy: request.user!.id,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      });
      return reply.code(201).send(result);
    },
  });

  fastify.post('/api/admin/api-keys/:id/revoke', {
    preHandler: [requireRole('admin')],
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const ok = await revokeApiKey(id);
      if (!ok) return reply.code(404).send({ error: 'Not found' });
      return reply.code(204).send();
    },
  });

  fastify.delete('/api/admin/api-keys/:id', {
    preHandler: [requireRole('admin')],
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const ok = await deleteApiKey(id);
      if (!ok) return reply.code(404).send({ error: 'Not found' });
      return reply.code(204).send();
    },
  });
};

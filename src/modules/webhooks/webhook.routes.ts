import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { requireRole } from '../auth/auth.service.js';
import {
  createWebhook,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
  listDeliveries,
  retryDelivery,
  WEBHOOK_EVENTS,
  WebhookEvent,
} from './webhook.service.js';

const EventsSchema = Type.Array(
  Type.Union(WEBHOOK_EVENTS.map((e) => Type.Literal(e)))
);

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/admin/webhooks', {
    preHandler: [requireRole('admin')],
    handler: async () => listWebhooks(),
  });

  fastify.post('/api/admin/webhooks', {
    preHandler: [requireRole('admin')],
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        url: Type.String({ format: 'uri' }),
        events: EventsSchema,
        collectionSlug: Type.Optional(Type.Union([Type.String(), Type.Null()])),
      }),
    },
    handler: async (request, reply) => {
      const body = request.body as {
        name: string;
        url: string;
        events: WebhookEvent[];
        collectionSlug?: string | null;
      };
      const result = await createWebhook({
        name: body.name,
        url: body.url,
        events: body.events,
        collectionSlug: body.collectionSlug ?? null,
        createdBy: request.user!.id,
      });
      return reply.code(201).send(result);
    },
  });

  fastify.patch('/api/admin/webhooks/:id', {
    preHandler: [requireRole('admin')],
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        url: Type.Optional(Type.String({ format: 'uri' })),
        events: Type.Optional(EventsSchema),
        collectionSlug: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        enabled: Type.Optional(Type.Boolean()),
      }),
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await updateWebhook(id, request.body as any);
      if (!result) return reply.code(404).send({ error: 'Not found' });
      return result;
    },
  });

  fastify.delete('/api/admin/webhooks/:id', {
    preHandler: [requireRole('admin')],
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const ok = await deleteWebhook(id);
      if (!ok) return reply.code(404).send({ error: 'Not found' });
      return reply.code(204).send();
    },
  });

  fastify.get('/api/admin/webhooks/deliveries', {
    preHandler: [requireRole('admin')],
    schema: {
      querystring: Type.Object({
        webhookId: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
      }),
    },
    handler: async (request) => {
      const { webhookId, status } = request.query as { webhookId?: string; status?: string };
      return listDeliveries(webhookId, status);
    },
  });

  fastify.post('/api/admin/webhooks/deliveries/:id/retry', {
    preHandler: [requireRole('admin')],
    schema: { params: Type.Object({ id: Type.String() }) },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const ok = await retryDelivery(id);
      if (!ok) return reply.code(404).send({ error: 'Not found' });
      return reply.code(204).send();
    },
  });
};

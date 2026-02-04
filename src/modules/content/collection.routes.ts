import { FastifyPluginAsync } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { requireRole } from "../auth/auth.service.js";
import { ErrorResponseSchema } from "../../shared/schemas/index.js";
import {
  createCollection,
  getCollection,
  listCollections,
  updateCollection,
  deleteCollection,
} from "./collection.service.js";
import {
  CreateCollectionSchema,
  UpdateCollectionSchema,
  CollectionResponseSchema,
  CollectionListResponseSchema,
} from "./collection.schemas.js";

export const collectionRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // GET /api/admin/collections - List all collections
  app.get("/api/admin/collections", {
    preHandler: [requireRole("admin")],
    schema: {
      response: { 200: CollectionListResponseSchema },
    },
    handler: async (request, reply) => {
      const collections = await listCollections();
      return reply.send(collections);
    },
  });

  // GET /api/admin/collections/:id - Get collection by id or slug
  app.get("/api/admin/collections/:id", {
    preHandler: [requireRole("admin")],
    schema: {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: CollectionResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const collection = await getCollection(request.params.id);

      if (!collection) {
        return reply.status(404).send({ error: "Collection not found" });
      }

      return reply.send(collection);
    },
  });

  // POST /api/admin/collections - Create new collection
  app.post("/api/admin/collections", {
    preHandler: [requireRole("admin")],
    schema: {
      body: CreateCollectionSchema,
      response: {
        201: CollectionResponseSchema,
        409: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const result = await createCollection(request.body);
        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof Error && (error as any).code === "DUPLICATE_SLUG") {
          return reply.status(409).send({ error: "Collection with this slug already exists" });
        }
        throw error;
      }
    },
  });

  // PATCH /api/admin/collections/:id - Update collection
  app.patch("/api/admin/collections/:id", {
    preHandler: [requireRole("admin")],
    schema: {
      params: Type.Object({ id: Type.String() }),
      body: UpdateCollectionSchema,
      response: {
        200: CollectionResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const updated = await updateCollection(request.params.id, request.body);

      if (!updated) {
        return reply.status(404).send({ error: "Collection not found" });
      }

      return reply.send(updated);
    },
  });

  // DELETE /api/admin/collections/:id - Delete collection
  app.delete("/api/admin/collections/:id", {
    preHandler: [requireRole("admin")],
    schema: {
      params: Type.Object({ id: Type.String() }),
      response: {
        204: Type.Null(),
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const deleted = await deleteCollection(request.params.id);

      if (!deleted) {
        return reply.status(404).send({ error: "Collection not found" });
      }

      return reply.status(204).send(null);
    },
  });
};

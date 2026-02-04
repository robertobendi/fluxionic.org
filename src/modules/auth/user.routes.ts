import { FastifyPluginAsync } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  requireRole,
  createUser,
  listUsers,
  deleteUser,
} from "./auth.service.js";
import {
  CreateUserSchema,
  UserResponseSchema,
  UserListResponseSchema,
} from "./auth.schemas.js";
import { Type } from "@sinclair/typebox";
import { ErrorResponseSchema } from "../../shared/schemas/index.js";

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // GET /api/admin/users - List all users
  app.get("/api/admin/users", {
    preHandler: [requireRole("admin")],
    schema: {
      response: { 200: UserListResponseSchema },
    },
    handler: async (request, reply) => {
      const users = await listUsers();
      return reply.send(users);
    },
  });

  // POST /api/admin/users - Create new user
  app.post("/api/admin/users", {
    preHandler: [requireRole("admin")],
    schema: {
      body: CreateUserSchema,
      response: {
        201: UserResponseSchema,
        400: ErrorResponseSchema,
        409: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const newUser = await createUser(request.body);
        return reply.status(201).send(newUser);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Email already in use"
        ) {
          return reply.status(409).send({ error: error.message });
        }
        throw error;
      }
    },
  });

  // DELETE /api/admin/users/:id - Delete user
  app.delete("/api/admin/users/:id", {
    preHandler: [requireRole("admin")],
    schema: {
      params: Type.Object({ id: Type.String() }),
      response: {
        204: Type.Null(),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        await deleteUser(request.params.id, request.user!.id);
        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Cannot delete yourself") {
            return reply.status(400).send({ error: error.message });
          }
          if (error.message === "User not found") {
            return reply.status(404).send({ error: error.message });
          }
        }
        throw error;
      }
    },
  });
};

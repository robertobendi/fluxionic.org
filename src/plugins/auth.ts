import fp from "fastify-plugin";
import { auth } from "../modules/auth/auth.config.js";
import { SessionUser } from "../modules/auth/auth.types.js";

declare module "fastify" {
  interface FastifyRequest {
    user: SessionUser | null;
  }
}

export default fp(async (fastify) => {
  fastify.decorateRequest("user", null);

  fastify.addHook("preHandler", async (request, reply) => {
    // Skip auth routes themselves
    if (request.url.startsWith("/api/auth/")) return;

    // Skip public content routes (future)
    if (request.url.startsWith("/api/content/")) return;

    // Protected admin routes require authentication
    if (request.url.startsWith("/api/admin/")) {
      // Convert headers for better-auth
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
      }

      const session = await auth.api.getSession({ headers });

      if (!session) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      request.user = {
        id: session.user.id,
        email: session.user.email,
        role: (session.user as any).role || "user",
      };
    }
  });
});

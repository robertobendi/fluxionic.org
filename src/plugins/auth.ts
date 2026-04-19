import fp from "fastify-plugin";
import { auth } from "../modules/auth/auth.config.js";
import { SessionUser } from "../modules/auth/auth.types.js";
import { verifyApiKey, ApiKeyScopes } from "../modules/apikeys/apikey.service.js";

declare module "fastify" {
  interface FastifyRequest {
    user: SessionUser | null;
    apiKey: { id: string; scopes: ApiKeyScopes } | null;
  }
}

function extractBearer(headerValue: string | string[] | undefined): string | null {
  if (!headerValue) return null;
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!value.toLowerCase().startsWith('bearer ')) return null;
  return value.slice(7).trim() || null;
}

export default fp(async (fastify) => {
  fastify.decorateRequest("user", null);
  fastify.decorateRequest("apiKey", null);

  fastify.addHook("preHandler", async (request, reply) => {
    // Skip auth routes themselves
    if (request.url.startsWith("/api/auth/")) return;

    // Public content / forms / form submit endpoints:
    // allow optional bearer-token authentication for scoped reads/writes.
    if (
      request.url.startsWith("/api/content/") ||
      request.url.startsWith("/api/forms/")
    ) {
      const bearer = extractBearer(request.headers.authorization);
      if (bearer) {
        const key = await verifyApiKey(bearer);
        if (key) request.apiKey = key;
      }
      return;
    }

    // Protected admin routes require authentication
    if (request.url.startsWith("/api/admin/")) {
      // Allow bearer-token auth on admin routes when scopes match.
      const bearer = extractBearer(request.headers.authorization);
      if (bearer) {
        const key = await verifyApiKey(bearer);
        if (key) {
          request.apiKey = key;
          // API keys never get user context; consumer routes must gate on apiKey + scopes.
          return;
        }
      }

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

import { FastifyPluginAsync } from "fastify";
import { auth } from "./auth.config.js";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Handle all auth routes: /api/auth/*
  fastify.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    handler: async (request, reply) => {
      // Convert Fastify request to Web Request
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
      }

      const webRequest = new Request(url.toString(), {
        method: request.method,
        headers,
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? JSON.stringify(request.body)
            : undefined,
      });

      // Process through better-auth
      const response = await auth.handler(webRequest);

      // Copy response headers to reply
      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });

      reply.status(response.status);

      // Handle response body
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return reply.send(await response.json());
      }
      return reply.send(await response.text());
    },
  });
};

import { FastifyPluginAsync } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { VisitorStatsSchema } from "./public.schemas.js";
import { getVisitorStats } from "./metrics.queries.js";

export const metricsPublicRoutes: FastifyPluginAsync = async (fastify) => {
  // Register rate limit plugin for this route scope
  await fastify.register(rateLimit, {
    global: false,
  });

  // GET /api/metrics/stats - Public endpoint for aggregate visitor stats
  fastify.get(
    "/api/metrics/stats",
    {
      schema: {
        response: {
          200: VisitorStatsSchema,
        },
      },
      config: {
        rateLimit: {
          max: 20,              // 20 requests
          timeWindow: "1 minute", // per minute per IP
        },
      },
    },
    async (request, reply) => {
      const stats = await getVisitorStats();

      // CORS: Allow any origin for public API (no credentials needed)
      reply.header("Access-Control-Allow-Origin", "*");
      // Cache for 5 minutes to reduce DB load
      reply.header("Cache-Control", "public, max-age=300");

      return reply.send(stats);
    }
  );
};

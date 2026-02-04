import { FastifyPluginAsync } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { PageviewBodySchema, PageviewResponseSchema, PageviewBody } from "./metrics.schemas.js";
import { recordPageview, setConfig } from "./metrics.service.js";

export const metricsRoutes: FastifyPluginAsync = async (fastify) => {
  // Pass config to service
  setConfig(fastify.config);

  // Register rate limit plugin for this route only
  await fastify.register(rateLimit, {
    global: false,
  });

  // POST /api/metrics/pageview - Public endpoint for pageview tracking
  fastify.post(
    "/api/metrics/pageview",
    {
      schema: {
        body: PageviewBodySchema,
        response: {
          201: PageviewResponseSchema,
        },
      },
      config: {
        rateLimit: {
          max: 100, // 100 requests
          timeWindow: "1 minute", // per minute per IP
        },
      },
    },
    async (request, reply) => {
      const { path, referrer } = request.body as PageviewBody;

      // Record pageview with privacy-friendly hashing
      await recordPageview({
        path,
        referrer,
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      });

      reply.code(201).send({ success: true });
    }
  );
};

import { FastifyPluginAsync } from "fastify";
import { requireRole } from "../auth/auth.service.js";
import { getMetricsSummary, getTopPages, getMetricsTrend } from "./metrics.queries.js";
import {
  MetricsSummarySchema,
  TopPagesQuerySchema,
  TopPagesResponseSchema,
  TopPagesQuery,
  TrendQuerySchema,
  TrendResponseSchema,
  TrendQuery,
} from "./admin.schemas.js";

export const metricsAdminRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/admin/metrics/summary - Get metrics summary
  fastify.get(
    "/api/admin/metrics/summary",
    {
      preHandler: [requireRole("editor")],
      schema: {
        response: {
          200: MetricsSummarySchema,
        },
      },
    },
    async (request, reply) => {
      const summary = await getMetricsSummary();
      return reply.send(summary);
    }
  );

  // GET /api/admin/metrics/top-pages - Get top pages by views
  fastify.get(
    "/api/admin/metrics/top-pages",
    {
      preHandler: [requireRole("editor")],
      schema: {
        querystring: TopPagesQuerySchema,
        response: {
          200: TopPagesResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const query = request.query as TopPagesQuery;

      // Parse query parameters (defaults handled in service)
      const days = query.days ? parseInt(query.days, 10) : undefined;
      const limit = query.limit ? parseInt(query.limit, 10) : undefined;

      const topPages = await getTopPages({
        days,
        limit,
      });

      return reply.send({ data: topPages });
    }
  );

  // GET /api/admin/metrics/trend - Get pageview trend over time
  fastify.get(
    "/api/admin/metrics/trend",
    {
      preHandler: [requireRole("editor")],
      schema: {
        querystring: TrendQuerySchema,
        response: {
          200: TrendResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const query = request.query as TrendQuery;
      const days = query.days ? parseInt(query.days, 10) : 7;

      const trend = await getMetricsTrend(days);
      return reply.send({ data: trend });
    }
  );
};

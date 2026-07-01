import { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { getPublishedEntry } from "../content/entry.service.js";

/**
 * Fellows-only lecture slides.
 *
 * Lecture links are intentionally stripped from the public content API
 * (see public.routes.ts). They are only returned here when the shared
 * FLUXIONIC password is supplied.
 */
export const lecturesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/api/events/:slug/lectures",
    {
      config: {
        // Basic brute-force protection if rate-limit plugin is present.
        rateLimit: { max: 20, timeWindow: "1 minute" },
      },
      schema: {
        params: Type.Object({ slug: Type.String() }),
        body: Type.Object({ password: Type.String() }),
      },
    },
    async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const { password } = request.body as { password: string };

      if (password !== fastify.config.LECTURES_PASSWORD) {
        return reply.code(401).send({
          error: { code: "INVALID_PASSWORD", message: "Incorrect password" },
        });
      }

      const entry = await getPublishedEntry("events", slug);
      const lectures = (entry?.data as Record<string, unknown> | undefined)?.lectures ?? [];
      return reply.code(200).send({ lectures });
    }
  );
};

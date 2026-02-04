import { FastifyPluginAsync } from "fastify";
import { requireRole } from "../auth/auth.service.js";
import { db } from "../../shared/database/index.js";
import { sql } from "drizzle-orm";
import pkg from "../../../package.json" with { type: "json" };

interface RestartResponse {
  message: string;
}

interface SystemInfoResponse {
  version: string;
  database: string;
  nodeVersion: string;
  uptime: number;
}

export const systemInfoRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/admin/system-info - Get system information (admin only)
  fastify.get<{ Reply: SystemInfoResponse }>(
    "/api/admin/system-info",
    {
      preHandler: [requireRole("admin")],
    },
    async (request, reply) => {
      // Check database connection
      let databaseStatus = "disconnected";
      try {
        await db.execute(sql`SELECT 1`);
        databaseStatus = "connected";
      } catch (error) {
        databaseStatus = "disconnected";
      }

      return reply.send({
        version: pkg.version,
        database: databaseStatus,
        nodeVersion: process.version,
        uptime: process.uptime(),
      });
    }
  );

  // POST /api/admin/restart - Gracefully restart the server (admin only)
  fastify.post<{ Reply: RestartResponse }>(
    "/api/admin/restart",
    {
      preHandler: [requireRole("admin")],
    },
    async (request, reply) => {
      request.log.info("Server restart requested by admin");

      // Send response before exiting
      reply.send({ message: "Server is restarting..." });

      // Delay exit to allow response to be sent
      setTimeout(() => {
        request.log.info("Shutting down for restart");
        process.exit(0);
      }, 500);
    }
  );
};

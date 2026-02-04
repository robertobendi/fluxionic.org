import { FastifyPluginAsync } from "fastify";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db } from "../shared/database/index.js";

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/api/health", async (request, reply) => {
    const startTime = Date.now();

    let databaseStatus: "connected" | "disconnected" = "disconnected";
    let mediaStatus: "writable" | "unavailable" = "unavailable";

    // Test database connection
    try {
      await db.execute(sql`SELECT 1`);
      databaseStatus = "connected";
    } catch (error) {
      request.log.error(error, "Database health check failed");
    }

    // Test media storage writability with actual write operation
    // fs.access() has race conditions and false positives on NFS/Windows
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    const testFile = path.join(uploadDir, `.health-check-${Date.now()}`);
    try {
      await fs.promises.writeFile(testFile, "health-check");
      try {
        await fs.promises.unlink(testFile);
      } catch {
        // Cleanup failed - log but don't affect status since write succeeded
        request.log.debug({ testFile }, "Health check cleanup failed");
      }
      mediaStatus = "writable";
    } catch (error) {
      request.log.warn(
        { err: error, uploadDir },
        "Media storage writability check failed - uploads may not work"
      );
    }

    // Gather memory metrics
    const memoryUsage = process.memoryUsage();
    const heapPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;

    // Memory is only concerning if BOTH high percentage AND high absolute usage
    // Small heaps (< 256 MB) at high percentage are fine - Node will auto-expand
    const memoryDegraded = heapPercent > 90 && heapUsedMB > 256;

    // Determine overall status
    let status: "ok" | "degraded" | "error";
    if (databaseStatus === "disconnected") {
      status = "error";
    } else if (mediaStatus === "unavailable" || memoryDegraded) {
      status = "degraded";
    } else {
      status = "ok";
    }

    // Set appropriate HTTP status code
    if (status === "error") {
      reply.code(503);
    } else if (status === "degraded") {
      reply.code(200); // Still functional, just degraded
    }

    return {
      status,
      database: databaseStatus,
      media: mediaStatus,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        heapPercent,
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      responseTime: Date.now() - startTime,
    };
  });
};

export default healthRoutes;

import { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function staticRoutes(fastify: FastifyInstance) {
  const adminDistPath = path.resolve(__dirname, "../../admin/dist");
  const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
  const publicPath = path.resolve(__dirname, "../../public");

  // Serve frontend SPA (takes priority over legacy public/ demo)
  const frontendAvailable = existsSync(frontendDistPath) && existsSync(path.join(frontendDistPath, "index.html"));
  let frontendIndexHtml: string | null = null;

  if (frontendAvailable) {
    frontendIndexHtml = readFileSync(path.join(frontendDistPath, "index.html"), "utf-8");

    // Serve frontend static assets at root
    await fastify.register(fastifyStatic, {
      root: frontendDistPath,
      prefix: "/",
      decorateReply: false,
      wildcard: false,
    });

    // Serve index.html at /
    fastify.get("/", async (request, reply) => {
      reply.type("text/html").send(frontendIndexHtml);
    });

    fastify.log.info(`Frontend available at /`);
  } else if (existsSync(publicPath)) {
    // Fallback: serve legacy public demo frontend
    await fastify.register(fastifyStatic, {
      root: publicPath,
      prefix: "/public/",
      decorateReply: false,
    });

    const publicIndexPath = path.join(publicPath, "index.html");
    if (existsSync(publicIndexPath)) {
      const publicIndexHtml = readFileSync(publicIndexPath, "utf-8");

      fastify.get("/", async (request, reply) => {
        reply.type("text/html").send(publicIndexHtml);
      });

      fastify.log.info(`Demo frontend available at /`);
    }
  }

  // Only register admin static serving if the dist folder exists
  if (existsSync(adminDistPath)) {
    const indexHtmlPath = path.join(adminDistPath, "index.html");

    // Register static file serving for admin SPA
    await fastify.register(fastifyStatic, {
      root: adminDistPath,
      prefix: "/admin/",
      decorateReply: false,
    });

    // Cache index.html content for SPA fallback
    const adminIndexHtml = readFileSync(indexHtmlPath, "utf-8");

    // SPA fallback: serve index.html for unmatched routes
    fastify.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/admin")) {
        reply.type("text/html").send(adminIndexHtml);
      } else if (
        frontendIndexHtml &&
        !request.url.startsWith("/api") &&
        !request.url.startsWith("/uploads")
      ) {
        // Frontend SPA fallback: serve index.html for client-side routes
        reply.type("text/html").send(frontendIndexHtml);
      } else {
        reply.code(404).send({ error: "Not Found" });
      }
    });

    // Redirect /admin to /admin/ for consistency
    fastify.get("/admin", async (request, reply) => {
      return reply.redirect("/admin/");
    });

    fastify.log.info(`Admin panel available at /admin/`);
  } else {
    // Even without admin, set up frontend SPA fallback if available
    if (frontendIndexHtml) {
      fastify.setNotFoundHandler((request, reply) => {
        if (
          !request.url.startsWith("/api") &&
          !request.url.startsWith("/uploads") &&
          !request.url.startsWith("/admin")
        ) {
          reply.type("text/html").send(frontendIndexHtml);
        } else {
          reply.code(404).send({ error: "Not Found" });
        }
      });
    }

    fastify.log.warn(
      `Admin dist folder not found at ${adminDistPath}. Run 'cd admin && npm run build' to build the admin panel.`
    );
  }
}

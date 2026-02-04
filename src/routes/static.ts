import { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function staticRoutes(fastify: FastifyInstance) {
  const adminDistPath = path.resolve(__dirname, "../../admin/dist");
  const publicPath = path.resolve(__dirname, "../../public");

  // Serve public demo frontend at /public/
  if (existsSync(publicPath)) {
    await fastify.register(fastifyStatic, {
      root: publicPath,
      prefix: "/public/",
      decorateReply: false,
    });

    // Serve public index.html at root /
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
    const indexHtml = readFileSync(indexHtmlPath, "utf-8");

    // SPA fallback: serve index.html for all /admin/* routes that don't match files
    // This enables client-side routing (e.g., /admin/collections, /admin/media)
    fastify.setNotFoundHandler((request, reply) => {
      // Only handle /admin/* routes
      if (request.url.startsWith("/admin")) {
        reply.type("text/html").send(indexHtml);
      } else {
        // Let other 404s be handled normally
        reply.code(404).send({ error: "Not Found" });
      }
    });

    // Redirect /admin to /admin/ for consistency
    fastify.get("/admin", async (request, reply) => {
      return reply.redirect("/admin/");
    });

    fastify.log.info(`Admin panel available at /admin/`);
  } else {
    fastify.log.warn(
      `Admin dist folder not found at ${adminDistPath}. Run 'cd admin && npm run build' to build the admin panel.`
    );
  }
}

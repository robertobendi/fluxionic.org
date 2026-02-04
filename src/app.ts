import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { TypeBoxValidatorCompiler } from "@fastify/type-provider-typebox";
import fastifyEnv from "@fastify/env";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import { envSchema } from "./shared/config/index.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes, userRoutes } from "./modules/auth/index.js";
import { collectionRoutes, entryRoutes, publicContentRoutes } from "./modules/content/index.js";
import { mediaRoutes } from "./modules/media/index.js";
import { metricsRoutes, metricsAdminRoutes, metricsPublicRoutes } from "./modules/metrics/index.js";
import { systemInfoRoutes } from "./modules/admin/index.js";
import { updateRoutes } from "./modules/update/index.js";
import staticRoutes from "./routes/static.js";
import healthRoutes from "./routes/health.js";

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      // Pretty-print in development only
      ...(process.env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
    },
  })
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  // Register environment validation
  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });

  // Register CORS
  await fastify.register(fastifyCors, {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  });

  // Register cookie support
  await fastify.register(fastifyCookie);

  // Register multipart support for file uploads
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: fastify.config.MAX_FILE_SIZE,
      files: 10,
      fields: 10,
    },
  });

  // Register static file serving for uploads
  await fastify.register(fastifyStatic, {
    root: path.resolve(fastify.config.UPLOAD_DIR),
    prefix: "/uploads/",
    decorateReply: false,
  });

  // Register health check (before auth, so it doesn't require authentication)
  await fastify.register(healthRoutes);

  // Register auth plugin
  await fastify.register(authPlugin);

  // Register auth routes
  await fastify.register(authRoutes);

  // Register user management routes
  await fastify.register(userRoutes);

  // Register collection management routes
  await fastify.register(collectionRoutes);

  // Register entry management routes
  await fastify.register(entryRoutes);

  // Register media upload routes
  await fastify.register(mediaRoutes);

  // Register metrics admin routes
  await fastify.register(metricsAdminRoutes);

  // Register system info routes (admin only)
  await fastify.register(systemInfoRoutes);

  // Register update routes (admin only)
  await fastify.register(updateRoutes);

  // Register metrics public routes (public, rate-limited)
  await fastify.register(metricsPublicRoutes);

  // Register metrics routes (public pageview tracking, rate-limited)
  await fastify.register(metricsRoutes);

  // Register public content routes (no auth required)
  await fastify.register(publicContentRoutes);

  // Register static file serving for admin SPA (must be last)
  await fastify.register(staticRoutes);

  return fastify;
}

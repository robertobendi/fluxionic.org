import { Type, Static } from "@sinclair/typebox";

const EnvSchema = Type.Object({
  DATABASE_URL: Type.String({ minLength: 1 }),
  BETTER_AUTH_SECRET: Type.String({ minLength: 32 }),
  BETTER_AUTH_URL: Type.String(),
  ADMIN_EMAIL: Type.String(),
  ADMIN_PASSWORD: Type.String({ minLength: 8 }),
  PORT: Type.Number({ default: 3000 }),
  NODE_ENV: Type.Union(
    [
      Type.Literal("development"),
      Type.Literal("production"),
      Type.Literal("test"),
    ],
    { default: "development" }
  ),
  LOG_LEVEL: Type.Union(
    [
      Type.Literal("fatal"),
      Type.Literal("error"),
      Type.Literal("warn"),
      Type.Literal("info"),
      Type.Literal("debug"),
      Type.Literal("trace"),
    ],
    { default: "info" }
  ),
  MAX_FILE_SIZE: Type.Number({ default: 10485760 }), // 10MB default
  UPLOAD_DIR: Type.String({ default: "./uploads" }),
  METRICS_SALT: Type.String({ default: "change-me-in-production" }),
});

export type EnvConfig = Static<typeof EnvSchema>;

export const envSchema = EnvSchema;

declare module "fastify" {
  interface FastifyInstance {
    config: EnvConfig;
  }
}

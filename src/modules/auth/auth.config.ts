import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";
import { db } from "../../shared/database/index.js";
import * as schema from "../../shared/database/schema.js";
import { session } from "../../shared/database/schema.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    admin(), // Enables role field and admin APIs
  ],
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Only process successful email sign-in
      if (ctx.path === "/sign-in/email" && ctx.context?.newSession) {
        const body = ctx.body as { rememberMe?: boolean } | undefined;
        const rememberMe = body?.rememberMe;

        if (rememberMe === true) {
          // Extend session to 30 days
          const thirtyDays = new Date();
          thirtyDays.setDate(thirtyDays.getDate() + 30);

          await db
            .update(session)
            .set({ expiresAt: thirtyDays })
            .where(eq(session.id, ctx.context.newSession.session.id));
        }
      }
    }),
  },
});

export type Auth = typeof auth;

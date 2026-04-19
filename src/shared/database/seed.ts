import { db } from "./index.js";
import { user, account } from "./schema.js";
import { auth } from "../../modules/auth/auth.config.js";
import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";

export async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed");
    return;
  }

  // Get better-auth context
  const ctx = await auth.$context;

  // Hash password
  const hashedPassword = await ctx.password.hash(adminPassword);
  const normalizedEmail = adminEmail.toLowerCase();

  // Ensure configured admin always exists and has the configured password
  const [existingAdmin] = await db
    .select()
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (existingAdmin) {
    await db
      .update(user)
      .set({
        role: "admin",
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, existingAdmin.id));

    const [existingCredential] = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, existingAdmin.id), eq(account.providerId, "credential")))
      .limit(1);

    if (existingCredential) {
      await db
        .update(account)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(account.id, existingCredential.id));
    } else {
      await db.insert(account).values({
        id: nanoid(),
        accountId: existingAdmin.id,
        providerId: "credential",
        userId: existingAdmin.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(`Admin credentials synced for: ${normalizedEmail}`);
    return;
  }

  // Generate user ID
  const userId = nanoid();

  // Insert user record
  await db.insert(user).values({
    id: userId,
    email: normalizedEmail,
    name: "Admin",
    emailVerified: true,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Insert account record
  await db.insert(account).values({
    id: nanoid(),
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`Admin user created: ${normalizedEmail}`);
}

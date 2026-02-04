import { db } from "./index.js";
import { user, account } from "./schema.js";
import { auth } from "../../modules/auth/auth.config.js";
import { nanoid } from "nanoid";

export async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed");
    return;
  }

  // Check if any users exist
  const existingUsers = await db.select().from(user).limit(1);
  if (existingUsers.length > 0) {
    console.log("Users already exist, skipping admin seed");
    return;
  }

  // Get better-auth context
  const ctx = await auth.$context;

  // Hash password
  const hashedPassword = await ctx.password.hash(adminPassword);

  // Generate user ID
  const userId = nanoid();

  // Insert user record
  await db.insert(user).values({
    id: userId,
    email: adminEmail.toLowerCase(),
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

  console.log(`Admin user created: ${adminEmail}`);
}

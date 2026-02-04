import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../shared/database/index.js";
import { user, account } from "../../shared/database/schema.js";
import { auth } from "./auth.config.js";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { CreateUserInput, UserResponse } from "./auth.schemas.js";

export function requireRole(role: "admin" | "editor") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    if (role === "admin" && request.user.role !== "admin") {
      return reply
        .status(403)
        .send({ error: "Forbidden: Admin access required" });
    }

    // For editor role: both admin and editor are allowed
    if (
      role === "editor" &&
      !["admin", "editor"].includes(request.user.role)
    ) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

export async function createUser(
  input: CreateUserInput
): Promise<UserResponse> {
  // Check if email already exists
  const existingUsers = await db
    .select()
    .from(user)
    .where(eq(user.email, input.email.toLowerCase()));

  if (existingUsers.length > 0) {
    throw new Error("Email already in use");
  }

  // Get auth context and hash password
  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(input.password);

  // Generate userId
  const userId = nanoid();

  // Insert user record
  const [newUser] = await db
    .insert(user)
    .values({
      id: userId,
      email: input.email.toLowerCase(),
      name: input.name,
      role: input.role,
      emailVerified: true,
    })
    .returning();

  // Insert account record for credential provider
  await db.insert(account).values({
    id: nanoid(),
    accountId: newUser.email,
    providerId: "credential",
    userId: newUser.id,
    password: hashedPassword,
  });

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    createdAt: newUser.createdAt.toISOString(),
  };
}

export async function listUsers(): Promise<UserResponse[]> {
  const users = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user);

  return users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function deleteUser(
  userId: string,
  requesterId: string
): Promise<void> {
  // Prevent self-deletion
  if (userId === requesterId) {
    throw new Error("Cannot delete yourself");
  }

  // Delete user (cascade will delete sessions and accounts)
  const result = await db.delete(user).where(eq(user.id, userId)).returning();

  if (result.length === 0) {
    throw new Error("User not found");
  }
}

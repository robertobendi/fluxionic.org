import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../shared/database/index.js";
import { user, account } from "../../shared/database/schema.js";
import { auth } from "./auth.config.js";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { CreateUserInput, UserResponse } from "./auth.schemas.js";
import { getCollectionAccessInfo } from "../content/collection.service.js";

export type Role = "admin" | "editor" | "viewer" | "user";

const ROLE_RANK: Record<string, number> = {
  admin: 3,
  editor: 2,
  viewer: 1,
  user: 0,
};

/**
 * Gate a handler on a minimum role for a logged-in user. API keys pass only
 * the 'viewer' threshold here — write access for API keys is collection-scoped
 * and must be checked via requireCollectionAccess instead.
 */
export function requireRole(minRole: Role) {
  const required = ROLE_RANK[minRole];
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.apiKey && minRole === "viewer") return;

    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const rank = ROLE_RANK[request.user.role] ?? 0;
    if (rank < required) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

/**
 * Gate a handler on read/write access to a specific collection. Resolves the
 * collection via its `:collectionId` (or `:id`) param, then uses the collection's
 * permissions blob plus the caller's role / API-key scopes to decide access.
 *
 * This is the path that activates per-collection overrides and the API-key
 * `write` scope — use it on entry/submission routes that are scoped to a
 * single collection.
 */
export function requireCollectionAccess(level: "read" | "write") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { collectionId?: string; id?: string } | undefined;
    const idOrSlug = params?.collectionId ?? params?.id;
    if (!idOrSlug) {
      return reply.status(400).send({ error: "Missing collection identifier" });
    }

    const row = await getCollectionAccessInfo(idOrSlug);
    if (!row) {
      return reply.status(404).send({ error: "Collection not found" });
    }

    if (!request.user && !request.apiKey) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const access = resolveCollectionAccess(
      request.user ? { role: request.user.role } : null,
      request.apiKey,
      row.slug,
      (row.permissions as CollectionPermissions | null) ?? null
    );

    if (access === "none" || (level === "write" && access === "read")) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

export type CollectionPermissionLevel = "none" | "read" | "write";

export interface CollectionPermissions {
  editor?: CollectionPermissionLevel;
  viewer?: CollectionPermissionLevel;
}

/**
 * Resolve the effective access level a user (or api key) has on a given
 * collection. Admins always have write access. If the collection has no
 * permissions declared, editors default to write and viewers to read.
 */
export function resolveCollectionAccess(
  user: { role: string } | null,
  apiKey: { scopes: { read: "*" | string[]; write: "*" | string[] } } | null,
  collectionSlug: string,
  permissions: CollectionPermissions | null | undefined
): CollectionPermissionLevel {
  if (user?.role === "admin") return "write";

  const perms = permissions ?? {};
  if (user?.role === "editor") return perms.editor ?? "write";
  if (user?.role === "viewer") return perms.viewer ?? "read";

  if (apiKey) {
    const writeAllowed = apiKey.scopes.write === "*" || apiKey.scopes.write.includes(collectionSlug);
    if (writeAllowed) return "write";
    const readAllowed = apiKey.scopes.read === "*" || apiKey.scopes.read.includes(collectionSlug);
    if (readAllowed) return "read";
  }

  return "none";
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

import crypto from 'crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../../shared/database/index.js';
import { apiKey } from '../../shared/database/schema.js';

export interface ApiKeyScopes {
  read: '*' | string[];
  write: '*' | string[];
}

const TOKEN_PREFIX = 'slk_';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): { token: string; prefix: string } {
  const random = crypto.randomBytes(24).toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const token = `${TOKEN_PREFIX}${random}`;
  return { token, prefix: token.slice(0, 11) };
}

export async function createApiKey(input: {
  name: string;
  scopes: ApiKeyScopes;
  createdBy: string;
  expiresAt?: Date | null;
}): Promise<{ id: string; token: string; prefix: string; name: string; scopes: ApiKeyScopes; expiresAt: string | null; createdAt: string }> {
  const { token, prefix } = generateToken();
  const id = nanoid();
  const tokenHash = hashToken(token);

  const [row] = await db
    .insert(apiKey)
    .values({
      id,
      name: input.name,
      tokenHash,
      prefix,
      scopes: input.scopes,
      createdBy: input.createdBy,
      expiresAt: input.expiresAt ?? null,
    })
    .returning();

  return {
    id: row.id,
    token, // plaintext returned ONCE
    prefix,
    name: row.name,
    scopes: row.scopes as ApiKeyScopes,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listApiKeys() {
  const rows = await db.select().from(apiKey).orderBy(desc(apiKey.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    prefix: r.prefix,
    scopes: r.scopes as ApiKeyScopes,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    revokedAt: r.revokedAt ? r.revokedAt.toISOString() : null,
  }));
}

export async function revokeApiKey(id: string): Promise<boolean> {
  const [row] = await db
    .update(apiKey)
    .set({ revokedAt: new Date() })
    .where(eq(apiKey.id, id))
    .returning({ id: apiKey.id });
  return !!row;
}

export async function deleteApiKey(id: string): Promise<boolean> {
  const result = await db.delete(apiKey).where(eq(apiKey.id, id)).returning({ id: apiKey.id });
  return result.length > 0;
}

/**
 * Look up an API key by its bearer token and return its scopes, or null if
 * invalid/expired/revoked. Also updates lastUsedAt opportunistically.
 */
export async function verifyApiKey(token: string): Promise<{ id: string; scopes: ApiKeyScopes } | null> {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const tokenHash = hashToken(token);
  const [row] = await db
    .select()
    .from(apiKey)
    .where(and(eq(apiKey.tokenHash, tokenHash), isNull(apiKey.revokedAt)))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

  // Fire-and-forget lastUsedAt update — don't block the request on it.
  void db
    .update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, row.id))
    .catch(() => {});

  return { id: row.id, scopes: row.scopes as ApiKeyScopes };
}

export function scopeAllows(scopes: ApiKeyScopes, action: 'read' | 'write', collectionSlug: string): boolean {
  const s = scopes[action];
  if (s === '*') return true;
  return Array.isArray(s) && s.includes(collectionSlug);
}

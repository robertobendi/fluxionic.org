import { and, desc, eq, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../../shared/database/index.js';
import { entry, entryRevision } from '../../shared/database/schema.js';

export const REVISION_LIMIT = 10;

/**
 * Store a revision of an entry's current state. Prunes older revisions so
 * that no more than REVISION_LIMIT revisions remain per entry.
 */
export async function recordRevision(
  entryId: string,
  snapshot: { data: Record<string, unknown>; status: string },
  updatedBy: string | null
): Promise<void> {
  const [latest] = await db
    .select({ version: entryRevision.version })
    .from(entryRevision)
    .where(eq(entryRevision.entryId, entryId))
    .orderBy(desc(entryRevision.version))
    .limit(1);

  const nextVersion = (latest?.version ?? 0) + 1;

  await db.insert(entryRevision).values({
    id: nanoid(),
    entryId,
    version: nextVersion,
    data: snapshot.data,
    status: snapshot.status,
    updatedBy,
  });

  // Prune anything older than the newest REVISION_LIMIT.
  if (nextVersion > REVISION_LIMIT) {
    const cutoff = nextVersion - REVISION_LIMIT;
    await db
      .delete(entryRevision)
      .where(and(eq(entryRevision.entryId, entryId), lt(entryRevision.version, cutoff + 1)));
  }
}

export async function listRevisions(entryId: string) {
  const rows = await db
    .select()
    .from(entryRevision)
    .where(eq(entryRevision.entryId, entryId))
    .orderBy(desc(entryRevision.version));
  return rows.map((r) => ({
    id: r.id,
    entryId: r.entryId,
    version: r.version,
    data: r.data as Record<string, unknown>,
    status: r.status,
    updatedBy: r.updatedBy,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getRevision(entryId: string, version: number) {
  const [row] = await db
    .select()
    .from(entryRevision)
    .where(and(eq(entryRevision.entryId, entryId), eq(entryRevision.version, version)))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    entryId: row.entryId,
    version: row.version,
    data: row.data as Record<string, unknown>,
    status: row.status,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Restore an entry's data from a specific revision. Writes the restoration
 * back onto the entry; caller is responsible for also recording a new
 * revision for the restoration event.
 */
export async function restoreRevision(entryId: string, version: number) {
  const rev = await getRevision(entryId, version);
  if (!rev) return null;
  const [row] = await db
    .update(entry)
    .set({ data: rev.data, updatedAt: new Date() })
    .where(eq(entry.id, entryId))
    .returning();
  return row ? rev : null;
}

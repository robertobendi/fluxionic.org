import { inArray } from 'drizzle-orm';
import { db } from '../../shared/database/index.js';
import { entry, collection } from '../../shared/database/schema.js';
import { FieldDefinition } from './content.types.js';
import { PublicEntry } from './public.schemas.js';

/**
 * Resolve reference / multi-reference field values inline. Accepts a list of
 * entries plus the collection's field definitions and a list of field names
 * to populate. Unknown fields are ignored. One level deep only in v1.
 */
export async function populateReferences(
  entries: PublicEntry[],
  fields: FieldDefinition[],
  populate: string[]
): Promise<PublicEntry[]> {
  if (entries.length === 0 || populate.length === 0) return entries;

  const byName = new Map(fields.map((f) => [f.name, f]));
  const targets = populate.filter((name) => {
    const def = byName.get(name);
    return def && (def.type === 'reference' || def.type === 'multi-reference');
  });
  if (targets.length === 0) return entries;

  // Group referenced IDs per target collection slug
  const idsByCollection = new Map<string, Set<string>>();
  for (const e of entries) {
    for (const name of targets) {
      const def = byName.get(name)!;
      const target = def.referenceCollection;
      if (!target) continue;
      const raw = e.data[name];
      if (!raw) continue;
      const ids = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [typeof raw === 'string' ? raw : null].filter((v): v is string => !!v);
      const set = idsByCollection.get(target) ?? new Set<string>();
      for (const id of ids) set.add(id);
      idsByCollection.set(target, set);
    }
  }

  // Fetch all referenced entries in one go per collection
  const resolved = new Map<string, { slug: string; data: Record<string, unknown>; status: string }>();
  for (const [targetSlug, ids] of idsByCollection.entries()) {
    if (ids.size === 0) continue;
    const [coll] = await db
      .select()
      .from(collection)
      .where(inArray(collection.slug, [targetSlug]))
      .limit(1);
    if (!coll) continue;
    const rows = await db
      .select()
      .from(entry)
      .where(inArray(entry.id, Array.from(ids)));
    for (const r of rows) {
      if (r.collectionId !== coll.id) continue;
      resolved.set(r.id, {
        slug: r.slug,
        data: r.data as Record<string, unknown>,
        status: r.status,
      });
    }
  }

  // Rewrite entries with inlined references (drafts filtered out)
  return entries.map((e) => {
    const data = { ...e.data };
    for (const name of targets) {
      const def = byName.get(name)!;
      const raw = data[name];
      if (def.type === 'reference') {
        const id = typeof raw === 'string' ? raw : null;
        const r = id ? resolved.get(id) : null;
        data[name] = r && r.status === 'published'
          ? { id, slug: r.slug, data: r.data }
          : null;
      } else {
        const ids = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
        data[name] = ids
          .map((id) => {
            const r = resolved.get(id);
            return r && r.status === 'published'
              ? { id, slug: r.slug, data: r.data }
              : null;
          })
          .filter((v) => v !== null);
      }
    }
    return { ...e, data };
  });
}

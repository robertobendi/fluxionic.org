import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../../shared/database/index.js';
import { entry } from '../../shared/database/schema.js';
import { validateEntryData } from './content.validation.js';
import { getCollection } from './collection.service.js';
import { generateSlug, ensureUniqueSlug } from './slug.utils.js';
import { NotFoundError, ValidationError } from '../../shared/errors/index.js';
import { FieldDefinition } from './content.types.js';

export interface ExportedEntry {
  slug: string;
  status: 'draft' | 'published';
  position: number;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export async function exportCollection(collectionId: string): Promise<{
  collection: { slug: string; name: string; fields: FieldDefinition[] };
  entries: ExportedEntry[];
  exportedAt: string;
}> {
  const coll = await getCollection(collectionId);
  if (!coll) throw new NotFoundError('Collection', collectionId);

  const rows = await db
    .select()
    .from(entry)
    .where(eq(entry.collectionId, coll.id));

  return {
    collection: { slug: coll.slug, name: coll.name, fields: coll.fields },
    entries: rows.map((e) => ({
      slug: e.slug,
      status: e.status as 'draft' | 'published',
      position: e.position,
      data: e.data as Record<string, unknown>,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    exportedAt: new Date().toISOString(),
  };
}

export interface ImportOptions {
  /** If true, delete existing entries before import. Default false (upsert by slug). */
  replace?: boolean;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ slug?: string; index: number; message: string }>;
}

export async function importCollection(
  collectionId: string,
  payload: { entries: ExportedEntry[] },
  options: ImportOptions = {}
): Promise<ImportResult> {
  const coll = await getCollection(collectionId);
  if (!coll) throw new NotFoundError('Collection', collectionId);

  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  if (options.replace) {
    await db.delete(entry).where(eq(entry.collectionId, coll.id));
  }

  for (let i = 0; i < payload.entries.length; i++) {
    const item = payload.entries[i];
    try {
      if (!item.data || typeof item.data !== 'object') {
        throw new ValidationError('entry.data is required');
      }
      const validation = validateEntryData(coll.fields, item.data);
      if (!validation.valid) {
        result.errors.push({
          slug: item.slug,
          index: i,
          message: validation.errors.join('; '),
        });
        result.skipped++;
        continue;
      }

      const slug = item.slug || await ensureUniqueSlug(coll.id, generateSlug(String(item.data.title ?? nanoid(8))));
      const existing = options.replace
        ? null
        : await db
            .select({ id: entry.id })
            .from(entry)
            .where(and(eq(entry.collectionId, coll.id), eq(entry.slug, slug)))
            .limit(1)
            .then((r) => r[0] ?? null);

      if (existing) {
        await db
          .update(entry)
          .set({
            data: item.data,
            status: item.status ?? 'draft',
            position: item.position ?? 0,
            updatedAt: new Date(),
          })
          .where(eq(entry.id, existing.id));
        result.updated++;
      } else {
        await db.insert(entry).values({
          id: nanoid(),
          collectionId: coll.id,
          slug,
          data: item.data,
          status: item.status ?? 'draft',
          position: item.position ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        result.inserted++;
      }
    } catch (err: any) {
      result.errors.push({
        slug: item.slug,
        index: i,
        message: err?.message ?? String(err),
      });
      result.skipped++;
    }
  }

  return result;
}

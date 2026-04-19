import { nanoid } from 'nanoid';
import { db } from '../../shared/database/index.js';
import { entry } from '../../shared/database/schema.js';
import { eq, and, desc, asc, count, sql, inArray } from 'drizzle-orm';
import { validateEntryData } from './content.validation.js';
import { getCollection } from './collection.service.js';
import { generateSlug, ensureUniqueSlug } from './slug.utils.js';
import { CreateEntryInput, UpdateEntryInput, EntryResponse, SearchEntriesQuery } from './entry.schemas.js';
import { PublicEntry } from './public.schemas.js';
import { NotFoundError, ValidationError } from '../../shared/errors/index.js';
import { ParsedQuery } from './query.parser.js';
import { buildFilterSql, buildSortSql, projectFields } from './query.translator.js';
import { FieldDefinition } from './content.types.js';
import { collection } from '../../shared/database/schema.js';
import { enqueueEvent } from '../webhooks/webhook.service.js';
import { recordRevision, REVISION_LIMIT } from './revision.service.js';

function toEntryResponse(e: typeof entry.$inferSelect): EntryResponse {
  return {
    id: e.id,
    collectionId: e.collectionId,
    slug: e.slug,
    data: e.data as Record<string, unknown>,
    status: e.status as 'draft' | 'published',
    position: e.position,
    publishAt: e.publishAt ? e.publishAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

async function emitEntryEvent(
  event:
    | 'entry.created'
    | 'entry.updated'
    | 'entry.deleted'
    | 'entry.published'
    | 'entry.unpublished',
  collectionSlug: string,
  entryData: Record<string, unknown>
) {
  try {
    await enqueueEvent(event, collectionSlug, entryData);
  } catch (err) {
    // Never block the request path on webhook enqueue failures.
    // eslint-disable-next-line no-console
    console.warn(`enqueueEvent failed for ${event}:`, err);
  }
}

/**
 * Verify that every ID referenced by a reference/multi-reference field
 * exists in its target collection. Throws ValidationError with per-field
 * details on mismatch.
 */
async function validateReferences(
  fields: FieldDefinition[],
  data: Record<string, unknown>
): Promise<void> {
  const refFields = fields.filter(
    (f) => f.type === 'reference' || f.type === 'multi-reference'
  );
  if (refFields.length === 0) return;

  const byCollection = new Map<string, Set<string>>();
  const fieldByPair = new Map<string, string>();

  for (const f of refFields) {
    if (!f.referenceCollection) continue;
    const raw = data[f.name];
    if (raw === undefined || raw === null) continue;
    const ids = Array.isArray(raw)
      ? raw.filter((v): v is string => typeof v === 'string')
      : typeof raw === 'string'
        ? [raw]
        : [];
    if (ids.length === 0) continue;
    const set = byCollection.get(f.referenceCollection) ?? new Set<string>();
    for (const id of ids) {
      set.add(id);
      fieldByPair.set(`${f.referenceCollection}:${id}`, f.name);
    }
    byCollection.set(f.referenceCollection, set);
  }

  const errors: { field: string; message: string }[] = [];
  for (const [collSlug, ids] of byCollection.entries()) {
    const [coll] = await db
      .select()
      .from(collection)
      .where(eq(collection.slug, collSlug))
      .limit(1);
    if (!coll) {
      errors.push({ field: collSlug, message: `Referenced collection '${collSlug}' not found` });
      continue;
    }
    const rows = await db
      .select({ id: entry.id })
      .from(entry)
      .where(and(eq(entry.collectionId, coll.id), inArray(entry.id, Array.from(ids))));
    const found = new Set(rows.map((r) => r.id));
    for (const id of ids) {
      if (!found.has(id)) {
        const fname = fieldByPair.get(`${collSlug}:${id}`) ?? collSlug;
        errors.push({ field: fname, message: `Referenced entry '${id}' not found in '${collSlug}'` });
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Reference validation failed', errors);
  }
}

/**
 * Create a new entry in a collection
 */
export async function createEntry(
  collectionId: string,
  input: CreateEntryInput
): Promise<EntryResponse> {
  // Fetch collection
  const coll = await getCollection(collectionId);
  if (!coll) {
    throw new NotFoundError('Collection', collectionId);
  }

  // Validate entry data against collection schema
  const validation = validateEntryData(coll.fields, input.data);
  if (!validation.valid) {
    const details = validation.errors.map((err) => {
      const [field, ...messageParts] = err.split(': ');
      return { field, message: messageParts.join(': ') };
    });
    throw new ValidationError('Validation failed', details);
  }

  // Validate references (existence checks)
  await validateReferences(coll.fields, input.data);

  // Generate slug from configured field or fallback to 'title'
  const slugField = coll.fields.find((f) => f.type === 'slug');
  let slug: string;

  if (slugField && slugField.generateFrom) {
    const sourceValue = input.data[slugField.generateFrom];
    if (sourceValue) {
      const baseSlug = generateSlug(String(sourceValue));
      slug = await ensureUniqueSlug(collectionId, baseSlug);
    } else {
      throw new ValidationError(`Slug source field '${slugField.generateFrom}' is required`);
    }
  } else {
    // Fallback: use 'title' field or generate from id
    const titleValue = input.data.title;
    const baseSlug = titleValue ? generateSlug(String(titleValue)) : nanoid(8);
    slug = await ensureUniqueSlug(collectionId, baseSlug);
  }

  // Insert entry
  const newEntry = await db
    .insert(entry)
    .values({
      id: nanoid(),
      collectionId,
      slug,
      data: input.data,
      status: input.status ?? 'draft',
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  const created = newEntry[0];
  await recordRevision(created.id, {
    data: created.data as Record<string, unknown>,
    status: created.status,
  }, null);

  const payload = {
    id: created.id,
    collection: coll.slug,
    slug: created.slug,
    status: created.status,
    data: created.data as Record<string, unknown>,
  };
  await emitEntryEvent('entry.created', coll.slug, payload);
  if (created.status === 'published') {
    await emitEntryEvent('entry.published', coll.slug, payload);
  }

  return toEntryResponse(created);
}

/**
 * Get a single entry by ID
 */
export async function getEntry(
  collectionId: string,
  entryId: string
): Promise<EntryResponse | null> {
  const result = await db
    .select()
    .from(entry)
    .where(and(eq(entry.id, entryId), eq(entry.collectionId, collectionId)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return toEntryResponse(result[0]);
}

/**
 * List entries in a collection
 */
export async function listEntries(
  collectionId: string,
  options?: {
    status?: 'draft' | 'published';
    page?: number;
    limit?: number;
  }
): Promise<{ entries: EntryResponse[]; total: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = options?.status
    ? and(eq(entry.collectionId, collectionId), eq(entry.status, options.status))
    : eq(entry.collectionId, collectionId);

  // Query entries with pagination
  const results = await db
    .select()
    .from(entry)
    .where(conditions)
    .orderBy(asc(entry.position), desc(entry.createdAt))
    .limit(limit)
    .offset(offset);

  // Count total entries
  const [countResult] = await db
    .select({ count: count() })
    .from(entry)
    .where(conditions);

  const total = countResult.count;

  const entries = results.map(toEntryResponse);
  return { entries, total };
}

/**
 * Search entries in a collection with full-text search and filtering
 */
export async function searchEntries(
  collectionId: string,
  options: SearchEntriesQuery
): Promise<{ entries: EntryResponse[]; total: number }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const offset = (page - 1) * limit;

  // Build base conditions
  const conditions = [eq(entry.collectionId, collectionId)];

  // Add full-text search condition if query provided
  if (options.q) {
    conditions.push(
      sql`to_tsvector('english', ${entry.data}::text) @@ plainto_tsquery('english', ${options.q})`
    );
  }

  // Add status filter if provided
  if (options.status) {
    conditions.push(eq(entry.status, options.status));
  }

  const whereClause = and(...conditions);

  // Query entries with pagination
  const results = await db
    .select()
    .from(entry)
    .where(whereClause)
    .orderBy(asc(entry.position), desc(entry.createdAt))
    .limit(limit)
    .offset(offset);

  // Count total matching entries
  const [countResult] = await db
    .select({ count: count() })
    .from(entry)
    .where(whereClause);

  const total = countResult.count;

  const entries = results.map(toEntryResponse);
  return { entries, total };
}

/**
 * Update an existing entry
 */
export async function updateEntry(
  collectionId: string,
  entryId: string,
  input: UpdateEntryInput,
  updatedBy: string | null = null
): Promise<EntryResponse> {
  // Fetch existing entry
  const existingEntry = await getEntry(collectionId, entryId);
  if (!existingEntry) {
    throw new NotFoundError('Entry', entryId);
  }

  const coll = await getCollection(collectionId);
  if (!coll) {
    throw new NotFoundError('Collection', collectionId);
  }

  // If data is being updated, validate it
  let mergedData: Record<string, unknown> | undefined;
  let newSlug: string | undefined;
  if (input.data) {
    mergedData = { ...existingEntry.data, ...input.data };
    const validation = validateEntryData(coll.fields, mergedData);
    if (!validation.valid) {
      const details = validation.errors.map((err) => {
        const [field, ...messageParts] = err.split(': ');
        return { field, message: messageParts.join(': ') };
      });
      throw new ValidationError('Validation failed', details);
    }
    await validateReferences(coll.fields, mergedData);

    // Check if slug needs regeneration
    const slugField = coll.fields.find((f) => f.type === 'slug');
    if (slugField && slugField.generateFrom) {
      const sourceFieldName = slugField.generateFrom;
      const oldSourceValue = existingEntry.data[sourceFieldName];
      const newSourceValue = input.data[sourceFieldName];

      if (newSourceValue !== undefined && newSourceValue !== oldSourceValue) {
        const newBaseSlug = generateSlug(String(newSourceValue));
        newSlug = await ensureUniqueSlug(collectionId, newBaseSlug, entryId);
      }
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (mergedData) updateData.data = mergedData;
  if (newSlug) updateData.slug = newSlug;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.position !== undefined) updateData.position = input.position;
  if (input.publishAt !== undefined) {
    updateData.publishAt = input.publishAt ? new Date(input.publishAt) : null;
  }

  const updated = await db
    .update(entry)
    .set(updateData)
    .where(and(eq(entry.id, entryId), eq(entry.collectionId, collectionId)))
    .returning();

  const e = updated[0];
  await recordRevision(e.id, { data: e.data as Record<string, unknown>, status: e.status }, updatedBy);

  const payload = {
    id: e.id,
    collection: coll.slug,
    slug: e.slug,
    status: e.status,
    data: e.data as Record<string, unknown>,
  };
  await emitEntryEvent('entry.updated', coll.slug, payload);
  if (existingEntry.status !== 'published' && e.status === 'published') {
    await emitEntryEvent('entry.published', coll.slug, payload);
  } else if (existingEntry.status === 'published' && e.status !== 'published') {
    await emitEntryEvent('entry.unpublished', coll.slug, payload);
  }

  return toEntryResponse(e);
}

/**
 * Delete an entry
 */
export async function deleteEntry(
  collectionId: string,
  entryId: string
): Promise<void> {
  const coll = await getCollection(collectionId);
  const result = await db
    .delete(entry)
    .where(and(eq(entry.id, entryId), eq(entry.collectionId, collectionId)))
    .returning();

  if (result.length === 0) {
    throw new NotFoundError('Entry');
  }

  const e = result[0];
  if (coll) {
    const payload = {
      id: e.id,
      collection: coll.slug,
      slug: e.slug,
      status: e.status,
      data: e.data as Record<string, unknown>,
    };
    await emitEntryEvent('entry.deleted', coll.slug, payload);
    if (e.status === 'published') {
      await emitEntryEvent('entry.unpublished', coll.slug, payload);
    }
  }
}

/**
 * Find entries that reference the given entry ID. Used to surface orphan-risk
 * warnings to the admin UI before a delete. Does NOT prevent deletion —
 * dangling references are intentionally left to the frontend to handle.
 */
export async function findReferencers(
  entryId: string
): Promise<Array<{ collectionSlug: string; collectionName: string; entryId: string; entrySlug: string; fieldName: string }>> {
  // Find any collection that references this entry via jsonb lookup.
  // We search all entries whose data contains this id (as value or array item).
  const results = await db.execute(sql`
    SELECT e.id, e.slug, e.data, c.slug as collection_slug, c.name as collection_name, c.fields
    FROM entry e
    JOIN collection c ON c.id = e.collection_id
    WHERE e.data::text LIKE ${'%' + entryId + '%'}
    LIMIT 50
  `);

  const rows = (results as any).rows ?? results;
  const out: Array<{ collectionSlug: string; collectionName: string; entryId: string; entrySlug: string; fieldName: string }> = [];

  for (const row of rows as any[]) {
    const data = row.data as Record<string, unknown>;
    const fields = row.fields as FieldDefinition[];
    const refFields = fields.filter((f) => f.type === 'reference' || f.type === 'multi-reference');
    for (const f of refFields) {
      const val = data[f.name];
      const matches = Array.isArray(val)
        ? val.includes(entryId)
        : val === entryId;
      if (matches) {
        out.push({
          collectionSlug: row.collection_slug,
          collectionName: row.collection_name,
          entryId: row.id,
          entrySlug: row.slug,
          fieldName: f.name,
        });
      }
    }
  }
  return out;
}

/**
 * Reorder entries for drag-and-drop
 * Uses batch UPDATE with CASE for O(1) queries instead of O(n)
 */
export async function reorderEntries(
  collectionId: string,
  orderedIds: string[]
): Promise<void> {
  if (orderedIds.length === 0) return;

  // Build CASE expression for position updates
  const cases = orderedIds
    .map((id, index) => sql`WHEN ${id} THEN ${index}`)
    .reduce((acc, curr) => sql`${acc} ${curr}`);

  // Single batch update query
  await db.execute(sql`
    UPDATE entry
    SET position = CASE id ${cases} END,
        updated_at = NOW()
    WHERE collection_id = ${collectionId}
      AND id IN ${sql`(${sql.join(orderedIds.map(id => sql`${id}`), sql`, `)})`}
  `);
}

/**
 * List published entries for public API
 */
export async function listPublishedEntries(
  collectionSlug: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ entries: PublicEntry[]; total: number }> {
  // Get collection by slug
  const coll = await getCollection(collectionSlug);
  if (!coll) {
    throw new NotFoundError('Collection', collectionSlug);
  }

  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const offset = (page - 1) * limit;

  // Query published entries with pagination
  const results = await db
    .select()
    .from(entry)
    .where(and(eq(entry.collectionId, coll.id), eq(entry.status, 'published')))
    .orderBy(asc(entry.position), desc(entry.createdAt))
    .limit(limit)
    .offset(offset);

  // Count total published entries
  const [countResult] = await db
    .select({ count: count() })
    .from(entry)
    .where(and(eq(entry.collectionId, coll.id), eq(entry.status, 'published')));

  const total = countResult.count;

  // Map to public format
  const entries: PublicEntry[] = results.map((e) => ({
    slug: e.slug,
    data: e.data as Record<string, unknown>,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return { entries, total };
}

/**
 * Query published entries with rich filters / sort / pagination / field selection.
 * Returns projected entries plus total count.
 */
export async function queryPublishedEntries(
  collectionSlug: string,
  query: ParsedQuery
): Promise<{ entries: PublicEntry[]; total: number; collectionFields: FieldDefinition[] }> {
  const coll = await getCollection(collectionSlug);
  if (!coll) {
    throw new NotFoundError('Collection', collectionSlug);
  }

  const conditions = [
    eq(entry.collectionId, coll.id),
    eq(entry.status, 'published'),
  ];
  for (const f of query.filters) {
    conditions.push(buildFilterSql(f));
  }
  if (query.q) {
    conditions.push(
      sql`to_tsvector('english', ${entry.data}::text) @@ websearch_to_tsquery('english', ${query.q})`
    );
  }
  const whereClause = and(...conditions);

  const orderExprs = query.sort.length > 0
    ? query.sort.map(buildSortSql)
    : [asc(entry.position), desc(entry.createdAt)];

  const results = await db
    .select()
    .from(entry)
    .where(whereClause)
    .orderBy(...orderExprs)
    .limit(query.limit)
    .offset(query.offset);

  const [countResult] = await db
    .select({ count: count() })
    .from(entry)
    .where(whereClause);

  const entries: PublicEntry[] = results.map((e) =>
    projectFields(
      {
        slug: e.slug,
        data: e.data as Record<string, unknown>,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      },
      query.fields
    )
  );

  return { entries, total: countResult.count, collectionFields: coll.fields };
}

/**
 * Get a single entry for public API. When a valid preview token is supplied
 * the caller may see the draft version; otherwise only published entries
 * are returned.
 */
export async function getPublishedEntry(
  collectionSlug: string,
  entrySlug: string,
  options: { previewToken?: string } = {}
): Promise<PublicEntry | null> {
  const coll = await getCollection(collectionSlug);
  if (!coll) {
    throw new NotFoundError('Collection', collectionSlug);
  }

  let previewEntryId: string | null = null;
  if (options.previewToken) {
    const { verifyPreviewToken } = await import('./preview.service.js');
    previewEntryId = verifyPreviewToken(options.previewToken);
  }

  const result = await db
    .select()
    .from(entry)
    .where(
      and(
        eq(entry.collectionId, coll.id),
        eq(entry.slug, entrySlug)
      )
    )
    .limit(1);

  if (result.length === 0) return null;
  const e = result[0];

  const isPreviewMatch = previewEntryId !== null && previewEntryId === e.id;
  if (e.status !== 'published' && !isPreviewMatch) return null;

  return {
    slug: e.slug,
    data: e.data as Record<string, unknown>,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

/**
 * Get entry statistics across all collections
 */
export async function getEntryStats(): Promise<{ total: number }> {
  const [result] = await db
    .select({ count: count() })
    .from(entry);
  return { total: result.count };
}

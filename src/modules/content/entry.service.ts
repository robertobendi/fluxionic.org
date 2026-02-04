import { nanoid } from 'nanoid';
import { db } from '../../shared/database/index.js';
import { entry } from '../../shared/database/schema.js';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { validateEntryData } from './content.validation.js';
import { getCollection } from './collection.service.js';
import { generateSlug, ensureUniqueSlug } from './slug.utils.js';
import { CreateEntryInput, UpdateEntryInput, EntryResponse, SearchEntriesQuery } from './entry.schemas.js';
import { PublicEntry } from './public.schemas.js';
import { NotFoundError, ValidationError } from '../../shared/errors/index.js';

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

  return {
    id: newEntry[0].id,
    collectionId: newEntry[0].collectionId,
    slug: newEntry[0].slug,
    data: newEntry[0].data as Record<string, unknown>,
    status: newEntry[0].status as 'draft' | 'published',
    position: newEntry[0].position,
    createdAt: newEntry[0].createdAt.toISOString(),
    updatedAt: newEntry[0].updatedAt.toISOString(),
  };
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

  const e = result[0];
  return {
    id: e.id,
    collectionId: e.collectionId,
    slug: e.slug,
    data: e.data as Record<string, unknown>,
    status: e.status as 'draft' | 'published',
    position: e.position,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
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

  const entries = results.map((e) => ({
    id: e.id,
    collectionId: e.collectionId,
    slug: e.slug,
    data: e.data as Record<string, unknown>,
    status: e.status as 'draft' | 'published',
    position: e.position,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

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

  const entries = results.map((e) => ({
    id: e.id,
    collectionId: e.collectionId,
    slug: e.slug,
    data: e.data as Record<string, unknown>,
    status: e.status as 'draft' | 'published',
    position: e.position,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return { entries, total };
}

/**
 * Update an existing entry
 */
export async function updateEntry(
  collectionId: string,
  entryId: string,
  input: UpdateEntryInput
): Promise<EntryResponse> {
  // Fetch existing entry
  const existingEntry = await getEntry(collectionId, entryId);
  if (!existingEntry) {
    throw new NotFoundError('Entry', entryId);
  }

  // If data is being updated, validate it
  if (input.data) {
    const coll = await getCollection(collectionId);
    if (!coll) {
      throw new NotFoundError('Collection', collectionId);
    }

    // Merge existing data with updates for validation
    const mergedData = { ...existingEntry.data, ...input.data };
    const validation = validateEntryData(coll.fields, mergedData);
    if (!validation.valid) {
      const details = validation.errors.map((err) => {
        const [field, ...messageParts] = err.split(': ');
        return { field, message: messageParts.join(': ') };
      });
      throw new ValidationError('Validation failed', details);
    }

    // Check if slug needs regeneration
    const slugField = coll.fields.find((f) => f.type === 'slug');
    if (slugField && slugField.generateFrom) {
      const sourceFieldName = slugField.generateFrom;
      const oldSourceValue = existingEntry.data[sourceFieldName];
      const newSourceValue = input.data[sourceFieldName];

      // If the source field changed, regenerate slug
      if (newSourceValue !== undefined && newSourceValue !== oldSourceValue) {
        const newBaseSlug = generateSlug(String(newSourceValue));
        const newSlug = await ensureUniqueSlug(collectionId, newBaseSlug, entryId);

        // Update entry with new slug and data
        const updated = await db
          .update(entry)
          .set({
            slug: newSlug,
            data: mergedData,
            status: input.status ?? existingEntry.status,
            position: input.position ?? existingEntry.position,
            updatedAt: new Date(),
          })
          .where(and(eq(entry.id, entryId), eq(entry.collectionId, collectionId)))
          .returning();

        const e = updated[0];
        return {
          id: e.id,
          collectionId: e.collectionId,
          slug: e.slug,
          data: e.data as Record<string, unknown>,
          status: e.status as 'draft' | 'published',
          position: e.position,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        };
      }
    }
  }

  // Update entry without slug change
  const updateData: any = {
    updatedAt: new Date(),
  };
  if (input.data) {
    updateData.data = { ...existingEntry.data, ...input.data };
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }
  if (input.position !== undefined) {
    updateData.position = input.position;
  }

  const updated = await db
    .update(entry)
    .set(updateData)
    .where(and(eq(entry.id, entryId), eq(entry.collectionId, collectionId)))
    .returning();

  const e = updated[0];
  return {
    id: e.id,
    collectionId: e.collectionId,
    slug: e.slug,
    data: e.data as Record<string, unknown>,
    status: e.status as 'draft' | 'published',
    position: e.position,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

/**
 * Delete an entry
 */
export async function deleteEntry(
  collectionId: string,
  entryId: string
): Promise<void> {
  const result = await db
    .delete(entry)
    .where(and(eq(entry.id, entryId), eq(entry.collectionId, collectionId)))
    .returning({ id: entry.id });

  if (result.length === 0) {
    throw new NotFoundError('Entry');
  }
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
 * Get a single published entry for public API
 */
export async function getPublishedEntry(
  collectionSlug: string,
  entrySlug: string
): Promise<PublicEntry | null> {
  // Get collection by slug
  const coll = await getCollection(collectionSlug);
  if (!coll) {
    throw new NotFoundError('Collection', collectionSlug);
  }

  // Find published entry by slug
  const result = await db
    .select()
    .from(entry)
    .where(
      and(
        eq(entry.collectionId, coll.id),
        eq(entry.slug, entrySlug),
        eq(entry.status, 'published')
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const e = result[0];
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

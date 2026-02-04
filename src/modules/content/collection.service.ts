import { db } from '../../shared/database/index.js';
import { collection } from '../../shared/database/schema.js';
import { eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { FieldDefinition } from './content.types.js';
import {
  CreateCollectionInput,
  UpdateCollectionInput,
  CollectionResponse,
} from './collection.schemas.js';

/**
 * Create a new collection
 */
export async function createCollection(
  input: CreateCollectionInput
): Promise<CollectionResponse> {
  // Check slug uniqueness
  const existing = await db
    .select()
    .from(collection)
    .where(eq(collection.slug, input.slug))
    .limit(1);

  if (existing.length > 0) {
    const error = new Error('Collection with this slug already exists');
    (error as any).code = 'DUPLICATE_SLUG';
    throw error;
  }

  // Insert collection
  const [newCollection] = await db
    .insert(collection)
    .values({
      id: nanoid(),
      name: input.name,
      slug: input.slug,
      fields: input.fields,
    })
    .returning();

  return {
    id: newCollection.id,
    name: newCollection.name,
    slug: newCollection.slug,
    fields: newCollection.fields as FieldDefinition[],
    createdAt: newCollection.createdAt.toISOString(),
    updatedAt: newCollection.updatedAt.toISOString(),
  };
}

/**
 * Get collection by id or slug
 */
export async function getCollection(
  idOrSlug: string
): Promise<CollectionResponse | null> {
  const [result] = await db
    .select()
    .from(collection)
    .where(or(eq(collection.id, idOrSlug), eq(collection.slug, idOrSlug)))
    .limit(1);

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    name: result.name,
    slug: result.slug,
    fields: result.fields as FieldDefinition[],
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}

/**
 * List all collections ordered by name
 */
export async function listCollections(): Promise<CollectionResponse[]> {
  const collections = await db
    .select()
    .from(collection)
    .orderBy(collection.name);

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    fields: c.fields as FieldDefinition[],
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

/**
 * Update collection (only provided fields)
 */
export async function updateCollection(
  id: string,
  input: UpdateCollectionInput
): Promise<CollectionResponse | null> {
  // Build update object with only provided fields
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.fields !== undefined) {
    updateData.fields = input.fields;
  }

  const [updated] = await db
    .update(collection)
    .set(updateData)
    .where(eq(collection.id, id))
    .returning();

  if (!updated) {
    return null;
  }

  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    fields: updated.fields as FieldDefinition[],
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

/**
 * Delete collection (cascade deletes entries)
 */
export async function deleteCollection(id: string): Promise<boolean> {
  const result = await db
    .delete(collection)
    .where(eq(collection.id, id))
    .returning();

  return result.length > 0;
}

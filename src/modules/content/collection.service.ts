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
import { validateFieldDefinitions } from './content.validation.js';
import { ValidationError } from '../../shared/errors/index.js';

/**
 * Create a new collection
 */
export async function createCollection(
  input: CreateCollectionInput
): Promise<CollectionResponse> {
  // Semantic validation (reference/repeater invariants beyond TypeBox shape)
  const sem = validateFieldDefinitions(input.fields as FieldDefinition[]);
  if (!sem.valid) {
    throw new ValidationError(
      'Invalid field definitions',
      sem.errors.map((e) => {
        const [field, ...rest] = e.split(': ');
        return { field, message: rest.join(': ') };
      })
    );
  }

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
 * Lightweight lookup that also returns the raw permissions blob. Used by the
 * access-control helpers to resolve per-collection read/write rules without
 * materialising the full CollectionResponse.
 */
export async function getCollectionAccessInfo(
  idOrSlug: string
): Promise<{ id: string; slug: string; permissions: unknown } | null> {
  const [result] = await db
    .select({ id: collection.id, slug: collection.slug, permissions: collection.permissions })
    .from(collection)
    .where(or(eq(collection.id, idOrSlug), eq(collection.slug, idOrSlug)))
    .limit(1);

  return result ?? null;
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
  if (input.fields !== undefined) {
    const sem = validateFieldDefinitions(input.fields as FieldDefinition[]);
    if (!sem.valid) {
      throw new ValidationError(
        'Invalid field definitions',
        sem.errors.map((e) => {
          const [field, ...rest] = e.split(': ');
          return { field, message: rest.join(': ') };
        })
      );
    }
  }

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

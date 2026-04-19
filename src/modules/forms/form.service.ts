import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../../shared/database/index.js';
import { collection, formSubmission } from '../../shared/database/schema.js';
import { validateEntryData } from '../content/content.validation.js';
import { NotFoundError, ValidationError, BadRequestError } from '../../shared/errors/index.js';
import { FieldDefinition } from '../content/content.types.js';

const HONEYPOT_FIELD = '_honeypot';

/**
 * Accept a submission to a form collection. The collection must be flagged
 * isForm=true. Submissions are never exposed via the public content API.
 */
export async function submitForm(
  collectionSlug: string,
  payload: Record<string, unknown>,
  meta: { ipAddress?: string | null; userAgent?: string | null }
): Promise<{ id: string }> {
  const [coll] = await db
    .select()
    .from(collection)
    .where(eq(collection.slug, collectionSlug))
    .limit(1);

  if (!coll) throw new NotFoundError('Form', collectionSlug);
  if (!coll.isForm) throw new BadRequestError(`'${collectionSlug}' is not a form collection`);

  // Honeypot: reject silently with fake success if filled.
  if (payload[HONEYPOT_FIELD]) {
    return { id: 'accepted' };
  }
  const cleanPayload = { ...payload };
  delete cleanPayload[HONEYPOT_FIELD];

  const fields = coll.fields as FieldDefinition[];
  const validation = validateEntryData(fields, cleanPayload);
  if (!validation.valid) {
    throw new ValidationError('Validation failed', validation.errors.map((e) => {
      const [field, ...rest] = e.split(': ');
      return { field, message: rest.join(': ') };
    }));
  }

  const id = nanoid();
  await db.insert(formSubmission).values({
    id,
    collectionId: coll.id,
    data: cleanPayload,
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent ?? null,
  });

  return { id };
}

export async function listSubmissions(collectionId: string) {
  const rows = await db
    .select()
    .from(formSubmission)
    .where(eq(formSubmission.collectionId, collectionId))
    .orderBy(desc(formSubmission.createdAt))
    .limit(500);
  return rows.map((r) => ({
    id: r.id,
    data: r.data as Record<string, unknown>,
    ipAddress: r.ipAddress,
    userAgent: r.userAgent,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const result = await db
    .delete(formSubmission)
    .where(eq(formSubmission.id, id))
    .returning({ id: formSubmission.id });
  return result.length > 0;
}

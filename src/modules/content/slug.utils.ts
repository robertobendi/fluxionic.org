import slugifyLib from 'slugify';
import { db } from '../../shared/database/index.js';
import { entry } from '../../shared/database/schema.js';
import { eq, and, ne } from 'drizzle-orm';

// Handle both CommonJS and ESM exports
const slugify = typeof slugifyLib === 'function' ? slugifyLib : (slugifyLib as any).default;

/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true, // remove special characters
    trim: true,
  });
}

/**
 * Ensure slug is unique within collection by appending counter if needed
 * Uses retry pattern for race condition handling
 */
export async function ensureUniqueSlug(
  collectionId: string,
  baseSlug: string,
  excludeEntryId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const conditions = excludeEntryId
      ? and(
          eq(entry.collectionId, collectionId),
          eq(entry.slug, slug),
          ne(entry.id, excludeEntryId)
        )
      : and(eq(entry.collectionId, collectionId), eq(entry.slug, slug));

    const existing = await db
      .select({ id: entry.id })
      .from(entry)
      .where(conditions)
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;

    // Safety limit
    if (counter > 100) {
      throw new Error('Unable to generate unique slug');
    }
  }
}

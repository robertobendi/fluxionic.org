import { db } from '../shared/database/index.js';
import { collection } from '../shared/database/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { FieldDefinition } from '../modules/content/content.types.js';
import { DefinedCollection } from './config-loader.js';

export interface DiffEntry {
  kind: 'create' | 'update' | 'remove-collection' | 'add-field' | 'remove-field' | 'modify-field';
  collectionSlug: string;
  fieldName?: string;
  before?: unknown;
  after?: unknown;
}

function sameField(a: FieldDefinition, b: FieldDefinition): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function diff(defs: DefinedCollection[]): Promise<DiffEntry[]> {
  const existing = await db.select().from(collection);
  const existingBySlug = new Map(existing.map((c) => [c.slug, c]));
  const defsBySlug = new Map(defs.map((d) => [d.slug, d]));
  const changes: DiffEntry[] = [];

  for (const def of defs) {
    const current = existingBySlug.get(def.slug);
    if (!current) {
      changes.push({ kind: 'create', collectionSlug: def.slug, after: def });
      continue;
    }
    const currentFields = current.fields as FieldDefinition[];
    const byName = new Map(currentFields.map((f) => [f.name, f]));
    const defByName = new Map(def.fields.map((f) => [f.name, f]));

    for (const f of def.fields) {
      const existing = byName.get(f.name);
      if (!existing) changes.push({ kind: 'add-field', collectionSlug: def.slug, fieldName: f.name, after: f });
      else if (!sameField(existing, f)) changes.push({ kind: 'modify-field', collectionSlug: def.slug, fieldName: f.name, before: existing, after: f });
    }
    for (const f of currentFields) {
      if (!defByName.has(f.name)) {
        changes.push({ kind: 'remove-field', collectionSlug: def.slug, fieldName: f.name, before: f });
      }
    }
    if (current.name !== def.name) {
      changes.push({ kind: 'update', collectionSlug: def.slug, before: current.name, after: def.name });
    }
  }
  for (const current of existing) {
    if (!defsBySlug.has(current.slug)) {
      changes.push({ kind: 'remove-collection', collectionSlug: current.slug, before: current });
    }
  }
  return changes;
}

export async function applyDiff(defs: DefinedCollection[], opts: { force?: boolean } = {}): Promise<{ applied: DiffEntry[]; warnings: string[] }> {
  const changes = await diff(defs);
  const destructive = changes.filter((c) => c.kind === 'remove-field' || c.kind === 'remove-collection');
  if (destructive.length > 0 && !opts.force) {
    const lines = destructive.map((c) =>
      c.kind === 'remove-collection'
        ? `  - would delete collection '${c.collectionSlug}' and all its entries`
        : `  - would remove field '${c.fieldName}' from '${c.collectionSlug}'`
    );
    throw new Error(
      `Refusing to apply destructive changes without --force:\n${lines.join('\n')}`
    );
  }

  const applied: DiffEntry[] = [];
  const warnings: string[] = [];
  const defsBySlug = new Map(defs.map((d) => [d.slug, d]));

  for (const def of defs) {
    const [existing] = await db.select().from(collection).where(eq(collection.slug, def.slug)).limit(1);
    if (!existing) {
      await db.insert(collection).values({
        id: nanoid(),
        slug: def.slug,
        name: def.name,
        fields: def.fields,
        permissions: def.permissions ?? null,
        isForm: def.isForm ?? false,
      });
      applied.push({ kind: 'create', collectionSlug: def.slug, after: def });
    } else {
      await db
        .update(collection)
        .set({
          name: def.name,
          fields: def.fields,
          permissions: def.permissions ?? null,
          isForm: def.isForm ?? false,
          updatedAt: new Date(),
        })
        .where(eq(collection.id, existing.id));
      const currentFields = existing.fields as FieldDefinition[];
      const currentByName = new Map(currentFields.map((f) => [f.name, f]));
      for (const f of def.fields) {
        const cur = currentByName.get(f.name);
        if (!cur) applied.push({ kind: 'add-field', collectionSlug: def.slug, fieldName: f.name, after: f });
        else if (!sameField(cur, f)) applied.push({ kind: 'modify-field', collectionSlug: def.slug, fieldName: f.name, before: cur, after: f });
      }
      const defByName = new Map(def.fields.map((f) => [f.name, f]));
      for (const f of currentFields) {
        if (!defByName.has(f.name)) applied.push({ kind: 'remove-field', collectionSlug: def.slug, fieldName: f.name, before: f });
      }
    }
  }

  const existing = await db.select().from(collection);
  for (const current of existing) {
    if (!defsBySlug.has(current.slug)) {
      if (opts.force) {
        await db.delete(collection).where(eq(collection.id, current.id));
        applied.push({ kind: 'remove-collection', collectionSlug: current.slug, before: current });
      } else {
        warnings.push(`Skipped delete of collection '${current.slug}' (use --force)`);
      }
    }
  }

  return { applied, warnings };
}

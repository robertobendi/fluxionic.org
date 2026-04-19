import { FieldDefinition } from './content.types.js';
import { BadRequestError } from '../../shared/errors/index.js';

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'in'
  | 'notIn';

export const FILTER_OPERATORS: ReadonlySet<string> = new Set([
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'in',
  'notIn',
]);

export type FilterValueKind = 'string' | 'number' | 'boolean' | 'date';

export interface ParsedFilter {
  field: string;
  op: FilterOperator;
  kind: FilterValueKind;
  location: 'data' | 'entry';
  value: string | string[] | number | number[] | boolean;
}

export interface ParsedSort {
  field: string;
  kind: FilterValueKind;
  location: 'data' | 'entry';
  direction: 'asc' | 'desc';
}

export interface ParsedQuery {
  filters: ParsedFilter[];
  sort: ParsedSort[];
  limit: number;
  offset: number;
  fields: string[] | null;
  populate: string[];
  preview?: string;
  q?: string;
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const MAX_FILTERS = 20;
const MAX_SORT = 5;
const MAX_VALUE_LENGTH = 500;
const MAX_IN_VALUES = 50;

const ENTRY_FIELDS: Record<string, FilterValueKind> = {
  createdAt: 'date',
  updatedAt: 'date',
  slug: 'string',
};

function fieldKind(def: FieldDefinition): FilterValueKind {
  switch (def.type) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'date';
    default:
      return 'string';
  }
}

function coerce(value: string, kind: FilterValueKind, fieldName: string): string | number | boolean {
  if (value.length > MAX_VALUE_LENGTH) {
    throw new BadRequestError(`Value for '${fieldName}' exceeds max length (${MAX_VALUE_LENGTH})`);
  }
  if (kind === 'number') {
    const n = Number(value);
    if (Number.isNaN(n)) {
      throw new BadRequestError(`Value for '${fieldName}' must be numeric`);
    }
    return n;
  }
  if (kind === 'boolean') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new BadRequestError(`Value for '${fieldName}' must be boolean (true|false)`);
  }
  return value;
}

function parseWhereKey(key: string): { field: string; op: FilterOperator } | null {
  // where[field]=value → op=eq
  // where[field][op]=value
  const match = key.match(/^where\[([^\]]+)\](?:\[([^\]]+)\])?$/);
  if (!match) return null;
  const field = match[1];
  const opRaw = match[2] ?? 'eq';
  if (!FILTER_OPERATORS.has(opRaw)) {
    throw new BadRequestError(`Unknown filter operator '${opRaw}' on field '${field}'`);
  }
  return { field, op: opRaw as FilterOperator };
}

export interface ParseOptions {
  fields: FieldDefinition[];
  allowStatusFilter?: boolean;
}

export function parseContentQuery(
  raw: Record<string, string | string[] | undefined>,
  opts: ParseOptions
): ParsedQuery {
  const fieldMap = new Map<string, FieldDefinition>();
  for (const f of opts.fields) fieldMap.set(f.name, f);

  const filters: ParsedFilter[] = [];
  const sort: ParsedSort[] = [];
  let limit = DEFAULT_LIMIT;
  let offset = 0;
  let fields: string[] | null = null;
  let populate: string[] = [];
  let preview: string | undefined;
  let q: string | undefined;

  const entryCols: Record<string, FilterValueKind> = { ...ENTRY_FIELDS };
  if (opts.allowStatusFilter) entryCols.status = 'string';

  for (const [key, rawValue] of Object.entries(raw)) {
    if (rawValue === undefined) continue;
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value === undefined) continue;

    if (key === 'limit') {
      const n = parseInt(value, 10);
      if (Number.isNaN(n) || n < 1) throw new BadRequestError('limit must be a positive integer');
      limit = Math.min(n, MAX_LIMIT);
      continue;
    }
    if (key === 'offset') {
      const n = parseInt(value, 10);
      if (Number.isNaN(n) || n < 0) throw new BadRequestError('offset must be >= 0');
      offset = n;
      continue;
    }
    if (key === 'page') {
      // Backward compat: page → offset = (page-1)*limit, applied after limit is known.
      // We'll stash it; resolve after the loop so limit/page order doesn't matter.
      const n = parseInt(value, 10);
      if (Number.isNaN(n) || n < 1) throw new BadRequestError('page must be a positive integer');
      (raw as any).__page = n;
      continue;
    }
    if (key === 'sort') {
      const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length > MAX_SORT) {
        throw new BadRequestError(`Too many sort fields (max ${MAX_SORT})`);
      }
      for (const part of parts) {
        const direction = part.startsWith('-') ? 'desc' : 'asc';
        const name = part.replace(/^[-+]/, '');
        if (entryCols[name]) {
          sort.push({ field: name, kind: entryCols[name], location: 'entry', direction });
          continue;
        }
        const def = fieldMap.get(name);
        if (!def) {
          throw new BadRequestError(`Cannot sort by unknown field '${name}'`);
        }
        sort.push({ field: name, kind: fieldKind(def), location: 'data', direction });
      }
      continue;
    }
    if (key === 'fields') {
      const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
      for (const name of parts) {
        if (!fieldMap.has(name) && name !== 'slug') {
          throw new BadRequestError(`Cannot select unknown field '${name}'`);
        }
      }
      fields = parts;
      continue;
    }
    if (key === 'populate') {
      populate = value.split(',').map((s) => s.trim()).filter(Boolean);
      continue;
    }
    if (key === 'preview') {
      preview = value;
      continue;
    }
    if (key === 'q') {
      q = value.slice(0, MAX_VALUE_LENGTH);
      continue;
    }

    const parsed = parseWhereKey(key);
    if (!parsed) {
      // Ignore unknown keys silently to avoid breaking future callers.
      continue;
    }
    if (filters.length >= MAX_FILTERS) {
      throw new BadRequestError(`Too many filters (max ${MAX_FILTERS})`);
    }

    const { field, op } = parsed;
    let kind: FilterValueKind;
    let location: 'data' | 'entry';
    if (entryCols[field]) {
      kind = entryCols[field];
      location = 'entry';
    } else {
      const def = fieldMap.get(field);
      if (!def) {
        throw new BadRequestError(`Cannot filter by unknown field '${field}'`);
      }
      kind = fieldKind(def);
      location = 'data';
    }

    if (op === 'contains' && kind !== 'string') {
      throw new BadRequestError(`'contains' only works on string fields ('${field}')`);
    }

    if (op === 'in' || op === 'notIn') {
      const parts = value.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      if (parts.length === 0) {
        throw new BadRequestError(`'${op}' requires at least one value for '${field}'`);
      }
      if (parts.length > MAX_IN_VALUES) {
        throw new BadRequestError(`'${op}' exceeds max values (${MAX_IN_VALUES}) for '${field}'`);
      }
      if (kind === 'number') {
        const nums = parts.map((p) => {
          const n = Number(p);
          if (Number.isNaN(n)) throw new BadRequestError(`Non-numeric value in '${op}' for '${field}'`);
          return n;
        });
        filters.push({ field, op, kind, location, value: nums });
      } else {
        filters.push({ field, op, kind, location, value: parts });
      }
      continue;
    }

    const coerced = coerce(value, kind, field);
    filters.push({ field, op, kind, location, value: coerced });
  }

  // Resolve page → offset if page was provided
  const page = (raw as any).__page as number | undefined;
  if (page !== undefined) {
    offset = (page - 1) * limit;
  }

  return { filters, sort, limit, offset, fields, populate, preview, q };
}

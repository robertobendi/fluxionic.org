import { sql, SQL } from 'drizzle-orm';
import { entry } from '../../shared/database/schema.js';
import {
  FilterValueKind,
  ParsedFilter,
  ParsedSort,
} from './query.parser.js';

/**
 * Build a SQL expression that extracts a field value from either the entry
 * columns or the JSONB data blob, cast appropriately for comparison.
 */
function fieldExpression(filter: ParsedFilter | ParsedSort): SQL {
  if (filter.location === 'entry') {
    switch (filter.field) {
      case 'createdAt':
        return sql`${entry.createdAt}`;
      case 'updatedAt':
        return sql`${entry.updatedAt}`;
      case 'slug':
        return sql`${entry.slug}`;
      case 'status':
        return sql`${entry.status}`;
    }
  }

  const dataRef = sql`${entry.data}->>${filter.field}`;
  switch (filter.kind) {
    case 'number':
      return sql`(${dataRef})::numeric`;
    case 'boolean':
      return sql`(${dataRef})::boolean`;
    case 'date':
      return sql`(${dataRef})::timestamptz`;
    default:
      return dataRef;
  }
}

function valueLiteral(value: unknown, kind: FilterValueKind): SQL {
  if (kind === 'date' && typeof value === 'string') {
    return sql`${value}::timestamptz`;
  }
  return sql`${value as any}`;
}

export function buildFilterSql(filter: ParsedFilter): SQL {
  const expr = fieldExpression(filter);
  switch (filter.op) {
    case 'contains': {
      return sql`${expr} ILIKE ${'%' + String(filter.value) + '%'}`;
    }
    case 'in': {
      const values = filter.value as Array<string | number>;
      const literals = values.map((v) => valueLiteral(v, filter.kind));
      return sql`${expr} IN (${sql.join(literals, sql`, `)})`;
    }
    case 'notIn': {
      const values = filter.value as Array<string | number>;
      const literals = values.map((v) => valueLiteral(v, filter.kind));
      return sql`${expr} NOT IN (${sql.join(literals, sql`, `)})`;
    }
    case 'eq':
      return sql`${expr} = ${valueLiteral(filter.value, filter.kind)}`;
    case 'ne':
      return sql`${expr} <> ${valueLiteral(filter.value, filter.kind)}`;
    case 'gt':
      return sql`${expr} > ${valueLiteral(filter.value, filter.kind)}`;
    case 'gte':
      return sql`${expr} >= ${valueLiteral(filter.value, filter.kind)}`;
    case 'lt':
      return sql`${expr} < ${valueLiteral(filter.value, filter.kind)}`;
    case 'lte':
      return sql`${expr} <= ${valueLiteral(filter.value, filter.kind)}`;
    default:
      return sql`${expr} = ${valueLiteral(filter.value, filter.kind)}`;
  }
}

export function buildSortSql(s: ParsedSort): SQL {
  const expr = fieldExpression(s);
  return s.direction === 'desc' ? sql`${expr} DESC NULLS LAST` : sql`${expr} ASC NULLS LAST`;
}

export function projectFields(
  row: { slug: string; data: Record<string, unknown>; createdAt: string; updatedAt: string },
  fields: string[] | null
): { slug: string; data: Record<string, unknown>; createdAt: string; updatedAt: string } {
  if (!fields) return row;
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f in row.data) out[f] = row.data[f];
  }
  return { slug: row.slug, data: out, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

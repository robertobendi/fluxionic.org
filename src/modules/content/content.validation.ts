import { Type, TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { FieldDefinition } from "./content.types.js";

/**
 * Maps a single FieldDefinition to the appropriate TypeBox schema
 */
function mapFieldToTypeBox(field: FieldDefinition): TSchema {
  switch (field.type) {
    case "string": {
      const constraints: { minLength?: number; maxLength?: number } = {};
      if (field.minLength !== undefined) constraints.minLength = field.minLength;
      if (field.maxLength !== undefined) constraints.maxLength = field.maxLength;
      return Type.String(constraints);
    }

    case "text": {
      const constraints: { minLength?: number; maxLength?: number } = {};
      if (field.minLength !== undefined) constraints.minLength = field.minLength;
      if (field.maxLength !== undefined) constraints.maxLength = field.maxLength;
      return Type.String(constraints);
    }

    case "number": {
      const constraints: { minimum?: number; maximum?: number } = {};
      if (field.min !== undefined) constraints.minimum = field.min;
      if (field.max !== undefined) constraints.maximum = field.max;
      return Type.Number(constraints);
    }

    case "boolean":
      return Type.Boolean();

    case "date":
      return Type.String({ minLength: 1 });

    case "rich-text": {
      const constraints: { minLength?: number; maxLength?: number } = {};
      if (field.minLength !== undefined) constraints.minLength = field.minLength;
      if (field.maxLength !== undefined) constraints.maxLength = field.maxLength;
      return Type.String(constraints);
    }

    case "media":
      return Type.String();

    case "select": {
      if (field.options && field.options.length > 0) {
        return Type.Union(field.options.map((opt) => Type.Literal(opt)));
      }
      return Type.String();
    }

    case "multi-select": {
      if (field.options && field.options.length > 0) {
        return Type.Array(Type.Union(field.options.map((opt) => Type.Literal(opt))));
      }
      return Type.Array(Type.String());
    }

    case "slug":
      return Type.String({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" });

    case "reference":
      return Type.String({ minLength: 1 });

    case "multi-reference": {
      const constraints: { minItems?: number; maxItems?: number } = {};
      if (field.minItems !== undefined) constraints.minItems = field.minItems;
      if (field.maxItems !== undefined) constraints.maxItems = field.maxItems;
      return Type.Array(Type.String({ minLength: 1 }), constraints);
    }

    case "repeater": {
      const subSchema = buildSchemaFromFields(field.subFields ?? []);
      const constraints: { minItems?: number; maxItems?: number } = {};
      if (field.minItems !== undefined) constraints.minItems = field.minItems;
      if (field.maxItems !== undefined) constraints.maxItems = field.maxItems;
      return Type.Array(subSchema, constraints);
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = field.type;
      return Type.String();
    }
  }
}

/**
 * Builds a TypeBox schema from an array of FieldDefinitions
 */
export function buildSchemaFromFields(fields: FieldDefinition[]) {
  const properties: Record<string, TSchema> = {};

  for (const field of fields) {
    const schema = mapFieldToTypeBox(field);
    properties[field.name] = field.required ? schema : Type.Optional(schema);
  }

  return Type.Object(properties, { additionalProperties: false });
}

/**
 * Semantic validation of field definitions on collection create/update.
 * TypeBox validates the shape; this checks cross-field invariants.
 */
export function validateFieldDefinitions(
  fields: FieldDefinition[],
  { allowNested = true }: { allowNested?: boolean } = {}
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const names = new Set<string>();

  for (const field of fields) {
    if (names.has(field.name)) {
      errors.push(`${field.name}: duplicate field name`);
    }
    names.add(field.name);

    if (field.type === 'reference' || field.type === 'multi-reference') {
      if (!field.referenceCollection) {
        errors.push(`${field.name}: referenceCollection is required for ${field.type}`);
      }
      if (!allowNested) {
        errors.push(`${field.name}: ${field.type} not allowed inside a repeater`);
      }
    }

    if (field.type === 'repeater') {
      if (!field.subFields || field.subFields.length === 0) {
        errors.push(`${field.name}: repeater requires at least one subField`);
      } else {
        if (!allowNested) {
          errors.push(`${field.name}: repeater cannot be nested inside another repeater`);
        }
        const nested = validateFieldDefinitions(field.subFields, { allowNested: false });
        if (!nested.valid) errors.push(...nested.errors.map((e) => `${field.name}.${e}`));
        for (const sub of field.subFields) {
          if (sub.type === 'slug') {
            errors.push(`${field.name}.${sub.name}: slug fields are not allowed inside repeaters`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates entry data against field definitions
 */
export function validateEntryData(
  fields: FieldDefinition[],
  data: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const schema = buildSchemaFromFields(fields);
  const valid = Value.Check(schema, data);

  if (valid) {
    return { valid: true, errors: [] };
  }

  // Collect errors
  const errors: string[] = [];
  const validationErrors = [...Value.Errors(schema, data)];

  for (const error of validationErrors) {
    const field = error.path.substring(1); // Remove leading '/'
    errors.push(`${field}: ${error.message}`);
  }

  return { valid: false, errors };
}

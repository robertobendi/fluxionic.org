import { Type, TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { FieldDefinition, FieldType } from "./content.types.js";

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
      return Type.String({ format: "date-time" });

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

    default:
      // TypeScript exhaustiveness check - should never reach here
      const _exhaustive: never = field.type;
      return Type.String();
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

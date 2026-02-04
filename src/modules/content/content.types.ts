export type FieldType =
  | "string"       // single-line text
  | "text"         // multi-line text
  | "number"       // numeric value
  | "boolean"      // true/false
  | "date"         // ISO date string
  | "rich-text"    // markdown content
  | "media"        // reference to media file (future phase)
  | "select"       // single option from list
  | "multi-select" // multiple options from list
  | "slug";        // auto-generated URL-friendly string

export interface FieldDefinition {
  id: string;            // unique within collection (nanoid)
  name: string;          // field key in data object (camelCase)
  label: string;         // display label
  type: FieldType;
  required?: boolean;
  unique?: boolean;      // for slug type primarily
  minLength?: number;    // for string, text, rich-text
  maxLength?: number;    // for string, text, rich-text
  min?: number;          // for number type
  max?: number;          // for number type
  options?: string[];    // for select, multi-select
  generateFrom?: string; // for slug type - field name to generate from
}

export interface CollectionSchema {
  id: string;
  name: string;
  slug: string;
  fields: FieldDefinition[];
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  id: string;
  collectionId: string;
  slug: string;
  data: Record<string, unknown>;
  status: "draft" | "published";
  position: number;
  createdAt: string;
  updatedAt: string;
}

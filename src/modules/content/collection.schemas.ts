import { Type, Static } from "@sinclair/typebox";

// Field definition schema matching content.types.ts
export const FieldDefinitionSchema = Type.Object({
  id: Type.String(),
  name: Type.String({ minLength: 1 }),
  label: Type.String({ minLength: 1 }),
  type: Type.Union([
    Type.Literal("string"),
    Type.Literal("text"),
    Type.Literal("number"),
    Type.Literal("boolean"),
    Type.Literal("date"),
    Type.Literal("rich-text"),
    Type.Literal("media"),
    Type.Literal("select"),
    Type.Literal("multi-select"),
    Type.Literal("slug"),
  ]),
  required: Type.Optional(Type.Boolean()),
  unique: Type.Optional(Type.Boolean()),
  minLength: Type.Optional(Type.Number({ minimum: 0 })),
  maxLength: Type.Optional(Type.Number({ minimum: 1 })),
  min: Type.Optional(Type.Number()),
  max: Type.Optional(Type.Number()),
  options: Type.Optional(Type.Array(Type.String())),
  generateFrom: Type.Optional(Type.String()),
});

// Note: FieldDefinition type is defined in content.types.ts

// Create collection schema
export const CreateCollectionSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  slug: Type.String({
    minLength: 1,
    maxLength: 100,
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" // kebab-case validation
  }),
  fields: Type.Array(FieldDefinitionSchema, { minItems: 1 }),
});

export type CreateCollectionInput = Static<typeof CreateCollectionSchema>;

// Update collection schema (slug is immutable)
export const UpdateCollectionSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  fields: Type.Optional(Type.Array(FieldDefinitionSchema, { minItems: 1 })),
});

export type UpdateCollectionInput = Static<typeof UpdateCollectionSchema>;

// Collection response schema
export const CollectionResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
  fields: Type.Array(FieldDefinitionSchema),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export type CollectionResponse = Static<typeof CollectionResponseSchema>;

// Collection list response schema
export const CollectionListResponseSchema = Type.Array(CollectionResponseSchema);

export type CollectionListResponse = Static<typeof CollectionListResponseSchema>;

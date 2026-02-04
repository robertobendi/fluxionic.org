// Export types and validation
export * from "./content.types.js";
export * from "./content.validation.js";

// Export services
export * from "./collection.service.js";
export * from "./entry.service.js";
export * from "./slug.utils.js";

// Export schemas (excluding FieldDefinition from collection.schemas to avoid conflict)
export {
  CreateCollectionSchema,
  UpdateCollectionSchema,
  CollectionResponseSchema,
  CollectionListResponseSchema,
  type CreateCollectionInput,
  type UpdateCollectionInput,
  type CollectionResponse,
  type CollectionListResponse,
} from "./collection.schemas.js";

export * from "./entry.schemas.js";

// Export routes
export { entryRoutes } from "./entry.routes.js";
export { collectionRoutes } from "./collection.routes.js";
export { publicContentRoutes } from "./public.routes.js";

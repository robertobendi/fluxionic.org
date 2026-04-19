// Field definition matching backend schema
export type FieldType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'rich-text'
  | 'media'
  | 'select'
  | 'multi-select'
  | 'slug'
  | 'reference'
  | 'multi-reference'
  | 'repeater'

export interface FieldDefinition {
  id: string
  name: string
  label: string
  type: FieldType
  required?: boolean
  unique?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  options?: string[]
  generateFrom?: string
  referenceCollection?: string
  labelField?: string
  subFields?: FieldDefinition[]
  minItems?: number
  maxItems?: number
}

export interface CollectionPermissions {
  editor?: 'write' | 'read' | 'none'
  viewer?: 'read' | 'none'
}

export interface Collection {
  id: string
  name: string
  slug: string
  fields: FieldDefinition[]
  permissions?: CollectionPermissions | null
  isForm?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCollectionInput {
  name: string
  slug: string
  fields: FieldDefinition[]
  permissions?: CollectionPermissions
  isForm?: boolean
}

export interface UpdateCollectionInput {
  name?: string
  fields?: FieldDefinition[]
  permissions?: CollectionPermissions
  isForm?: boolean
}

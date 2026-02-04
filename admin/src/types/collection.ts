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
}

export interface Collection {
  id: string
  name: string
  slug: string
  fields: FieldDefinition[]
  createdAt: string
  updatedAt: string
}

export interface CreateCollectionInput {
  name: string
  slug: string
  fields: FieldDefinition[]
}

export interface UpdateCollectionInput {
  name?: string
  fields?: FieldDefinition[]
}

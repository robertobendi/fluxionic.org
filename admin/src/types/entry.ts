// Entry types matching backend schema
export interface Entry {
  id: string
  collectionId: string
  slug: string
  data: Record<string, unknown>
  status: 'draft' | 'published'
  position: number
  createdAt: string
  updatedAt: string
}

export interface CreateEntryInput {
  data: Record<string, unknown>
  status?: 'draft' | 'published'
}

export interface UpdateEntryInput {
  data?: Record<string, unknown>
  status?: 'draft' | 'published'
  position?: number
}

export interface PaginatedEntriesResponse {
  data: Entry[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'
import type {
  Entry,
  CreateEntryInput,
  UpdateEntryInput,
  PaginatedEntriesResponse,
} from '@/types/entry'

// Query keys - params only included when provided to enable prefix invalidation
const entryKeys = {
  all: ['entries'] as const,
  lists: () => [...entryKeys.all, 'list'] as const,
  list: (collectionId: string, params?: Record<string, unknown>) =>
    params
      ? ([...entryKeys.lists(), collectionId, params] as const)
      : ([...entryKeys.lists(), collectionId] as const),
  details: () => [...entryKeys.all, 'detail'] as const,
  detail: (collectionId: string, entryId: string) =>
    [...entryKeys.details(), collectionId, entryId] as const,
}

interface UseEntriesParams {
  q?: string
  status?: 'draft' | 'published' | 'all'
  page?: number
  limit?: number
}

// List entries in a collection
export function useEntries(collectionId: string, params?: UseEntriesParams) {
  const queryParams = new URLSearchParams()

  if (params?.q) {
    queryParams.append('q', params.q)
  }
  if (params?.status && params.status !== 'all') {
    queryParams.append('status', params.status)
  }
  if (params?.page) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString())
  }

  const queryString = queryParams.toString()
  const url = `/admin/collections/${collectionId}/entries${
    queryString ? `?${queryString}` : ''
  }`

  return useQuery({
    queryKey: entryKeys.list(collectionId, params as Record<string, unknown>),
    queryFn: () => fetcher<PaginatedEntriesResponse>(url),
    enabled: !!collectionId,
    throwOnError: true,
  })
}

// Get single entry
export function useEntry(collectionId: string, entryId: string) {
  return useQuery({
    queryKey: entryKeys.detail(collectionId, entryId),
    queryFn: () =>
      fetcher<Entry>(`/admin/collections/${collectionId}/entries/${entryId}`),
    enabled: !!collectionId && !!entryId,
    throwOnError: true,
  })
}

// Create entry
export function useCreateEntry(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEntryInput) =>
      fetcher<Entry>(`/admin/collections/${collectionId}/entries`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      // Only invalidate entries for this specific collection
      queryClient.invalidateQueries({ queryKey: entryKeys.list(collectionId) })
    },
  })
}

// Update entry
export function useUpdateEntry(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntryInput }) =>
      fetcher<Entry>(`/admin/collections/${collectionId}/entries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      // Only invalidate entries for this specific collection
      queryClient.invalidateQueries({ queryKey: entryKeys.list(collectionId) })
      queryClient.setQueryData(entryKeys.detail(collectionId, data.id), data)
    },
  })
}

// Delete entry
export function useDeleteEntry(collectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetcher<void>(`/admin/collections/${collectionId}/entries/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      // Only invalidate entries for this specific collection
      queryClient.invalidateQueries({ queryKey: entryKeys.list(collectionId) })
    },
  })
}

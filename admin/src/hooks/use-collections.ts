import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'
import type {
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '@/types/collection'

// Query keys
const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: () => [...collectionKeys.lists()] as const,
  details: () => [...collectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...collectionKeys.details(), id] as const,
}

// List all collections
export function useCollections() {
  return useQuery({
    queryKey: collectionKeys.list(),
    queryFn: () => fetcher<Collection[]>('/admin/collections'),
    throwOnError: true,
  })
}

// Get single collection
export function useCollection(id: string) {
  return useQuery({
    queryKey: collectionKeys.detail(id),
    queryFn: () => fetcher<Collection>(`/admin/collections/${id}`),
    enabled: !!id,
    throwOnError: true,
  })
}

// Create collection
export function useCreateCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCollectionInput) =>
      fetcher<Collection>('/admin/collections', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
    },
  })
}

// Update collection
export function useUpdateCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCollectionInput }) =>
      fetcher<Collection>(`/admin/collections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(data.id) })
    },
  })
}

// Delete collection
export function useDeleteCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetcher<void>(`/admin/collections/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.lists() })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'
import { toast } from 'sonner'
import type { MediaFile, MediaListResponse, ImageInfo, MediaType, CropData } from '@/types/media'

// Query key factory for media
const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...mediaKeys.lists(), params] as const,
  details: () => [...mediaKeys.all, 'detail'] as const,
  detail: (id: string) => [...mediaKeys.details(), id] as const,
  info: (id: string) => [...mediaKeys.detail(id), 'info'] as const,
  storage: () => [...mediaKeys.all, 'storage'] as const,
}

interface UseMediaParams {
  type?: MediaType
  search?: string
  page?: number
  limit?: number
}

export function useMedia(params: UseMediaParams = {}) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())
  if (params.type && params.type !== 'all') queryParams.append('type', params.type)
  if (params.search) queryParams.append('q', params.search)

  const queryString = queryParams.toString()

  return useQuery({
    queryKey: mediaKeys.list(params as Record<string, unknown>),
    queryFn: () => fetcher<MediaListResponse>(`/admin/media${queryString ? `?${queryString}` : ''}`),
    throwOnError: true,
  })
}

export function useSingleMedia(id: string) {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: () => fetcher<MediaFile>(`/admin/media/${id}`),
    enabled: !!id,
    throwOnError: true,
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (files: FileList | File[]) => {
      const formData = new FormData()

      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate lists and storage stats (new file affects both)
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: mediaKeys.storage() })
      toast.success('File(s) uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Upload failed')
    },
  })
}

export function useUpdateMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, altText }: { id: string; altText?: string }) => {
      return fetcher<MediaFile>(`/admin/media/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ altText }),
      })
    },
    onSuccess: (data) => {
      // Update cache directly for single item, invalidate lists
      queryClient.setQueryData(mediaKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() })
      toast.success('Media updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Update failed')
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }
    },
    onSuccess: () => {
      // Invalidate lists and storage stats (deleted file affects both)
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: mediaKeys.storage() })
      toast.success('Media deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Delete failed')
    },
  })
}

export function useImageInfo(id: string) {
  return useQuery({
    queryKey: mediaKeys.info(id),
    queryFn: () => fetcher<ImageInfo>(`/admin/media/${id}/info`),
    enabled: !!id,
  })
}

export function useCropImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, crop }: { id: string; crop: CropData }) => {
      return fetcher<MediaFile>(`/admin/media/${id}/crop`, {
        method: 'POST',
        body: JSON.stringify(crop),
      })
    },
    onSuccess: () => {
      // Cropping creates a new file, invalidate lists and storage
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() })
      queryClient.invalidateQueries({ queryKey: mediaKeys.storage() })
      toast.success('Image cropped successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Crop failed')
    },
  })
}

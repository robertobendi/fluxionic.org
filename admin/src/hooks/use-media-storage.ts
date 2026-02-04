import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'

interface StorageStats {
  total: number
  breakdown: {
    images: number
    videos: number
    documents: number
    audio: number
  }
}

// Must match mediaKeys.storage() from use-media.ts for proper invalidation
const STORAGE_KEY = ['media', 'storage'] as const

export function useMediaStorage() {
  return useQuery({
    queryKey: STORAGE_KEY,
    queryFn: () => fetcher<StorageStats>('/admin/media/storage'),
    staleTime: 5 * 60 * 1000, // 5 minutes - storage changes infrequently
  })
}

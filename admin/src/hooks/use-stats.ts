import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'

interface Stats {
  collections: number
  entries: number
  media: number
  users: number
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface EntryStats {
  total: number
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const [collections, media, users, entryStats] = await Promise.all([
        fetcher<Array<{ id: string }>>('/admin/collections'),
        fetcher<PaginatedResponse<{ id: string }>>('/admin/media'),
        fetcher<Array<{ id: string }>>('/admin/users'),
        fetcher<EntryStats>('/admin/entries/stats'),
      ])

      const stats: Stats = {
        collections: collections.length,
        entries: entryStats.total,
        media: media.meta.total,
        users: users.length,
      }

      return stats
    },
    throwOnError: true,
  })
}

import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'
import { useSession } from '@/lib/auth'

interface Stats {
  collections: number
  entries: number
  media?: number
  users?: number
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
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const isAdmin = role === 'admin'
  const canUseEditorFeatures = role === 'admin' || role === 'editor'

  return useQuery({
    queryKey: ['stats', { isAdmin, canUseEditorFeatures }],
    queryFn: async () => {
      // /admin/users is admin-only; /admin/media is editor-only — skip each
      // when the current session can't reach it so viewers land on a clean
      // dashboard instead of an error boundary.
      const [collections, media, entryStats, users] = await Promise.all([
        fetcher<Array<{ id: string }>>('/admin/collections'),
        canUseEditorFeatures
          ? fetcher<PaginatedResponse<{ id: string }>>('/admin/media')
          : Promise.resolve(null),
        fetcher<EntryStats>('/admin/entries/stats'),
        isAdmin ? fetcher<Array<{ id: string }>>('/admin/users') : Promise.resolve(null),
      ])

      const stats: Stats = {
        collections: collections.length,
        entries: entryStats.total,
        media: media ? media.meta.total : undefined,
        users: users ? users.length : undefined,
      }

      return stats
    },
    throwOnError: true,
  })
}

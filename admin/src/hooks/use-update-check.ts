import { useQuery, queryOptions } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'

export interface UpdateCheckResult {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  versionDiff: 'major' | 'minor' | 'patch' | null
  releaseUrl: string
  publishedAt: string
}

export const updateCheckQueryOptions = queryOptions({
  queryKey: ['admin', 'update', 'check'] as const,
  queryFn: () => fetcher<UpdateCheckResult>('/admin/update/check'),
  staleTime: 5 * 60 * 1000, // 5 minutes - GitHub rate limit protection
  retry: 1,
  refetchOnWindowFocus: false, // Prevent GitHub API spam
})

export function useUpdateCheck() {
  return useQuery(updateCheckQueryOptions)
}

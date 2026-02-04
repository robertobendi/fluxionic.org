import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'

interface SystemInfo {
  version: string
  database: string
  nodeVersion: string
  uptime: number
}

export function useSystemInfo() {
  return useQuery({
    queryKey: ['admin', 'system-info'],
    queryFn: () => fetcher<SystemInfo>('/admin/system-info'),
  })
}

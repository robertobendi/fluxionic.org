import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'

interface MetricsSummary {
  total: number
  today: number
  last7Days: number
  trend: number[]
}

interface TopPage {
  path: string
  views: number
}

interface TopPagesResponse {
  data: TopPage[]
}

interface TrendDataPoint {
  date: string
  views: number
}

interface TrendResponse {
  data: TrendDataPoint[]
}

export function useMetricsSummary() {
  return useQuery({
    queryKey: ['metrics', 'summary'],
    queryFn: () => fetcher<MetricsSummary>('/admin/metrics/summary'),
    throwOnError: true,
  })
}

interface UseTopPagesOptions {
  days?: number
  limit?: number
}

export function useTopPages(options: UseTopPagesOptions = {}) {
  const { days = 7, limit = 20 } = options

  return useQuery({
    queryKey: ['metrics', 'top-pages', days, limit],
    queryFn: () => fetcher<TopPagesResponse>(`/admin/metrics/top-pages?days=${days}&limit=${limit}`),
    throwOnError: true,
  })
}

interface UseMetricsTrendOptions {
  days?: number
}

export function useMetricsTrend(options: UseMetricsTrendOptions = {}) {
  const { days = 7 } = options

  return useQuery({
    queryKey: ['metrics', 'trend', days],
    queryFn: () => fetcher<TrendResponse>(`/admin/metrics/trend?days=${days}`),
    throwOnError: true,
  })
}

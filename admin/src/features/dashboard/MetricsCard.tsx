import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMetricsSummary } from '@/hooks/use-metrics'

export function MetricsCard() {
  const { data: metrics, isLoading } = useMetricsSummary()

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pageviews</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return null
  }

  const hasData = metrics.total > 0
  const maxTrendValue = Math.max(...metrics.trend, 1)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pageviews</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <div className="text-2xl font-bold">{metrics.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Today: {metrics.today.toLocaleString()} | 7 days: {metrics.last7Days.toLocaleString()}
            </p>

            {/* 7-day trend visualization */}
            <div className="mt-4 flex items-end justify-between gap-1 h-12">
              {metrics.trend.map((value, index) => {
                const height = maxTrendValue > 0 ? (value / maxTrendValue) * 100 : 0
                return (
                  <div
                    key={index}
                    className="flex-1 bg-primary rounded-sm transition-all"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`Day ${index + 1}: ${value} views`}
                  />
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            No pageviews yet
          </div>
        )}
      </CardContent>
    </Card>
  )
}

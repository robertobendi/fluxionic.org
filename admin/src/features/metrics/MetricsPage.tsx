import { useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/components/ui/table'
import { useMetricsSummary, useTopPages, useMetricsTrend } from '@/hooks/use-metrics'
import { TrendingUp, BarChart3, Calendar, Activity } from 'lucide-react'
import { PageviewsChart } from './PageviewsChart'
import { TopPagesChart } from './TopPagesChart'
import { DateRangeSelector } from './DateRangeSelector'
import { MetricsCard } from './MetricsCard'
import { MetricsCardSkeleton, TableSkeleton } from './MetricsSkeleton'
import { EmptyState } from './EmptyState'

export function MetricsPage() {
  const [days, setDays] = useState(7)
  const { data: summary, isLoading: summaryLoading } = useMetricsSummary()
  const { data: topPages, isLoading: topPagesLoading } = useTopPages({ days, limit: 20 })
  const { data: trendData, isLoading: trendLoading } = useMetricsTrend({ days })

  // Calculate trend values for comparison
  // Using trend data: compare first half vs second half of the period
  const calculatePreviousValue = (trendArray: number[] | undefined) => {
    if (!trendArray || trendArray.length < 2) return undefined
    const midpoint = Math.floor(trendArray.length / 2)
    const olderSum = trendArray.slice(midpoint).reduce((a, b) => a + b, 0)
    return olderSum > 0 ? olderSum : undefined
  }

  // Card configurations
  const cards = [
    {
      title: 'Total',
      value: summary?.total ?? 0,
      subtitle: 'All time views',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      title: 'Today',
      value: summary?.today ?? 0,
      subtitle: 'Views today',
      icon: <Activity className="h-4 w-4" />,
    },
    {
      title: 'Last 7 Days',
      value: summary?.last7Days ?? 0,
      subtitle: 'Views in last 7 days',
      icon: <TrendingUp className="h-4 w-4" />,
      previousValue: calculatePreviousValue(summary?.trend),
    },
    {
      title: 'Last 30 Days',
      value: summary?.trend.reduce((sum, val) => sum + val, 0) ?? 0,
      subtitle: 'Approximate from trend',
      icon: <Calendar className="h-4 w-4" />,
    },
  ]

  return (
    <Shell title="Metrics">
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Analytics</h1>
            <p className="mt-1 md:mt-2 text-sm md:text-base text-muted-foreground">
              Pageview statistics for your content
            </p>
          </div>
          <DateRangeSelector value={days} onChange={setDays} />
        </div>

        {/* Summary Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryLoading ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <MetricsCardSkeleton
                  key={i}
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </>
          ) : (
            cards.map((card, index) => (
              <MetricsCard
                key={card.title}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                icon={card.icon}
                previousValue={card.previousValue}
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))
          )}
        </div>

        {/* Pageviews Trend Chart */}
        <div
          className="mt-6 md:mt-8 opacity-0 animate-slide-up"
          style={{ animationDelay: '120ms', animationFillMode: 'forwards' }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Pageviews Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {!trendLoading && (!trendData?.data || trendData.data.length === 0) ? (
                <EmptyState
                  title="No trend data yet"
                  description="Pageview trends will appear here once you have visitor data."
                />
              ) : (
                <PageviewsChart
                  data={trendData?.data ?? []}
                  isLoading={trendLoading}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Pages Section */}
        <div
          className="mt-6 md:mt-8 opacity-0 animate-slide-up"
          style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chart visualization */}
              <div className="mb-6">
                {!topPagesLoading && (!topPages?.data || topPages.data.length === 0) ? (
                  <EmptyState
                    title="No page data yet"
                    description="Top pages will appear here once visitors access your content."
                  />
                ) : (
                  <TopPagesChart
                    data={topPages?.data ?? []}
                    isLoading={topPagesLoading}
                  />
                )}
              </div>

              {/* Detailed table */}
              {topPagesLoading ? (
                <TableSkeleton rows={5} />
              ) : topPages?.data && topPages.data.length > 0 ? (
                <>
                  {/* Desktop table view */}
                  <div className="hidden md:block rounded-md border">
                    <Table>
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-16">
                            Rank
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            Path
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-32">
                            Views
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPages.data.map((page, index) => (
                          <tr key={page.path} className="border-b">
                            <td className="p-4 align-middle font-medium">#{index + 1}</td>
                            <td className="p-4 align-middle">
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {page.path}
                              </code>
                            </td>
                            <td className="p-4 align-middle text-right font-medium">
                              {page.views.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  {/* Mobile card view */}
                  <div className="md:hidden space-y-3">
                    {topPages.data.map((page, index) => (
                      <div key={page.path} className="flex items-center justify-between p-3 rounded-[2px] border bg-card">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm font-medium text-muted-foreground shrink-0">#{index + 1}</span>
                          <code className="text-sm bg-muted px-2 py-1 rounded truncate">{page.path}</code>
                        </div>
                        <span className="font-medium shrink-0 ml-2">{page.views.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  )
}

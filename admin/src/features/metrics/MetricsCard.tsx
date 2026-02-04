import type { ReactNode, CSSProperties } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricsCardProps {
  title: string
  value: number
  subtitle: string
  icon: ReactNode
  previousValue?: number
  isLoading?: boolean
  className?: string
  style?: CSSProperties
}

export function MetricsCard({
  title,
  value,
  subtitle,
  icon,
  previousValue,
  isLoading,
  className,
  style,
}: MetricsCardProps) {
  // Calculate trend if previousValue provided
  let percentChange: number | null = null
  let trendDirection: 'up' | 'down' | 'neutral' = 'neutral'

  if (previousValue !== undefined && previousValue > 0) {
    percentChange = ((value - previousValue) / previousValue) * 100
    if (Math.abs(percentChange) >= 1) {
      trendDirection = percentChange > 0 ? 'up' : 'down'
    }
  }

  return (
    <Card
      className={cn('opacity-0 animate-slide-up', className)}
      style={{ animationFillMode: 'forwards', ...style }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-28 animate-pulse rounded bg-muted" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            {trendDirection !== 'neutral' && percentChange !== null && (
              <div
                className={cn(
                  'flex items-center gap-1 mt-2 text-xs font-medium',
                  trendDirection === 'up' ? 'text-green-500' : 'text-red-500'
                )}
              >
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {trendDirection === 'up' ? '+' : ''}
                  {percentChange.toFixed(1)}%
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

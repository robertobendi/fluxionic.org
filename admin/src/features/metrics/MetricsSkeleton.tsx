import type { CSSProperties } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricsCardSkeletonProps {
  className?: string
  style?: CSSProperties
}

export function MetricsCardSkeleton({ className, style }: MetricsCardSkeletonProps) {
  return (
    <Card
      className={cn('opacity-0 animate-slide-up', className)}
      style={{ animationFillMode: 'forwards', ...style }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-28 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  )
}

interface ChartSkeletonProps {
  height?: number
  className?: string
}

export function ChartSkeleton({ height = 300, className }: ChartSkeletonProps) {
  return (
    <div
      className={cn('w-full animate-pulse rounded bg-muted', className)}
      style={{ height }}
    />
  )
}

interface TableSkeletonProps {
  rows?: number
  className?: string
}

export function TableSkeleton({ rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header row */}
      <div className="flex items-center gap-4 rounded bg-muted/50 p-4">
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded border p-4">
          <div className="h-4 w-8 animate-pulse rounded bg-muted" />
          <div className="h-4 flex-1 animate-pulse rounded bg-muted max-w-[70%]" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

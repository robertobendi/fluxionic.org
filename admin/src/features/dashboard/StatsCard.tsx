import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  isLoading?: boolean
  className?: string
  style?: CSSProperties
}

export function StatsCard({ title, value, icon: Icon, isLoading, className, style }: StatsCardProps) {
  return (
    <Card className={cn("p-6", className)} style={style}>
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <div className="mt-1 h-8 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-3xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </Card>
  )
}

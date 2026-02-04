import type { ReactNode } from 'react'
import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('py-12 text-center', className)}>
      <div className="mx-auto h-12 w-12 text-muted-foreground">
        {icon ?? <BarChart3 className="h-12 w-12" />}
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

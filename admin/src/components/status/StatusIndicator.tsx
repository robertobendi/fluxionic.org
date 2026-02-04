import { CircleCheck, CircleX, AlertCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'online' | 'offline' | 'degraded'

interface StatusIndicatorProps {
  status: Status
  label: string
  icon?: LucideIcon
  className?: string
}

const statusConfig: Record<Status, {
  Icon: LucideIcon
  colorClass: string
  bgClass: string
  text: string
}> = {
  online: {
    Icon: CircleCheck,
    colorClass: 'text-green-500',
    bgClass: 'bg-green-500/10',
    text: 'Online'
  },
  offline: {
    Icon: CircleX,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10',
    text: 'Offline'
  },
  degraded: {
    Icon: AlertCircle,
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10',
    text: 'Degraded'
  }
}

export function StatusIndicator({
  status,
  label,
  icon,
  className
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const Icon = icon || config.Icon

  return (
    <div
      role="status"
      aria-label={`${label}: ${config.text}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded',
        config.bgClass,
        className
      )}
    >
      <Icon
        className={cn('h-3.5 w-3.5', config.colorClass)}
        aria-hidden="true"
      />
      <span className={cn('text-xs font-medium', config.colorClass)}>
        {config.text}
      </span>
    </div>
  )
}

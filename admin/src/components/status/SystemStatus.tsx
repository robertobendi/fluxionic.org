import { useHealth } from '@/hooks/use-health'
import { StatusIndicator } from './StatusIndicator'
import { Database, HardDrive } from 'lucide-react'

interface SystemStatusProps {
  polling?: boolean  // Pass to useHealth
}

export function SystemStatus({ polling = true }: SystemStatusProps) {
  const { data: health, isLoading } = useHealth({ polling })

  // Don't render anything while loading initial fetch
  if (isLoading || !health) {
    return null
  }

  // Map health response to status indicator props
  const dbStatus = health.database === 'connected' ? 'online' : 'offline'
  const mediaStatus = health.media === 'writable' ? 'online' : 'offline'

  return (
    <div className="flex items-center gap-2">
      <StatusIndicator
        status={dbStatus}
        label="DB"
        icon={Database}
      />
      <StatusIndicator
        status={mediaStatus}
        label="Media"
        icon={HardDrive}
      />
    </div>
  )
}

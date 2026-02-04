import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHealth } from '@/hooks/use-health'
import { Database, HardDrive, MemoryStick, Clock } from 'lucide-react'
import { formatMemory, formatUptime } from '@/lib/formatters'

interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'writable' | 'unavailable' | 'ok' | 'warning'
}

function StatusIndicator({ status }: StatusIndicatorProps) {
  const color =
    status === 'connected' || status === 'writable' || status === 'ok'
      ? 'bg-green-500'
      : status === 'warning'
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return <span className={`h-2 w-2 rounded-full ${color}`} />
}

export function HealthDashboard() {
  const { data: health, isLoading } = useHealth({ polling: true })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!health) {
    return null
  }

  const heapPercent = health.memory.heapPercent
  const memoryStatus = heapPercent > 90 ? 'warning' : 'ok'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <StatusIndicator status={health.database} />
            <div className="text-2xl font-bold capitalize">{health.database}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">PostgreSQL connection</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Media Storage</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <StatusIndicator status={health.media} />
            <div className="text-2xl font-bold capitalize">{health.media}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Upload directory status</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory</CardTitle>
          <MemoryStick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <StatusIndicator status={memoryStatus} />
            <div className="text-2xl font-bold">{heapPercent.toFixed(0)}%</div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatMemory(health.memory.heapUsed)} / {formatMemory(health.memory.heapTotal)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatUptime(health.uptime)}</div>
          <p className="text-xs text-muted-foreground mt-1">Node.js {health.nodeVersion}</p>
        </CardContent>
      </Card>
    </div>
  )
}

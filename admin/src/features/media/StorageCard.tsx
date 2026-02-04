import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useMediaStorage } from '@/hooks/use-media-storage'
import { formatBytes } from '@/lib/formatters'
import { Image, Video, FileText, Music, HardDrive } from 'lucide-react'

const categories = [
  { key: 'images', icon: Image, label: 'Images', color: 'text-blue-500' },
  { key: 'videos', icon: Video, label: 'Videos', color: 'text-purple-500' },
  { key: 'documents', icon: FileText, label: 'Documents', color: 'text-orange-500' },
  { key: 'audio', icon: Music, label: 'Audio', color: 'text-green-500' },
] as const

export function StorageCard() {
  const { data, isLoading } = useMediaStorage()

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-6 w-20 bg-muted rounded" />
            </div>
          </div>
          <div className="h-2 w-full bg-muted rounded-full" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-primary/10 p-2">
          <HardDrive className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
          <p className="text-2xl font-bold">{formatBytes(data.total)}</p>
        </div>
      </div>

      {/* Progress bar - visual indicator (100% filled as absolute usage display) */}
      <Progress
        value={100}
        className="h-2 mb-4"
        aria-label={`Total storage used: ${formatBytes(data.total)}`}
      />

      {/* Breakdown by type */}
      <div className="space-y-2">
        {categories.map(({ key, icon: Icon, label, color }) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
              <span>{label}</span>
            </div>
            <span className="text-muted-foreground">
              {formatBytes(data.breakdown[key])}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

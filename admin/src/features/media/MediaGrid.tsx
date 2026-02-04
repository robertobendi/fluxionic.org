import type { MediaFile } from '@/types/media'
import { MediaCard } from './MediaCard'

interface MediaGridProps {
  files: MediaFile[]
  onEdit: (file: MediaFile) => void
  onDelete: (file: MediaFile) => void
  onCrop?: (file: MediaFile) => void
  onSelect?: (file: MediaFile) => void
  selectedId?: string
}

export function MediaGrid({ files, onEdit, onDelete, onCrop, onSelect, selectedId }: MediaGridProps) {
  if (files.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">No media files found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file, index) => (
        <MediaCard
          key={file.id}
          media={file}
          onEdit={() => onEdit(file)}
          onDelete={() => onDelete(file)}
          onCrop={onCrop ? () => onCrop(file) : undefined}
          onSelect={onSelect ? () => onSelect(file) : undefined}
          selected={selectedId === file.id}
          className="animate-slide-up opacity-0"
          style={{ animationDelay: `${300 + index * 80}ms` }}
        />
      ))}
    </div>
  )
}

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreVertical, FileText, Film, Music, File, Scissors, Edit, Trash2 } from 'lucide-react'
import type { MediaFile } from '@/types/media'
import { useState } from 'react'
import { cn } from '@/lib/utils'

import type { CSSProperties } from 'react'

interface MediaCardProps {
  media: MediaFile
  onEdit: () => void
  onDelete: () => void
  onCrop?: () => void
  onSelect?: () => void
  selected?: boolean
  className?: string
  style?: CSSProperties
}

export function MediaCard({ media, onEdit, onDelete, onCrop, onSelect, selected, className, style }: MediaCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isImage = media.mimeType.startsWith('image/')

  const handleClick = () => {
    if (onSelect) {
      onSelect()
    } else {
      onEdit()
    }
  }

  const getFileIcon = () => {
    if (media.mimeType.startsWith('video/')) return <Film className="h-12 w-12 text-muted-foreground" />
    if (media.mimeType.startsWith('audio/')) return <Music className="h-12 w-12 text-muted-foreground" />
    if (media.mimeType.includes('pdf') || media.mimeType.includes('document')) return <FileText className="h-12 w-12 text-muted-foreground" />
    return <File className="h-12 w-12 text-muted-foreground" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden cursor-pointer transition-all hover:border-2 hover:border-foreground',
        selected && 'ring-2 ring-primary',
        className
      )}
      style={style}
      onClick={handleClick}
    >
      <div className="aspect-square flex items-center justify-center bg-muted relative">
        {isImage && media.thumbnailUrl ? (
          <img
            src={media.thumbnailUrl}
            alt={media.altText || media.originalName}
            className="h-full w-full object-cover"
          />
        ) : (
          getFileIcon()
        )}

        {selected && (
          <div className="absolute top-2 left-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs">✓</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-medium truncate" title={media.originalName}>
          {media.originalName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(media.size)}
        </p>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            aria-label={`Actions for ${media.originalName}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                }}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-[2px] border-2 border-foreground bg-background">
                <div className="p-1">
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onEdit()
                    }}
                    aria-label={`Edit ${media.originalName}`}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  {isImage && onCrop && (
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(false)
                        onCrop()
                      }}
                      aria-label={`Crop ${media.originalName}`}
                    >
                      <Scissors className="h-4 w-4" />
                      Crop
                    </button>
                  )}
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onDelete()
                    }}
                    aria-label={`Delete ${media.originalName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Film, Music, File, Scissors } from 'lucide-react'
import { useUpdateMedia } from '@/hooks/use-media'
import type { MediaFile } from '@/types/media'
import { formatDate, formatBytes } from '@/lib/formatters'

interface MediaDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  media: MediaFile | null
  onDelete: () => void
  onCrop?: () => void
}

export function MediaDetailDialog({ open, onOpenChange, media, onDelete, onCrop }: MediaDetailDialogProps) {
  const [altText, setAltText] = useState(media?.altText || '')
  const updateMutation = useUpdateMedia()

  // Sync altText when media changes
  useEffect(() => {
    if (media) {
      setAltText(media.altText || '')
    }
  }, [media])

  if (!media) return null

  const isImage = media.mimeType.startsWith('image/')

  const getFileIcon = () => {
    if (media.mimeType.startsWith('video/')) return <Film className="h-24 w-24 text-muted-foreground" />
    if (media.mimeType.startsWith('audio/')) return <Music className="h-24 w-24 text-muted-foreground" />
    if (media.mimeType.includes('pdf') || media.mimeType.includes('document')) return <FileText className="h-24 w-24 text-muted-foreground" />
    return <File className="h-24 w-24 text-muted-foreground" />
  }

  const handleSave = () => {
    updateMutation.mutate(
      { id: media.id, altText },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Media Details</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <div className="space-y-6">
          {/* Preview */}
          <div className="flex items-center justify-center bg-muted rounded-lg p-8">
            {isImage ? (
              <img
                src={media.url}
                alt={media.altText || media.originalName}
                className="max-h-96 max-w-full object-contain"
              />
            ) : (
              getFileIcon()
            )}
          </div>

          {/* File Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Filename</p>
              <p className="mt-1">{media.filename}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Original Name</p>
              <p className="mt-1">{media.originalName}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">File Size</p>
              <p className="mt-1">{formatBytes(media.size)}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Type</p>
              <p className="mt-1">{media.mimeType}</p>
            </div>
            {media.width && media.height && (
              <div>
                <p className="font-medium text-muted-foreground">Dimensions</p>
                <p className="mt-1">{media.width} × {media.height}</p>
              </div>
            )}
            <div>
              <p className="font-medium text-muted-foreground">Uploaded</p>
              <p className="mt-1">{formatDate(media.createdAt, 'datetime')}</p>
            </div>
          </div>

          {/* Alt Text (for images) */}
          {isImage && (
            <div className="space-y-2">
              <Label htmlFor="altText">Alt Text</Label>
              <Input
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe this image..."
              />
            </div>
          )}
        </div>
      </DialogContent>

      <DialogFooter>
        <div className="flex w-full justify-between">
          <div className="flex gap-2">
            {isImage && onCrop && (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  onCrop()
                }}
              >
                <Scissors className="h-4 w-4 mr-2" />
                Crop
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => {
                onOpenChange(false)
                onDelete()
              }}
            >
              Delete
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </Dialog>
  )
}

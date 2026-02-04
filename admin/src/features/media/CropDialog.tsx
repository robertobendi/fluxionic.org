import { useState, useRef } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useCropImage, useImageInfo } from '@/hooks/use-media'
import type { MediaFile } from '@/types/media'

interface CropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  media: MediaFile | null
}

export function CropDialog({ open, onOpenChange, media }: CropDialogProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  })
  const imgRef = useRef<HTMLImageElement>(null)
  const cropMutation = useCropImage()
  const { data: imageInfo } = useImageInfo(media?.id || '')

  if (!media) return null

  const handleSave = () => {
    if (!crop.width || !crop.height) {
      return
    }

    cropMutation.mutate(
      {
        id: media.id,
        crop: {
          left: Math.round(crop.x),
          top: Math.round(crop.y),
          width: Math.round(crop.width),
          height: Math.round(crop.height),
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    // Set initial crop to center 50% of image
    setCrop({
      unit: 'px',
      x: width * 0.25,
      y: height * 0.25,
      width: width * 0.5,
      height: height * 0.5,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Crop Image</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <div className="space-y-4">
          {imageInfo && (
            <p className="text-sm text-muted-foreground">
              Original size: {imageInfo.width} × {imageInfo.height}
            </p>
          )}

          <div className="max-h-[60vh] overflow-auto flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
            >
              <img
                ref={imgRef}
                src={media.url}
                alt={media.altText || media.originalName}
                onLoad={handleImageLoad}
                className="max-w-full"
              />
            </ReactCrop>
          </div>

          {crop.width && crop.height && (
            <p className="text-sm text-muted-foreground">
              Selected area: {Math.round(crop.width)} × {Math.round(crop.height)}
            </p>
          )}
        </div>
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={cropMutation.isPending || !crop.width || !crop.height}
        >
          {cropMutation.isPending ? 'Cropping...' : 'Save Crop'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

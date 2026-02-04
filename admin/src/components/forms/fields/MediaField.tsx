import { useState } from 'react'
import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { FieldDefinition } from '@/types/collection'
import { MediaPickerDialog } from '@/features/media/MediaPickerDialog'
import type { MediaFile } from '@/types/media'
import { Image, X, Loader2, AlertCircle } from 'lucide-react'
import { fetcher } from '@/lib/api'

interface MediaFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

export function MediaField({ field, control, error }: MediaFieldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      <Controller
        name={field.name}
        control={control}
        rules={{
          required: field.required ? `${field.label} is required` : false,
        }}
        render={({ field: controllerField }) => {
          const mediaId = controllerField.value

          // Fetch media data when we have a mediaId
          const { data: media, isLoading } = useQuery({
            queryKey: ['media', mediaId],
            queryFn: () => fetcher<MediaFile>(`/admin/media/${mediaId}`),
            enabled: !!mediaId,
          })

          return (
            <>
              <div className="space-y-2">
                {mediaId ? (
                  <div className="relative inline-block">
                    {isLoading ? (
                      <div className="flex h-32 w-32 items-center justify-center rounded-md border border-input bg-muted">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : media ? (
                      <img
                        src={media.url}
                        alt={media.altText || 'Selected media'}
                        className="h-32 w-32 rounded-md border border-input object-cover"
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-md border border-input bg-muted">
                        <span className="text-sm text-muted-foreground">Not found</span>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onClick={() => controllerField.onChange(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPickerOpen(true)}
                    className="h-32 w-32"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Image className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm">Select Image</span>
                    </div>
                  </Button>
                )}

                {mediaId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPickerOpen(true)}
                  >
                    Change Image
                  </Button>
                )}
              </div>

              <MediaPickerDialog
                open={isPickerOpen}
                onOpenChange={setIsPickerOpen}
                onSelect={(media: MediaFile) => {
                  controllerField.onChange(media.id)
                }}
                selectedId={mediaId}
              />
            </>
          )
        }}
      />
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5 mt-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

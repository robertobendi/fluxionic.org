import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUploadMedia } from '@/hooks/use-media'
import { Progress } from '@/components/ui/progress'
import type { MediaFile } from '@/types/media'

interface UploadZoneProps {
  onUploadSuccess?: (files: MediaFile[]) => void
  accept?: string
}

export function UploadZone({ onUploadSuccess, accept }: UploadZoneProps = {}) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFileName, setUploadingFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadMedia()

  const startUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const fileNames = fileArray.map(f => f.name).join(', ')
    setUploadingFileName(fileNames)
    uploadMutation.mutate(files, {
      onSuccess: (data: { files: MediaFile[] }) => {
        onUploadSuccess?.(data.files)
      },
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      startUpload(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      startUpload(files)
      // Reset input so the same file can be selected again
      e.target.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-colors cursor-pointer',
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
        uploadMutation.isPending && 'pointer-events-none opacity-50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex flex-col items-center justify-center py-12 px-6">
        {uploadMutation.isPending ? (
          <div className="w-full max-w-md space-y-4">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-sm font-medium text-center mb-2">Uploading...</p>
              {uploadingFileName && (
                <p className="text-xs text-muted-foreground text-center mb-4">
                  {uploadingFileName}
                </p>
              )}
            </div>
            <Progress value={100} className="h-2" />
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Supports images, documents, videos, and audio files
            </p>
          </>
        )}
      </div>
    </div>
  )
}

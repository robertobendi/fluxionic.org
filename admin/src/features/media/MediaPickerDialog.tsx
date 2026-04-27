import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MediaGrid } from './MediaGrid'
import { UploadZone } from './UploadZone'
import { useMedia } from '@/hooks/use-media'
import type { MediaFile, MediaType } from '@/types/media'

type PickerTab = 'browse' | 'upload'

interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: MediaFile) => void
  selectedId?: string
  accept?: string
}

export function MediaPickerDialog({ open, onOpenChange, onSelect, selectedId, accept }: MediaPickerDialogProps) {
  const [tab, setTab] = useState<PickerTab>('browse')
  const [type, setType] = useState<MediaType>('image')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [tempSelectedId, setTempSelectedId] = useState<string | undefined>(selectedId)
  const [tempSelectedMedia, setTempSelectedMedia] = useState<MediaFile | null>(null)

  const limit = 12

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset selection and tab when dialog opens
  useEffect(() => {
    if (open) {
      setTab('browse')
      setTempSelectedId(selectedId)
      setTempSelectedMedia(null)
    }
  }, [open, selectedId])

  const { data, isLoading } = useMedia({
    type,
    search: debouncedSearch,
    page,
    limit,
  })

  const handleSelect = (file: MediaFile) => {
    setTempSelectedId(file.id)
    setTempSelectedMedia(file)
  }

  const handleConfirm = () => {
    if (tempSelectedMedia) {
      onSelect(tempSelectedMedia)
      onOpenChange(false)
    }
  }

  const handleUploadSuccess = (files: MediaFile[]) => {
    const first = files[0]
    if (!first) return
    onSelect(first)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Select Media</DialogTitle>
      </DialogHeader>

      <DialogContent className="max-h-[70vh] overflow-y-auto">
        <div className="mb-4 flex gap-2 border-b border-input">
          <button
            type="button"
            onClick={() => setTab('browse')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
              tab === 'browse'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Browse
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
              tab === 'upload'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Upload
          </button>
        </div>

        {tab === 'browse' ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as MediaType)
                  setPage(1)
                }}
                className="sm:w-40"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="document">Documents</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            ) : data ? (
              <>
                <MediaGrid
                  files={data.data}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onSelect={handleSelect}
                  selectedId={tempSelectedId}
                />

                {data.meta.totalPages > 1 && (
                  <Pagination
                    page={data.meta.page}
                    totalPages={data.meta.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            ) : null}
          </div>
        ) : (
          <UploadZone onUploadSuccess={handleUploadSuccess} accept={accept} />
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        {tab === 'browse' && (
          <Button onClick={handleConfirm} disabled={!tempSelectedMedia}>
            Select
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  )
}

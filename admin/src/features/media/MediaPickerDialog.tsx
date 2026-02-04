import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { Search } from 'lucide-react'
import { MediaGrid } from './MediaGrid'
import { useMedia } from '@/hooks/use-media'
import type { MediaFile, MediaType } from '@/types/media'

interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: MediaFile) => void
  selectedId?: string
}

export function MediaPickerDialog({ open, onOpenChange, onSelect, selectedId }: MediaPickerDialogProps) {
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

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Select Media</DialogTitle>
      </DialogHeader>

      <DialogContent className="max-h-[70vh] overflow-y-auto">
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
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={!tempSelectedMedia}>
          Select
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

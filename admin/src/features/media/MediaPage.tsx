import { useState, useEffect } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { AlertDialog, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog'
import { Search } from 'lucide-react'
import { UploadZone } from './UploadZone'
import { MediaGrid } from './MediaGrid'
import { MediaDetailDialog } from './MediaDetailDialog'
import { CropDialog } from './CropDialog'
import { StorageCard } from './StorageCard'
import { useMedia, useDeleteMedia } from '@/hooks/use-media'
import type { MediaFile, MediaType } from '@/types/media'

export function MediaPage() {
  const [type, setType] = useState<MediaType>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)

  const limit = 20

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useMedia({
    type,
    search: debouncedSearch,
    page,
    limit,
  })

  const deleteMutation = useDeleteMedia()

  const handleDelete = (file: MediaFile) => {
    setSelectedFile(file)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedFile) {
      deleteMutation.mutate(selectedFile.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setSelectedFile(null)
        },
      })
    }
  }

  const handleEdit = (file: MediaFile) => {
    setSelectedFile(file)
    setDetailDialogOpen(true)
  }

  const handleCrop = (file: MediaFile) => {
    setSelectedFile(file)
    setCropDialogOpen(true)
  }

  const handleDeleteFromDetail = () => {
    setDetailDialogOpen(false)
    setDeleteDialogOpen(true)
  }

  const handleCropFromDetail = () => {
    setDetailDialogOpen(false)
    setCropDialogOpen(true)
  }

  return (
    <Shell title="Media">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Media Library</h1>
        </div>

        <StorageCard />

        <UploadZone />

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
            className="sm:w-48"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : data ? (
          <>
            <MediaGrid
              files={data.data}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCrop={handleCrop}
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

      <MediaDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        media={selectedFile}
        onDelete={handleDeleteFromDetail}
        onCrop={handleCropFromDetail}
      />

      <CropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        media={selectedFile}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Media File</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{selectedFile?.originalName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialog>
    </Shell>
  )
}

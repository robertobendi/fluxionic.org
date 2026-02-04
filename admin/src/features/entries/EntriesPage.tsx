import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EntryList } from './EntryList'
import { EntryDialog } from './EntryDialog'
import { useCollection } from '@/hooks/use-collections'
import { useEntries, useDeleteEntry } from '@/hooks/use-entries'
import type { Entry } from '@/types/entry'
import { Plus, Search, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'

export function EntriesPage() {
  const { collectionId } = useParams<{ collectionId: string }>()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>(
    'all'
  )
  const [currentPage, setCurrentPage] = useState(1)

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch collection details
  const {
    data: collection,
    isLoading: isLoadingCollection,
  } = useCollection(collectionId || '')

  // Fetch entries with search, filter, and pagination
  const {
    data: entriesData,
    isLoading: isLoadingEntries,
  } = useEntries(collectionId || '', {
    q: debouncedSearchQuery || undefined,
    status: statusFilter,
    page: currentPage,
    limit: 20,
  })

  const deleteMutation = useDeleteEntry(collectionId || '')

  const handleCreate = () => {
    setEditingEntry(null)
    setDialogOpen(true)
  }

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Entry deleted successfully')
      setDeleteConfirm(null)
    } catch (error) {
      toast.error('Failed to delete entry')
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingEntry(null)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as 'all' | 'draft' | 'published')
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoadingCollection) {
    return (
      <Shell title="Entries">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading collection...</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title={`${collection?.name || 'Collection'} Entries`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/collections')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{collection?.name} Entries</h1>
              <p className="mt-1 text-muted-foreground">
                Manage content entries for this collection
              </p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>

        {/* Search and filters */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </div>
        </Card>

        {/* Entries list */}
        <EntryList
          entries={entriesData?.data || []}
          collection={collection!}
          isLoading={isLoadingEntries}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleteConfirm={deleteConfirm}
          setDeleteConfirm={setDeleteConfirm}
          deleteMutation={deleteMutation}
          currentPage={entriesData?.meta.page || 1}
          totalPages={entriesData?.meta.totalPages || 1}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Dialog */}
      {collection && (
        <EntryDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          collection={collection}
          entry={editingEntry}
        />
      )}
    </Shell>
  )
}

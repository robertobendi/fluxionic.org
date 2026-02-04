import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CollectionDialog } from './CollectionDialog'
import { useCollections, useDeleteCollection } from '@/hooks/use-collections'
import type { Collection } from '@/types/collection'
import { Plus, Edit, Trash2, Database, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function CollectionsPage() {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: collections, isLoading } = useCollections()
  const deleteMutation = useDeleteCollection()

  const handleCreate = () => {
    setEditingCollection(null)
    setDialogOpen(true)
  }

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Collection deleted successfully')
      setDeleteConfirm(null)
    } catch (error) {
      toast.error('Failed to delete collection')
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingCollection(null)
  }

  return (
    <Shell title="Collections">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="mt-1 text-muted-foreground">
              Define content types with custom field schemas
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading collections...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && collections && collections.length === 0 && (
          <Card className="p-12 text-center">
            <Database className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No collections yet</h3>
            <p className="mt-2 text-muted-foreground">
              Get started by creating your first content collection.
            </p>
            <Button onClick={handleCreate} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </Card>
        )}

        {/* Collections grid */}
        {!isLoading && collections && collections.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Card key={collection.id} className="p-6 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{collection.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      /{collection.slug}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {collection.fields.length} field
                      {collection.fields.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Field preview */}
                {collection.fields.length > 0 && (
                  <div className="mt-4 space-y-1 border-t border-border pt-4">
                    {collection.fields.slice(0, 3).map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{field.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {field.type}
                        </span>
                      </div>
                    ))}
                    {collection.fields.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{collection.fields.length - 3} more
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/collections/${collection.id}/entries`)}
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Entries
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(collection)}
                    aria-label={`Edit ${collection.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {deleteConfirm === collection.id ? (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(collection.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Confirm'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(null)}
                        disabled={deleteMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(collection.id)}
                      aria-label={`Delete ${collection.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <CollectionDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        collection={editingCollection}
      />
    </Shell>
  )
}

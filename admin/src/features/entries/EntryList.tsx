import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Entry } from '@/types/entry'
import type { Collection } from '@/types/collection'
import { Edit, FileText } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'
import { formatDate } from '@/lib/formatters'
import { getEntryTitle } from './entry-utils'
import { DeleteEntryButton } from './DeleteEntryButton'

interface EntryListProps {
  entries: Entry[]
  collection: Collection
  isLoading: boolean
  onEdit: (entry: Entry) => void
  onDelete: (id: string) => void
  deleteConfirm: string | null
  setDeleteConfirm: (id: string | null) => void
  deleteMutation: UseMutationResult<void, Error, string>
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function EntryList({
  entries,
  collection,
  isLoading,
  onEdit,
  onDelete,
  deleteConfirm,
  setDeleteConfirm,
  deleteMutation,
  currentPage,
  totalPages,
  onPageChange,
}: EntryListProps) {
  if (isLoading) {
    return (
      <Card className="p-12">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading entries...</p>
        </div>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No entries found</h3>
        <p className="mt-2 text-muted-foreground">
          {collection.name} has no entries yet. Create your first entry to get started.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop: Table view */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {getEntryTitle(entry)}
                    <div className="text-xs text-muted-foreground">/{entry.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.status === 'published' ? 'success' : 'warning'}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(entry.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(entry)}
                        aria-label="Edit entry"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DeleteEntryButton
                        isConfirming={deleteConfirm === entry.id}
                        isPending={deleteMutation.isPending}
                        onConfirm={() => setDeleteConfirm(entry.id)}
                        onCancel={() => setDeleteConfirm(null)}
                        onDelete={() => onDelete(entry.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile: Card view */}
      <div className="md:hidden space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{getEntryTitle(entry)}</CardTitle>
                  <CardDescription className="text-xs">/{entry.slug}</CardDescription>
                </div>
                <Badge
                  variant={entry.status === 'published' ? 'success' : 'warning'}
                  className="ml-2 shrink-0"
                >
                  {entry.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Updated {formatDate(entry.updatedAt)}</p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-11"
                onClick={() => onEdit(entry)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <DeleteEntryButton
                isConfirming={deleteConfirm === entry.id}
                isPending={deleteMutation.isPending}
                onConfirm={() => setDeleteConfirm(entry.id)}
                onCancel={() => setDeleteConfirm(null)}
                onDelete={() => onDelete(entry.id)}
                variant="full"
              />
            </CardFooter>
          </Card>
        ))}
      </div>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/formatters'
import { fetcher } from '@/lib/api'
import type { Entry } from '@/types/entry'
import type { Collection } from '@/types/collection'
import { useState } from 'react'

interface Revision {
  id: string
  entryId: string
  version: number
  data: Record<string, unknown>
  status: string
  updatedBy: string | null
  createdAt: string
}

interface RevisionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: Collection
  entry: Entry
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string') return v.length > 80 ? v.slice(0, 80) + '…' : v
  return JSON.stringify(v)
}

export function RevisionsDialog({ open, onOpenChange, collection, entry }: RevisionsDialogProps) {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<number | null>(null)

  const { data: revisions = [], isLoading } = useQuery<Revision[]>({
    queryKey: ['revisions', entry.id],
    queryFn: () =>
      fetcher<Revision[]>(
        `/admin/collections/${collection.id}/entries/${entry.id}/revisions`
      ),
    enabled: open,
  })

  const restore = useMutation({
    mutationFn: (version: number) =>
      fetcher(
        `/admin/collections/${collection.id}/entries/${entry.id}/revisions/${version}/restore`,
        { method: 'POST' }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries', 'detail', collection.id, entry.id] })
      qc.invalidateQueries({ queryKey: ['entries'] })
      qc.invalidateQueries({ queryKey: ['revisions', entry.id] })
      toast.success('Revision restored')
      onOpenChange(false)
    },
  })

  const selectedRev = revisions.find((r) => r.version === selected)
  const fieldNames = Array.from(
    new Set([
      ...collection.fields.map((f) => f.name),
      ...(selectedRev ? Object.keys(selectedRev.data) : []),
      ...Object.keys(entry.data),
    ])
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-4xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Revision history</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="grid grid-cols-[220px,1fr] gap-4 max-h-[70vh] overflow-hidden">
          <div className="overflow-y-auto border rounded-md divide-y">
            {isLoading && <div className="p-3 text-sm text-muted-foreground">Loading…</div>}
            {revisions.length === 0 && !isLoading && (
              <div className="p-3 text-sm text-muted-foreground">No revisions yet.</div>
            )}
            {revisions.map((r) => (
              <button
                key={r.id}
                className={`w-full text-left p-3 text-sm ${selected === r.version ? 'bg-muted' : 'hover:bg-muted/50'}`}
                onClick={() => setSelected(r.version)}
              >
                <div className="font-medium">v{r.version}</div>
                <div className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</div>
                <div className="text-xs text-muted-foreground">{r.status}</div>
              </button>
            ))}
          </div>

          <div className="overflow-y-auto">
            {!selectedRev && (
              <p className="text-sm text-muted-foreground p-3">
                Select a revision to see a diff against the current entry.
              </p>
            )}
            {selectedRev && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">v{selectedRev.version}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(selectedRev.createdAt)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => restore.mutate(selectedRev.version)}
                    disabled={restore.isPending}
                  >
                    Restore this version
                  </Button>
                </div>

                <div className="rounded-md border divide-y">
                  {fieldNames.map((name) => {
                    const current = entry.data[name]
                    const prev = selectedRev.data[name]
                    const changed = JSON.stringify(current) !== JSON.stringify(prev)
                    return (
                      <div key={name} className="p-3 text-sm grid grid-cols-[140px,1fr,1fr] gap-3">
                        <div className={`font-medium ${changed ? 'text-yellow-600' : ''}`}>
                          {name}
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Revision</div>
                          <div className="font-mono break-all">{formatValue(prev)}</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">Current</div>
                          <div className="font-mono break-all">{formatValue(current)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

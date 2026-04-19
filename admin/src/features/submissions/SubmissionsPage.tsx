import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetcher } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useCollections } from '@/hooks/use-collections'
import { formatDate } from '@/lib/formatters'

interface Submission {
  id: string
  data: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export function SubmissionsPage() {
  const { collectionId = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: collections } = useCollections()
  const collection = collections?.find((c) => c.id === collectionId)

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ['submissions', collectionId],
    queryFn: () => fetcher(`/admin/collections/${collectionId}/submissions`),
    enabled: !!collectionId,
  })

  const del = useMutation({
    mutationFn: (id: string) => fetcher(`/admin/submissions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions', collectionId] })
      toast.success('Submission deleted')
    },
  })

  const fieldNames = collection
    ? collection.fields.filter((f) => f.type !== 'repeater').slice(0, 4).map((f) => f.name)
    : []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/collections')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">
          {collection ? `${collection.name} submissions` : 'Submissions'}
        </h1>
      </div>

      {!collection?.isForm && collection && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500 text-sm">
          This collection isn't flagged as a form. Public submissions to{' '}
          <code>/api/forms/{collection.slug}</code> will be rejected until you enable{' '}
          <strong>isForm</strong> on the collection.
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted</TableHead>
              {fieldNames.map((n) => (
                <TableHead key={n}>{n}</TableHead>
              ))}
              <TableHead>IP</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={fieldNames.length + 3} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {submissions.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={fieldNames.length + 3} className="text-center text-muted-foreground">
                  No submissions yet.
                </TableCell>
              </TableRow>
            )}
            {submissions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(s.createdAt)}
                </TableCell>
                {fieldNames.map((n) => (
                  <TableCell key={n} className="font-mono text-xs break-all">
                    {typeof s.data[n] === 'string' ? (s.data[n] as string) : JSON.stringify(s.data[n] ?? '—')}
                  </TableCell>
                ))}
                <TableCell className="font-mono text-xs">{s.ipAddress ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

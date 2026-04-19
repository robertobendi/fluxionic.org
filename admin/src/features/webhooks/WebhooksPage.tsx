import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetcher } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

type WebhookEvent =
  | 'entry.created'
  | 'entry.updated'
  | 'entry.deleted'
  | 'entry.published'
  | 'entry.unpublished'

const EVENTS: WebhookEvent[] = [
  'entry.created',
  'entry.updated',
  'entry.deleted',
  'entry.published',
  'entry.unpublished',
]

interface Webhook {
  id: string
  name: string
  url: string
  events: WebhookEvent[]
  collectionSlug: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface Delivery {
  id: string
  webhookId: string
  event: string
  status: string
  attempts: number
  lastError: string | null
  deliveredAt: string | null
  createdAt: string
}

export function WebhooksPage() {
  const qc = useQueryClient()
  const { data: webhooks } = useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: () => fetcher('/admin/webhooks'),
  })
  const { data: deliveries } = useQuery<Delivery[]>({
    queryKey: ['webhook-deliveries'],
    queryFn: () => fetcher('/admin/webhooks/deliveries?status=failed'),
  })

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([])
  const [collectionSlug, setCollectionSlug] = useState('')

  const create = useMutation({
    mutationFn: (body: any) =>
      fetcher('/admin/webhooks', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      setName('')
      setUrl('')
      setSelectedEvents([])
      setCollectionSlug('')
      qc.invalidateQueries({ queryKey: ['webhooks'] })
      toast.success('Webhook created')
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => fetcher(`/admin/webhooks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      fetcher(`/admin/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  })

  const retry = useMutation({
    mutationFn: (id: string) => fetcher(`/admin/webhooks/deliveries/${id}/retry`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhook-deliveries'] }),
  })

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Webhooks</h1>
        <p className="text-muted-foreground">
          Forward entry events to an external URL. Each delivery is signed with
          HMAC-SHA256 in <code>x-slatestack-signature</code>.
        </p>
      </header>

      <section className="rounded-md border p-4 space-y-3">
        <h2 className="font-semibold">Register webhook</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="netlify rebuild" />
          </div>
          <div className="space-y-1">
            <Label>URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Events</Label>
            <div className="flex flex-wrap gap-3">
              {EVENTS.map((e) => (
                <label key={e} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(e)}
                    onChange={(ev) =>
                      setSelectedEvents((prev) =>
                        ev.target.checked ? [...prev, e] : prev.filter((x) => x !== e)
                      )
                    }
                  />
                  {e}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Collection filter (optional)</Label>
            <Input value={collectionSlug} onChange={(e) => setCollectionSlug(e.target.value)} placeholder="news" />
          </div>
        </div>
        <Button
          disabled={!name || !url || selectedEvents.length === 0 || create.isPending}
          onClick={() =>
            create.mutate({
              name,
              url,
              events: selectedEvents,
              collectionSlug: collectionSlug || null,
            })
          }
        >
          <Plus className="h-4 w-4 mr-1" /> Create
        </Button>
      </section>

      <section className="rounded-md border divide-y">
        {webhooks?.length === 0 && <div className="p-4 text-sm text-muted-foreground">No webhooks yet.</div>}
        {webhooks?.map((w) => (
          <div key={w.id} className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium">{w.name} {!w.enabled && <span className="text-xs uppercase text-yellow-600 ml-2">paused</span>}</div>
              <div className="text-xs text-muted-foreground font-mono">{w.url}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Events: {w.events.join(', ')}
                {w.collectionSlug && ` — collection: ${w.collectionSlug}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => toggle.mutate({ id: w.id, enabled: !w.enabled })}>
                {w.enabled ? 'Pause' : 'Resume'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => remove.mutate(w.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </section>

      {deliveries && deliveries.length > 0 && (
        <section className="rounded-md border">
          <div className="p-4 border-b font-semibold">Failed deliveries</div>
          <div className="divide-y">
            {deliveries.map((d) => (
              <div key={d.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-mono text-xs">{d.event}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.attempts} attempt(s) — {d.lastError ?? 'no error recorded'}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => retry.mutate(d.id)}>
                  Retry
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

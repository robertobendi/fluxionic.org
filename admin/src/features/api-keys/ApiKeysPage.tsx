import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetcher } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Plus, Trash2 } from 'lucide-react'

interface ApiKeySummary {
  id: string
  name: string
  prefix: string
  scopes: { read: '*' | string[]; write: '*' | string[] }
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
}

interface CreatedApiKey extends ApiKeySummary {
  token: string
}

export function ApiKeysPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<ApiKeySummary[]>({
    queryKey: ['api-keys'],
    queryFn: () => fetcher('/admin/api-keys'),
  })

  const [name, setName] = useState('')
  const [readAll, setReadAll] = useState(true)
  const [writeAll, setWriteAll] = useState(false)
  const [freshKey, setFreshKey] = useState<CreatedApiKey | null>(null)

  const createMutation = useMutation({
    mutationFn: (input: {
      name: string
      scopes: { read: '*' | string[]; write: '*' | string[] }
    }) =>
      fetcher<CreatedApiKey>('/admin/api-keys', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (created) => {
      setFreshKey(created)
      setName('')
      qc.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API key created — copy it now, it will never be shown again.')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) =>
      fetcher<void>(`/admin/api-keys/${id}/revoke`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetcher<void>(`/admin/api-keys/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">API Keys</h1>
        <p className="text-muted-foreground">
          Bearer tokens used by static builds and external integrations. Tokens
          are shown once on creation and stored as SHA-256 hashes.
        </p>
      </header>

      <section className="rounded-md border p-4 space-y-3">
        <h2 className="font-semibold">Create a new key</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="netlify-build" />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={readAll} onChange={(e) => setReadAll(e.target.checked)} />
              Read all
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={writeAll} onChange={(e) => setWriteAll(e.target.checked)} />
              Write all
            </label>
          </div>
        </div>
        <Button
          disabled={!name || createMutation.isPending}
          onClick={() =>
            createMutation.mutate({
              name,
              scopes: {
                read: readAll ? '*' : [],
                write: writeAll ? '*' : [],
              },
            })
          }
        >
          <Plus className="h-4 w-4 mr-1" /> Create
        </Button>
      </section>

      {freshKey && (
        <div className="rounded-md border border-yellow-500 bg-yellow-500/10 p-3 space-y-2">
          <p className="text-sm font-semibold">Copy this token now — it will not be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-black/20 px-2 py-1 text-xs font-mono break-all">{freshKey.token}</code>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(freshKey.token); toast.success('Copied') }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFreshKey(null)}>Dismiss</Button>
        </div>
      )}

      <section className="rounded-md border divide-y">
        {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
        {data?.length === 0 && <div className="p-4 text-sm text-muted-foreground">No API keys yet.</div>}
        {data?.map((k) => (
          <div key={k.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{k.name}</div>
              <div className="text-xs text-muted-foreground font-mono">{k.prefix}…</div>
              <div className="text-xs text-muted-foreground mt-1">
                Created {new Date(k.createdAt).toLocaleString()}
                {k.lastUsedAt && ` — last used ${new Date(k.lastUsedAt).toLocaleString()}`}
                {k.revokedAt && ' — REVOKED'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!k.revokedAt && (
                <Button variant="outline" size="sm" onClick={() => revokeMutation.mutate(k.id)}>
                  Revoke
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(k.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

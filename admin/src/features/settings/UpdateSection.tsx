import { useState } from 'react'
import { useUpdateCheck } from '@/hooks/use-update-check'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetcher, executeUpdate } from '@/lib/api'
import type { UpdateExecuteResult } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { ExternalLink, RefreshCw, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'

interface ChangelogResult {
  releases: Array<{
    version: string
    name: string
    body: string
    publishedAt: string
    url: string
  }>
}

type UpdateStatus = 'idle' | 'starting' | 'backup' | 'merge' | 'migrate' | 'restart' | 'health' | 'complete' | 'error'

const statusMessages: Record<UpdateStatus, string> = {
  idle: '',
  starting: 'Starting update...',
  backup: 'Creating backup...',
  merge: 'Merging changes...',
  migrate: 'Running migrations...',
  restart: 'Restarting server...',
  health: 'Checking health...',
  complete: 'Update complete!',
  error: 'Update failed'
}

export function UpdateSection() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: update, isLoading: checkLoading, error: checkError } = useUpdateCheck()

  const { data: changelog } = useQuery({
    queryKey: ['admin', 'update', 'changelog'],
    queryFn: () => fetcher<ChangelogResult>('/admin/update/changelog'),
    enabled: !!update?.updateAvailable,
    staleTime: 5 * 60 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: executeUpdate,
    onMutate: () => {
      setUpdateStatus('starting')
      setErrorMessage(null)
    },
    onSuccess: (data: UpdateExecuteResult) => {
      setUpdateStatus(data.phase)

      if (!data.success) {
        setUpdateStatus('error')
        setErrorMessage(data.error || 'Update failed')
        return
      }

      if (data.phase === 'restart' || data.phase === 'complete') {
        // Server is restarting, schedule a page reload
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      }
    },
    onError: (error: Error) => {
      setUpdateStatus('error')
      setErrorMessage(error.message)
    }
  })

  const handleUpdateClick = () => {
    if (window.confirm('This will update Slatestack to the latest version. A backup will be created first. Continue?')) {
      updateMutation.mutate()
    }
  }

  if (checkLoading) {
    return <div className="animate-pulse h-24 bg-muted rounded" />
  }

  // Handle update check errors gracefully (e.g., private repo without token)
  if (checkError) {
    const errorMessage = checkError instanceof Error ? checkError.message : 'Failed to check for updates'
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded text-muted-foreground">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Unable to check for updates</p>
            <p className="text-sm mt-1">{errorMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  const latestRelease = changelog?.releases?.[0]
  const truncatedBody = latestRelease?.body
    ? latestRelease.body.length > 500
      ? latestRelease.body.slice(0, 500) + '...'
      : latestRelease.body
    : null

  const isUpdating = updateStatus !== 'idle' && updateStatus !== 'complete' && updateStatus !== 'error'

  return (
    <div className="space-y-4">
      {/* Version info */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Current version: <span className="font-mono text-foreground">{update?.currentVersion || 'Unknown'}</span>
        </span>
        {update?.updateAvailable && (
          <Badge variant="success">v{update.latestVersion} available</Badge>
        )}
      </div>

      {/* Update action */}
      {update?.updateAvailable && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleUpdateClick}
            disabled={isUpdating}
            size="sm"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Now
              </>
            )}
          </Button>
          {update.releaseUrl && (
            <a
              href={update.releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on GitHub
            </a>
          )}
        </div>
      )}

      {/* Update status feedback */}
      {updateStatus !== 'idle' && (
        <div className={`p-4 rounded flex items-center gap-3 ${
          updateStatus === 'error'
            ? 'bg-destructive/10 text-destructive'
            : updateStatus === 'complete'
            ? 'bg-success/10 text-success'
            : 'bg-muted/50'
        }`}>
          {updateStatus === 'error' ? (
            <XCircle className="h-5 w-5 flex-shrink-0" />
          ) : updateStatus === 'complete' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
          )}
          <div>
            <p className="font-medium">{statusMessages[updateStatus]}</p>
            {errorMessage && (
              <p className="text-sm mt-1">{errorMessage}</p>
            )}
            {updateStatus === 'restart' && (
              <p className="text-sm text-muted-foreground mt-1">Page will reload automatically...</p>
            )}
          </div>
        </div>
      )}

      {/* Changelog preview */}
      {latestRelease && truncatedBody && (
        <div className="mt-4 p-4 bg-muted/50 rounded">
          <h4 className="font-medium mb-2">What's new in v{latestRelease.version}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{truncatedBody}</p>
        </div>
      )}
    </div>
  )
}

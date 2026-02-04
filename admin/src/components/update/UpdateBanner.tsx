import { Link } from 'react-router-dom'
import { CircleArrowUp, X } from 'lucide-react'
import { useUpdateCheck } from '@/hooks/use-update-check'
import { useUpdateBannerStore } from '@/stores/update'
import { useSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const diffLabels: Record<string, string> = {
  major: 'Major update',
  minor: 'New features',
  patch: 'Bug fixes',
}

export function UpdateBanner() {
  const { data: session } = useSession()
  const { data: update, isLoading } = useUpdateCheck()
  const { dismissedVersion, dismissBanner } = useUpdateBannerStore()

  // Guard: only admin users can see the banner
  if ((session?.user as any)?.role !== 'admin') {
    return null
  }

  // Guard: don't show while loading
  if (isLoading) {
    return null
  }

  // Guard: no update available
  if (!update?.updateAvailable) {
    return null
  }

  // Guard: user already dismissed this version
  if (dismissedVersion === update.latestVersion) {
    return null
  }

  const diffLabel = update.versionDiff
    ? diffLabels[update.versionDiff] || 'Update'
    : 'Update'

  return (
    <div
      role="status"
      aria-label="Update available"
      className="bg-accent/10 border-b border-accent/20 px-4 py-2"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* Left side: icon + message */}
        <div className="flex items-center gap-2">
          <CircleArrowUp className="h-4 w-4 shrink-0 text-accent" />
          <span className="text-sm">
            <strong>v{update.latestVersion}</strong> available ({diffLabel})
          </span>
        </div>

        {/* Right side: action + dismiss */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/settings#update">View Details</Link>
          </Button>
          <button
            type="button"
            onClick={() => dismissBanner(update.latestVersion)}
            className="rounded p-1 hover:bg-muted"
            aria-label="Dismiss update notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useSystemInfo } from '@/hooks/use-system-info'
import { HealthDashboard } from './HealthDashboard'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Session {
  user: {
    role: string
  }
}

interface SystemInfoSectionProps {
  session: Session
}

export function SystemInfoSection({ session }: SystemInfoSectionProps) {
  const { data } = useSystemInfo()
  const [showRestartDialog, setShowRestartDialog] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

  if (session.user.role !== 'admin') {
    return null
  }

  const handleRestart = async () => {
    setIsRestarting(true)
    try {
      await fetch('/api/admin/restart', {
        method: 'POST',
        credentials: 'include',
      })
      toast.info('Server is restarting...')
      setShowRestartDialog(false)
      // Poll for server to come back up
      setTimeout(() => {
        const checkServer = setInterval(async () => {
          try {
            const res = await fetch('/api/health')
            if (res.ok) {
              clearInterval(checkServer)
              toast.success('Server restarted successfully')
              window.location.reload()
            }
          } catch {
            // Server still down, keep polling
          }
        }, 1000)
        // Stop polling after 30 seconds
        setTimeout(() => clearInterval(checkServer), 30000)
      }, 1000)
    } catch {
      toast.error('Failed to restart server')
      setIsRestarting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {data?.version && (
          <p className="text-sm text-muted-foreground">Version {data.version}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRestartDialog(true)}
          disabled={isRestarting}
        >
          {isRestarting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4" />
          )}
          Restart Server
        </Button>
      </div>
      <HealthDashboard />

      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogHeader>
          <AlertDialogTitle>Restart Server</AlertDialogTitle>
          <AlertDialogDescription>
            This will restart the backend server. You may briefly lose connection
            to the admin panel. The server will automatically come back up.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowRestartDialog(false)}
            disabled={isRestarting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRestart}
            disabled={isRestarting}
          >
            {isRestarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restarting...
              </>
            ) : (
              'Restart'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialog>
    </div>
  )
}

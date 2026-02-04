import { useSession } from '@/lib/auth'
import { ThemeToggle } from './ThemeToggle'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDrawerStore } from '@/stores/drawer'
import { SystemStatus } from '@/components/status/SystemStatus'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const { data: session } = useSession()
  const { toggle } = useDrawerStore()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      {/* Left side: hamburger + title */}
      <div className="flex items-center gap-3">
        {/* Hamburger button - mobile only, 44px touch target per WCAG 2.2 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-11 w-11 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      {/* Right side: status + theme toggle + user info */}
      <div className="flex items-center gap-4">
        <SystemStatus />
        <ThemeToggle />
        {session?.user && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{session.user.name}</span>
            <span className="text-muted-foreground">({(session.user as any).role})</span>
          </div>
        )}
      </div>
    </header>
  )
}

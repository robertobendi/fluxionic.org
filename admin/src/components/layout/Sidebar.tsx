import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Image, Users, LogOut, BarChart3, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from '@/lib/auth'

export function Sidebar() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut()
  }

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/collections', label: 'Collections', icon: FolderOpen },
    { to: '/metrics', label: 'Metrics', icon: BarChart3 },
    { to: '/media', label: 'Media', icon: Image },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  // Only show Users link if user is admin
  if (session?.user && (session.user as any).role === 'admin') {
    navItems.push({ to: '/users', label: 'Users', icon: Users })
  }

  return (
    <div className="flex h-full w-60 flex-col border-r border-border bg-background">
      <div className="p-6 flex items-center gap-2">
        <img src="/admin/slatestack.png" alt="" className="h-8 w-auto" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Slatestack</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[3px]",
                  "transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                  isActive
                    ? "bg-muted text-foreground border-b border-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105"
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}

import { Navigate } from 'react-router-dom'
import { useSession } from '@/lib/auth'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const userRole = (session?.user as any)?.role

  if (userRole !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

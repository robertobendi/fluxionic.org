import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'
import { formatDate } from '@/lib/formatters'

interface Session {
  user: {
    email: string
    role: string
    createdAt: string
    name?: string
  }
}

interface ProfileSectionProps {
  session: Session
}

export function ProfileSection({ session }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{session.user.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Role</p>
          <Badge variant={session.user.role === 'admin' ? 'accent' : 'secondary'}>
            {session.user.role}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Member since</p>
          <p className="font-medium">{formatDate(session.user.createdAt, 'long')}</p>
        </div>
      </CardContent>
    </Card>
  )
}

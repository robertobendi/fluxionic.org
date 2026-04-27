import { Shell } from '@/components/layout/Shell'
import { StatsCard } from './StatsCard'
import { MetricsCard } from './MetricsCard'
import { useStats } from '@/hooks/use-stats'
import { useSession } from '@/lib/auth'
import { FolderOpen, FileText, Image, Users } from 'lucide-react'

const collectionsCard = { title: 'Collections', icon: FolderOpen, key: 'collections' as const }
const entriesCard = { title: 'Entries', icon: FileText, key: 'entries' as const }
const mediaCard = { title: 'Media Files', icon: Image, key: 'media' as const }
const usersCard = { title: 'Users', icon: Users, key: 'users' as const }

export function DashboardPage() {
  const { data: stats, isLoading } = useStats()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const isAdmin = role === 'admin'
  const canUseEditorFeatures = role === 'admin' || role === 'editor'

  const statCards = [
    collectionsCard,
    entriesCard,
    ...(canUseEditorFeatures ? [mediaCard] : []),
    ...(isAdmin ? [usersCard] : []),
  ]

  return (
    <Shell title="Dashboard">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 md:mt-2 text-sm md:text-base text-muted-foreground">
          Overview of your Slatestack CMS
        </p>

        <div className="mt-6 md:mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <StatsCard
              key={card.title}
              title={card.title}
              value={stats?.[card.key] ?? 0}
              icon={card.icon}
              isLoading={isLoading}
              className="animate-slide-up opacity-0"
              style={{ animationDelay: `${500 + index * 120}ms` }}
            />
          ))}
        </div>

        {/* Metrics card with trend visualization — editor-only. */}
        {canUseEditorFeatures && (
          <div className="mt-6 md:mt-4">
            <MetricsCard />
          </div>
        )}
      </div>
    </Shell>
  )
}

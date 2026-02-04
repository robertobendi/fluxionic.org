import { Shell } from '@/components/layout/Shell'
import { StatsCard } from './StatsCard'
import { MetricsCard } from './MetricsCard'
import { useStats } from '@/hooks/use-stats'
import { FolderOpen, FileText, Image, Users } from 'lucide-react'

const statCards = [
  { title: 'Collections', icon: FolderOpen, key: 'collections' as const },
  { title: 'Entries', icon: FileText, key: 'entries' as const },
  { title: 'Media Files', icon: Image, key: 'media' as const },
  { title: 'Users', icon: Users, key: 'users' as const },
]

export function DashboardPage() {
  const { data: stats, isLoading } = useStats()

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

        {/* Metrics card with trend visualization */}
        <div className="mt-6 md:mt-4">
          <MetricsCard />
        </div>
      </div>
    </Shell>
  )
}

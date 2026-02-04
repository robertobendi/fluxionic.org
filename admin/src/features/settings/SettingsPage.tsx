import { Shell } from '@/components/layout/Shell'
import { useSession } from '@/lib/auth'
import { ProfileSection } from './ProfileSection'
import { PasswordSection } from './PasswordSection'
import { SystemInfoSection } from './SystemInfoSection'
import { UpdateSection } from './UpdateSection'
import { PresetSelector } from './PresetSelector'
import { SettingSection } from './SettingSection'
import { User, Lock, Palette, Activity, Download } from 'lucide-react'

export function SettingsPage() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  const isAdmin = (session.user as any).role === 'admin'

  return (
    <Shell title="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <SettingSection id="profile" title="Profile" icon={<User className="h-5 w-5" />}>
          <ProfileSection session={session as any} />
        </SettingSection>

        <SettingSection id="password" title="Password" icon={<Lock className="h-5 w-5" />}>
          <PasswordSection />
        </SettingSection>

        <SettingSection id="theme" title="Theme" icon={<Palette className="h-5 w-5" />}>
          <PresetSelector />
        </SettingSection>

        {isAdmin && (
          <>
            <SettingSection id="system" title="System Health" icon={<Activity className="h-5 w-5" />} defaultOpen={true}>
              <SystemInfoSection session={session as any} />
            </SettingSection>

            <SettingSection id="update" title="Updates" icon={<Download className="h-5 w-5" />}>
              <UpdateSection />
            </SettingSection>
          </>
        )}
      </div>
    </Shell>
  )
}

import * as Collapsible from '@radix-ui/react-collapsible'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings'

interface SettingSectionProps {
  id: string
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export function SettingSection({
  id,
  title,
  icon,
  children,
  defaultOpen = true,
}: SettingSectionProps) {
  const isOpen = useSettingsStore((state) => state.openSections[id] ?? defaultOpen)
  const toggleSection = useSettingsStore((state) => state.toggleSection)

  return (
    <Collapsible.Root open={isOpen} onOpenChange={() => toggleSection(id)}>
      <Card>
        <Collapsible.Trigger asChild>
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/5 transition-colors">
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </CardHeader>
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <CardContent>
            {children}
          </CardContent>
        </Collapsible.Content>
      </Card>
    </Collapsible.Root>
  )
}

import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore } from '@/stores/theme'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemePreference = 'light' | 'dark' | 'system'

const themes: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light theme' },
  { value: 'dark', icon: Moon, label: 'Dark theme' },
  { value: 'system', icon: Monitor, label: 'System theme' },
]

export function ThemeToggle() {
  const { preference, setPreference } = useThemeStore()

  return (
    <div
      className="flex items-center rounded-[2px] border border-border p-0.5"
      role="radiogroup"
      aria-label="Theme selection"
    >
      {themes.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant="ghost"
          size="icon"
          className={cn(
            'h-11 w-11 rounded-[2px] transition-colors',
            preference === value
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
          onClick={() => setPreference(value)}
          aria-label={label}
          aria-checked={preference === value}
          role="radio"
          title={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )
}

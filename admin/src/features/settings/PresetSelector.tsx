import { useThemeStore } from '@/stores/theme'
import { PRESETS } from '@/lib/presets'
import { cn } from '@/lib/utils'

export function PresetSelector() {
  const { colorPreset, setColorPreset } = useThemeStore()

  return (
    <div className="rounded-[16px] border border-border bg-card p-5">
      <h3 className="text-sm font-medium mb-1">Color Theme</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Choose a color scheme for the admin interface
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setColorPreset(preset.id)}
            className={cn(
              'group relative flex flex-col items-center p-3 rounded-lg border-2 transition-all',
              colorPreset === preset.id
                ? 'border-foreground bg-muted'
                : 'border-transparent bg-secondary hover:border-muted-foreground/50'
            )}
          >
            {/* Color swatches preview */}
            <div className="flex gap-1.5 mb-2">
              <div
                className="w-5 h-5 rounded-full ring-1 ring-border/50"
                style={{ backgroundColor: preset.preview.accent }}
              />
              <div
                className="w-5 h-5 rounded-full ring-1 ring-border/50"
                style={{ backgroundColor: preset.preview.highlight }}
              />
            </div>
            <span className="text-xs font-medium">{preset.name}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

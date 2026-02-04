import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PresetId } from '@/lib/presets'

type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  colorPreset: PresetId
  setColorPreset: (preset: PresetId) => void
}

// Helper to get effective theme based on preference
function getEffectiveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

// Apply preset to DOM
function applyPreset(preset: PresetId) {
  const root = document.documentElement
  if (preset === 'default') {
    root.removeAttribute('data-preset')
  } else {
    root.setAttribute('data-preset', preset)
  }
}

// Apply theme to DOM and sync FOUC-compatible localStorage key
function applyTheme(effectiveTheme: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(effectiveTheme)

  // Sync for FOUC script - stores 'dark' or removes key for light
  if (effectiveTheme === 'dark') {
    localStorage.setItem('slatestack-theme', 'dark')
  } else {
    localStorage.removeItem('slatestack-theme')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference: ThemePreference) => {
        set({ preference })
        applyTheme(getEffectiveTheme(preference))
      },
      colorPreset: 'default' as PresetId,
      setColorPreset: (preset: PresetId) => {
        set({ colorPreset: preset })
        applyPreset(preset)
      },
    }),
    {
      name: 'slatestack-theme-store', // Different key than FOUC script
      onRehydrateStorage: () => (state) => {
        // Apply theme and preset after zustand rehydrates from localStorage
        if (state) {
          applyTheme(getEffectiveTheme(state.preference))
          applyPreset(state.colorPreset)
        }
      },
    }
  )
)

// Subscribe to system preference changes (runs once on module load)
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    const { preference } = useThemeStore.getState()
    if (preference === 'system') {
      applyTheme(getEffectiveTheme(preference))
    }
  })
}

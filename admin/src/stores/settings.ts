import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  openSections: Record<string, boolean>
  toggleSection: (id: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      openSections: {},
      toggleSection: (id: string) => {
        set((state) => ({
          openSections: {
            ...state.openSections,
            [id]: !(state.openSections[id] ?? true),
          },
        }))
      },
    }),
    {
      name: 'slatestack-settings-store',
      partialize: (state) => ({ openSections: state.openSections }),
    }
  )
)

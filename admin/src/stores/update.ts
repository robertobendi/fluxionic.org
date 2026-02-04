import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UpdateBannerState {
  dismissedVersion: string | null
  dismissBanner: (version: string) => void
  resetDismiss: () => void
}

export const useUpdateBannerStore = create<UpdateBannerState>()(
  persist(
    (set) => ({
      dismissedVersion: null,
      dismissBanner: (version: string) => {
        set({ dismissedVersion: version })
      },
      resetDismiss: () => {
        set({ dismissedVersion: null })
      },
    }),
    {
      name: 'slatestack-update-banner',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ dismissedVersion: state.dismissedVersion }),
    }
  )
)

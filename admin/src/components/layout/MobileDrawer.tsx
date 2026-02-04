import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useDrawerStore } from '@/stores/drawer'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'

export function MobileDrawer() {
  const { isOpen, close } = useDrawerStore()
  const location = useLocation()

  // Close drawer when route changes (user navigates)
  useEffect(() => {
    close()
  }, [location.pathname, close])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="left" className="w-60 p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}

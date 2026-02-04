import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileDrawer } from './MobileDrawer'
import { UpdateBanner } from '../update/UpdateBanner'

interface ShellProps {
  children: ReactNode
  title?: string
}

export function Shell({ children, title }: ShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <UpdateBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar - hidden below 768px */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile drawer - controlled by Sheet (portal renders at root) */}
        <MobileDrawer />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header title={title} />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { SectionErrorBoundary } from '@/components/error/SectionErrorBoundary'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { CollectionsPage } from '@/features/collections'
import { EntriesPage } from '@/features/entries'
import { MediaPage } from '@/features/media'
import { MetricsPage } from '@/features/metrics'
import { UsersPage } from '@/features/users'
import { SettingsPage } from '@/features/settings'

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/',
      element: <ProtectedRoute />,
      children: [
        {
          index: true,
          element: (
            <SectionErrorBoundary section="Dashboard">
              <DashboardPage />
            </SectionErrorBoundary>
          ),
        },
        {
          path: 'collections',
          element: (
            <SectionErrorBoundary section="Collections">
              <CollectionsPage />
            </SectionErrorBoundary>
          ),
        },
        {
          path: 'collections/:collectionId/entries',
          element: (
            <SectionErrorBoundary section="Entries">
              <EntriesPage />
            </SectionErrorBoundary>
          ),
        },
        {
          path: 'media',
          element: (
            <SectionErrorBoundary section="Media">
              <MediaPage />
            </SectionErrorBoundary>
          ),
        },
        {
          path: 'metrics',
          element: (
            <SectionErrorBoundary section="Metrics">
              <MetricsPage />
            </SectionErrorBoundary>
          ),
        },
        {
          path: 'settings',
          element: (
            <SectionErrorBoundary section="Settings">
              <SettingsPage />
            </SectionErrorBoundary>
          ),
        },
        {
          path: 'users',
          element: (
            <AdminRoute>
              <SectionErrorBoundary section="Users">
                <UsersPage />
              </SectionErrorBoundary>
            </AdminRoute>
          ),
        },
      ],
    },
  ],
  {
    basename: '/admin',
  }
)

function App() {
  return <RouterProvider router={router} />
}

export default App

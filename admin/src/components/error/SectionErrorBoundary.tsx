import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './ErrorFallback'

interface SectionErrorBoundaryProps {
  children: React.ReactNode
  section: string
}

export function SectionErrorBoundary({ children, section }: SectionErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          FallbackComponent={ErrorFallback}
          onError={(error) => {
            const message = error instanceof Error ? error.message : String(error)
            console.error(`[${section}]`, message)
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

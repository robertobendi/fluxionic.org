import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'

export class APIError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'APIError'
    this.status = status
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only toast for background refetch failures (data already exists)
      if (query.state.data !== undefined) {
        toast.error(`Refresh failed: ${error.message}`)
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Fallback toast for mutations without onError handler
      toast.error(error.message || 'Operation failed')
    },
  }),
})

export interface UpdateExecuteResult {
  success: boolean;
  phase: 'backup' | 'merge' | 'migrate' | 'restart' | 'health' | 'complete';
  error?: string;
  backupPaths?: {
    database: string;
    uploads: string;
  };
  previousVersion: string;
  newVersion?: string;
  message?: string;
}

export async function executeUpdate(): Promise<UpdateExecuteResult> {
  const response = await fetch('/api/admin/update/execute', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Update failed: ${response.statusText}`);
  }

  return response.json();
}

export async function fetcher<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let errorMessage = response.statusText || 'Request failed'
    try {
      const body = await response.json()
      errorMessage = body.error || body.message || errorMessage
    } catch {
      // If JSON parsing fails, use statusText
    }
    throw new APIError(errorMessage, response.status)
  }

  return response.json()
}

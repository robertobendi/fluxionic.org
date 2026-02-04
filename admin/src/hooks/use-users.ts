import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor'
  createdAt: string
}

interface CreateUserInput {
  email: string
  name: string
  password: string
  role: 'admin' | 'editor'
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetcher<User[]>('/admin/users'),
    throwOnError: true,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      fetcher<User>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('User created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user')
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      fetcher<null>(`/admin/users/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('User deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user')
    },
  })
}

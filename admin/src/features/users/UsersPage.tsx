import { useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { CreateUserDialog } from './CreateUserDialog'
import { useUsers, useDeleteUser } from '@/hooks/use-users'
import { useSession } from '@/lib/auth'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/formatters'

export function UsersPage() {
  const { data: session } = useSession()
  const { data: users, isLoading } = useUsers()
  const deleteUser = useDeleteUser()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{
    id: string
    name: string
  } | null>(null)

  const currentUserId = session?.user?.id

  const handleDeleteClick = (userId: string, userName: string) => {
    if (userId === currentUserId) {
      toast.error('Cannot delete your own account')
      return
    }
    setUserToDelete({ id: userId, name: userName })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    await deleteUser.mutateAsync(userToDelete.id)
    setDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  return (
    <Shell title="Users">
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="mt-2 text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <>
              {/* Desktop: Table skeleton */}
              <div className="hidden md:block space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded bg-muted" />
                ))}
              </div>
              {/* Mobile: Card skeleton */}
              <div className="md:hidden space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded bg-muted" />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Desktop: Table view */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                          >
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(user.id, user.name)}
                            disabled={user.id === currentUserId}
                            aria-label={`Delete ${user.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: Card view */}
              <div className="md:hidden space-y-4">
                {users?.map((user) => (
                  <Card key={user.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{user.name}</CardTitle>
                          <CardDescription>{user.email}</CardDescription>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(user.createdAt)}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full h-11"
                        onClick={() => handleDeleteClick(user.id, user.name)}
                        disabled={user.id === currentUserId}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteUser.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialog>
    </Shell>
  )
}

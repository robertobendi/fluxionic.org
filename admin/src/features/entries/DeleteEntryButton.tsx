import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteEntryButtonProps {
  isConfirming: boolean
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
  onDelete: () => void
  variant?: 'icon' | 'full'
}

export function DeleteEntryButton({
  isConfirming,
  isPending,
  onConfirm,
  onCancel,
  onDelete,
  variant = 'icon',
}: DeleteEntryButtonProps) {
  if (isConfirming) {
    return (
      <>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isPending}
          className={variant === 'full' ? 'flex-1 h-11' : undefined}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            'Confirm'
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
          className={variant === 'full' ? 'flex-1 h-11' : undefined}
        >
          Cancel
        </Button>
      </>
    )
  }

  if (variant === 'full') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-11 px-3"
        onClick={onConfirm}
        aria-label="Delete entry"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onConfirm}
      aria-label="Delete entry"
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )
}

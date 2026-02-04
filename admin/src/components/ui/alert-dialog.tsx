import * as React from "react"

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-background/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 max-w-md w-full mx-4 rounded-[2px] border-2 border-foreground bg-background p-4 sm:p-6">
        {children}
      </div>
    </div>
  )
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
}

export function AlertDialogHeader({ children }: AlertDialogHeaderProps) {
  return <div className="mb-4">{children}</div>
}

interface AlertDialogTitleProps {
  children: React.ReactNode
}

export function AlertDialogTitle({ children }: AlertDialogTitleProps) {
  return <h2 className="text-xl font-semibold">{children}</h2>
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
}

export function AlertDialogDescription({ children }: AlertDialogDescriptionProps) {
  return <p className="text-sm text-muted-foreground mt-2">{children}</p>
}

interface AlertDialogFooterProps {
  children: React.ReactNode
}

export function AlertDialogFooter({ children }: AlertDialogFooterProps) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {children}
    </div>
  )
}

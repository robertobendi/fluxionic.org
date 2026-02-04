import * as React from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ResponsiveDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

/**
 * ResponsiveDialog - Renders Dialog on desktop (>=768px) and Drawer on mobile (<768px)
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {children}
    </Drawer>
  )
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveDialogContent({
  children,
  className,
}: ResponsiveDialogContentProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return <DialogContent className={className}>{children}</DialogContent>
  }

  return (
    <DrawerContent className={cn('px-4', className)}>{children}</DrawerContent>
  )
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveDialogHeader({
  children,
  className,
}: ResponsiveDialogHeaderProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return <DialogHeader className={className}>{children}</DialogHeader>
  }

  return (
    <DrawerHeader className={cn('text-left', className)}>{children}</DrawerHeader>
  )
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveDialogTitle({
  children,
  className,
}: ResponsiveDialogTitleProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return <DialogTitle className={className}>{children}</DialogTitle>
  }

  return <DrawerTitle className={className}>{children}</DrawerTitle>
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveDialogDescription({
  children,
  className,
}: ResponsiveDialogDescriptionProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <DialogDescription className={className}>{children}</DialogDescription>
    )
  }

  return <DrawerDescription className={className}>{children}</DrawerDescription>
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
  closeLabel?: string
}

export function ResponsiveDialogFooter({
  children,
  className,
  showCloseButton = true,
  closeLabel = 'Cancel',
}: ResponsiveDialogFooterProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return <DialogFooter className={className}>{children}</DialogFooter>
  }

  return (
    <DrawerFooter className={cn('pt-2', className)}>
      {children}
      {showCloseButton && (
        <DrawerClose asChild>
          <Button variant="outline">{closeLabel}</Button>
        </DrawerClose>
      )}
    </DrawerFooter>
  )
}

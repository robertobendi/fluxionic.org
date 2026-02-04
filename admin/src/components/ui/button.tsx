import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground uppercase tracking-[0.08em] hover:scale-105 hover:opacity-90 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground uppercase tracking-[0.08em] hover:scale-105 hover:opacity-90 active:scale-[0.98]",
        outline:
          "border-2 border-border bg-transparent text-foreground uppercase tracking-[0.08em] hover:scale-105 hover:border-foreground active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground uppercase tracking-[0.08em] hover:scale-105 hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2 rounded-[2px]",
        sm: "h-11 px-4 rounded-[2px]",
        lg: "h-12 px-8 rounded-[2px]",
        icon: "h-11 w-11 rounded-[2px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

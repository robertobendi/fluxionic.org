import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onCheckedChange?.(e.target.checked)
    }

    return (
      <div className="inline-flex items-center justify-center h-11 -my-2">
        <label
          className={cn(
            'relative inline-flex h-7 w-14 cursor-pointer items-center rounded-full transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-primary' : 'bg-input',
            className
          )}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={handleChange}
            ref={ref}
            {...props}
          />
          <span
            className={cn(
              'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background ring-0 transition-transform',
              checked ? 'translate-x-7' : 'translate-x-0.5'
            )}
          />
        </label>
      </div>
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }

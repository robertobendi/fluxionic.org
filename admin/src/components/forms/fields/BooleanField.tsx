import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { FieldDefinition } from '@/types/collection'
import { AlertCircle } from 'lucide-react'

interface BooleanFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

export function BooleanField({ field, control, error }: BooleanFieldProps) {
  return (
    <div className="space-y-2">
      <Controller
        name={field.name}
        control={control}
        render={({ field: controllerField }) => (
          <div className="flex items-center gap-3">
            <Switch
              id={field.name}
              checked={controllerField.value || false}
              onCheckedChange={controllerField.onChange}
            />
            <Label htmlFor={field.name} className="cursor-pointer">
              {field.label}
            </Label>
          </div>
        )}
      />
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5 mt-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

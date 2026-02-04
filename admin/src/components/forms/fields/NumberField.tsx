import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FieldDefinition } from '@/types/collection'
import { AlertCircle } from 'lucide-react'

interface NumberFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

export function NumberField({ field, control, error }: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      <Controller
        name={field.name}
        control={control}
        rules={{
          required: field.required ? `${field.label} is required` : false,
          min: field.min !== undefined
            ? {
                value: field.min,
                message: `Must be at least ${field.min}`,
              }
            : undefined,
          max: field.max !== undefined
            ? {
                value: field.max,
                message: `Must be at most ${field.max}`,
              }
            : undefined,
          validate: (value) => {
            if (value === '' || value === null || value === undefined) return true
            const num = Number(value)
            if (isNaN(num)) return 'Must be a valid number'
            return true
          },
        }}
        render={({ field: controllerField }) => (
          <Input
            {...controllerField}
            id={field.name}
            type="number"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            min={field.min}
            max={field.max}
            onChange={(e) => {
              const value = e.target.value
              controllerField.onChange(value === '' ? '' : Number(value))
            }}
          />
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

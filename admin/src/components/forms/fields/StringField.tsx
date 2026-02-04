import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FieldDefinition } from '@/types/collection'
import { AlertCircle } from 'lucide-react'

interface StringFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

export function StringField({ field, control, error }: StringFieldProps) {
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
          minLength: field.minLength
            ? {
                value: field.minLength,
                message: `Must be at least ${field.minLength} characters`,
              }
            : undefined,
          maxLength: field.maxLength
            ? {
                value: field.maxLength,
                message: `Must be at most ${field.maxLength} characters`,
              }
            : undefined,
        }}
        render={({ field: controllerField }) => (
          <Input
            {...controllerField}
            id={field.name}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            maxLength={field.maxLength}
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

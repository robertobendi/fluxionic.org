import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { FieldDefinition } from '@/types/collection'
import { AlertCircle } from 'lucide-react'

interface TextFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

export function TextField({ field, control, error }: TextFieldProps) {
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
          <Textarea
            {...controllerField}
            id={field.name}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={4}
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

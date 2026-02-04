import { Controller, useWatch } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FieldDefinition } from '@/types/collection'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

interface SlugFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function SlugField({ field, control, error }: SlugFieldProps) {
  // Watch the source field for auto-generation
  const sourceValue = useWatch({
    control,
    name: field.generateFrom || '',
  })

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
          pattern: {
            value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            message: 'Must be lowercase letters, numbers, and hyphens only',
          },
        }}
        render={({ field: controllerField }) => {
          // Auto-generate slug from source field
          useEffect(() => {
            if (field.generateFrom && sourceValue && !controllerField.value) {
              controllerField.onChange(slugify(sourceValue))
            }
          }, [sourceValue, controllerField, field.generateFrom])

          return (
            <Input
              {...controllerField}
              id={field.name}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              onChange={(e) => {
                const slugified = slugify(e.target.value)
                controllerField.onChange(slugified)
              }}
            />
          )
        }}
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

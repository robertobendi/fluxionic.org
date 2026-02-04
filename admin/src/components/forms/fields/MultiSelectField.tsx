import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { FieldDefinition } from '@/types/collection'
import { AlertCircle } from 'lucide-react'

interface MultiSelectFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

export function MultiSelectField({ field, control, error }: MultiSelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      <Controller
        name={field.name}
        control={control}
        rules={{
          required: field.required ? `${field.label} is required` : false,
        }}
        render={({ field: controllerField }) => {
          const value = Array.isArray(controllerField.value) ? controllerField.value : []

          const handleChange = (option: string, checked: boolean) => {
            const newValue = checked
              ? [...value, option]
              : value.filter((v: string) => v !== option)
            controllerField.onChange(newValue)
          }

          return (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <Checkbox
                    id={`${field.name}-${option}`}
                    checked={value.includes(option)}
                    onChange={(e) => handleChange(option, e.target.checked)}
                  />
                  <Label
                    htmlFor={`${field.name}-${option}`}
                    className="cursor-pointer font-normal"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
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

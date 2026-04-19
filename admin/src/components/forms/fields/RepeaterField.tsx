import { useFieldArray } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { FieldDefinition } from '@/types/collection'
import { AlertCircle, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { FieldRenderer } from '../FieldRenderer'

interface RepeaterFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

export function RepeaterField({ field, control, error }: RepeaterFieldProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: field.name,
  })

  const subFields = field.subFields ?? []
  const blank: Record<string, unknown> = Object.fromEntries(
    subFields.map((f) => [f.name, defaultForField(f)])
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          {field.label}
          {field.required && <span className="text-destructive"> *</span>}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(blank)}
        >
          <Plus className="h-4 w-4 mr-1" /> Add item
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No items yet. Click "Add item" to create one.</p>
      )}
      {fields.map((item, index) => (
        <div key={item.id} className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Item {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => index > 0 && move(index, index - 1)} disabled={index === 0}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => index < fields.length - 1 && move(index, index + 1)} disabled={index === fields.length - 1}>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {subFields.map((sub) => (
              <FieldRenderer
                key={sub.id}
                field={{ ...sub, name: `${field.name}.${index}.${sub.name}` }}
                control={control}
              />
            ))}
          </div>
        </div>
      ))}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5 mt-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

function defaultForField(field: FieldDefinition): unknown {
  switch (field.type) {
    case 'boolean':
      return false
    case 'number':
      return 0
    case 'multi-select':
    case 'multi-reference':
      return []
    default:
      return ''
  }
}

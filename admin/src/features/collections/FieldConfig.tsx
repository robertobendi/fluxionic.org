import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import type { FieldDefinition } from '@/types/collection'

interface FieldConfigProps {
  field: FieldDefinition
  allFields: FieldDefinition[]
  onChange: (field: FieldDefinition) => void
}

export function FieldConfig({ field, allFields, onChange }: FieldConfigProps) {
  const updateField = (updates: Partial<FieldDefinition>) => {
    onChange({ ...field, ...updates })
  }

  return (
    <div className="space-y-4 rounded-md border border-border bg-muted/50 p-4">
      {/* Validation options based on field type */}
      {(field.type === 'string' || field.type === 'text') && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-required`}>
                <input
                  id={`${field.id}-required`}
                  type="checkbox"
                  checked={field.required || false}
                  onChange={(e) => updateField({ required: e.target.checked })}
                  className="mr-2"
                />
                Required
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-unique`}>
                <input
                  id={`${field.id}-unique`}
                  type="checkbox"
                  checked={field.unique || false}
                  onChange={(e) => updateField({ unique: e.target.checked })}
                  className="mr-2"
                />
                Unique
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-minLength`}>Min Length</Label>
              <Input
                id={`${field.id}-minLength`}
                type="number"
                min="0"
                value={field.minLength || ''}
                onChange={(e) =>
                  updateField({
                    minLength: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="No minimum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-maxLength`}>Max Length</Label>
              <Input
                id={`${field.id}-maxLength`}
                type="number"
                min="1"
                value={field.maxLength || ''}
                onChange={(e) =>
                  updateField({
                    maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="No maximum"
              />
            </div>
          </div>
        </>
      )}

      {field.type === 'number' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-required`}>
                <input
                  id={`${field.id}-required`}
                  type="checkbox"
                  checked={field.required || false}
                  onChange={(e) => updateField({ required: e.target.checked })}
                  className="mr-2"
                />
                Required
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-unique`}>
                <input
                  id={`${field.id}-unique`}
                  type="checkbox"
                  checked={field.unique || false}
                  onChange={(e) => updateField({ unique: e.target.checked })}
                  className="mr-2"
                />
                Unique
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-min`}>Min Value</Label>
              <Input
                id={`${field.id}-min`}
                type="number"
                value={field.min !== undefined ? field.min : ''}
                onChange={(e) =>
                  updateField({
                    min: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="No minimum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-max`}>Max Value</Label>
              <Input
                id={`${field.id}-max`}
                type="number"
                value={field.max !== undefined ? field.max : ''}
                onChange={(e) =>
                  updateField({
                    max: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="No maximum"
              />
            </div>
          </div>
        </>
      )}

      {(field.type === 'select' || field.type === 'multi-select') && (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-options`}>
            Options (one per line)
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={`${field.id}-options`}
            value={(field.options || []).join('\n')}
            onChange={(e) =>
              updateField({
                options: e.target.value.split('\n').filter((opt) => opt.trim()),
              })
            }
            placeholder="option-1&#10;option-2&#10;option-3"
            rows={5}
          />
          <div className="mt-2">
            <Label htmlFor={`${field.id}-required`}>
              <input
                id={`${field.id}-required`}
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => updateField({ required: e.target.checked })}
                className="mr-2"
              />
              Required
            </Label>
          </div>
        </div>
      )}

      {field.type === 'slug' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-generateFrom`}>Generate From Field</Label>
            <Select
              id={`${field.id}-generateFrom`}
              value={field.generateFrom || ''}
              onChange={(e) => updateField({ generateFrom: e.target.value || undefined })}
            >
              <option value="">Select field...</option>
              {allFields
                .filter((f) => f.id !== field.id && f.type === 'string')
                .map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.label}
                  </option>
                ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-unique`}>
              <input
                id={`${field.id}-unique`}
                type="checkbox"
                checked={field.unique || false}
                onChange={(e) => updateField({ unique: e.target.checked })}
                className="mr-2"
              />
              Unique
            </Label>
          </div>
        </div>
      )}

      {(field.type === 'boolean' ||
        field.type === 'date' ||
        field.type === 'rich-text' ||
        field.type === 'media') && (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-required`}>
            <input
              id={`${field.id}-required`}
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => updateField({ required: e.target.checked })}
              className="mr-2"
            />
            Required
          </Label>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { FieldTypeSelector } from './FieldTypeSelector'
import { FieldConfig } from './FieldConfig'
import type { FieldDefinition, FieldType } from '@/types/collection'
import { Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'

interface SchemaBuilderProps {
  fields: FieldDefinition[]
  onChange: (fields: FieldDefinition[]) => void
}

export function SchemaBuilder({ fields, onChange }: SchemaBuilderProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())

  const addField = () => {
    const newField: FieldDefinition = {
      id: crypto.randomUUID(),
      name: '',
      label: '',
      type: 'string',
      required: false,
    }
    onChange([...fields, newField])
    setExpandedFields(new Set([...expandedFields, newField.id]))
  }

  const updateField = (index: number, field: FieldDefinition) => {
    const updated = [...fields]
    updated[index] = field
    onChange(updated)
  }

  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index)
    onChange(updated)
  }

  const toggleExpanded = (fieldId: string) => {
    const newExpanded = new Set(expandedFields)
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId)
    } else {
      newExpanded.add(fieldId)
    }
    setExpandedFields(newExpanded)
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return
    }

    const updated = [...fields]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    onChange(updated)
  }

  // Auto-generate field name from label (kebab-case)
  const autoGenerateName = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Check if field name is unique
  const isNameUnique = (name: string, currentIndex: number): boolean => {
    return !fields.some((f, i) => i !== currentIndex && f.name === name)
  }

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No fields yet. Add your first field to get started.</p>
          <Button onClick={addField}>Add Field</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const isExpanded = expandedFields.has(field.id)
            const hasError = !field.name || !field.label || !isNameUnique(field.name, index)

            return (
              <Card
                key={field.id}
                className={`p-4 transition-colors hover:bg-muted/50 ${hasError ? 'border-destructive' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Drag handle */}
                  <div className="flex flex-col gap-1 pt-2">
                    <button
                      type="button"
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Field content */}
                  <div className="flex-1 space-y-4">
                    {/* Basic info */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${field.id}-label`}>
                          Label <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`${field.id}-label`}
                          value={field.label}
                          onChange={(e) => {
                            const label = e.target.value
                            const name = field.name || autoGenerateName(label)
                            updateField(index, { ...field, label, name })
                          }}
                          placeholder="Field Label"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${field.id}-name`}>
                          Field Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`${field.id}-name`}
                          value={field.name}
                          onChange={(e) =>
                            updateField(index, { ...field, name: e.target.value })
                          }
                          placeholder="field-name"
                          className={!isNameUnique(field.name, index) ? 'border-destructive' : ''}
                        />
                        {!isNameUnique(field.name, index) && (
                          <p className="text-xs text-destructive">Field name must be unique</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${field.id}-type`}>Type</Label>
                        <FieldTypeSelector
                          value={field.type}
                          onChange={(type: FieldType) =>
                            updateField(index, { ...field, type })
                          }
                        />
                      </div>
                    </div>

                    {/* Field-specific configuration */}
                    {isExpanded && (
                      <FieldConfig
                        field={field}
                        allFields={fields}
                        onChange={(updated) => updateField(index, updated)}
                      />
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(field.id)}
                      >
                        {isExpanded ? 'Hide' : 'Show'} Configuration
                      </Button>
                    </div>
                  </div>

                  {/* Delete button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Button type="button" variant="outline" onClick={addField} className="w-full">
        Add Field
      </Button>
    </div>
  )
}

import { Select } from '@/components/ui/select'
import type { FieldType } from '@/types/collection'

interface FieldTypeSelectorProps {
  value: FieldType
  onChange: (value: FieldType) => void
  disabled?: boolean
}

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: 'string', label: 'Short Text', description: 'Single line text input' },
  { value: 'text', label: 'Long Text', description: 'Multi-line text input' },
  { value: 'rich-text', label: 'Rich Text', description: 'WYSIWYG editor' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
  { value: 'boolean', label: 'Boolean', description: 'True/false toggle' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'media', label: 'Media', description: 'Image/file upload' },
  { value: 'select', label: 'Select', description: 'Dropdown selection' },
  { value: 'multi-select', label: 'Multi-Select', description: 'Multiple selection' },
  { value: 'slug', label: 'Slug', description: 'URL-friendly identifier' },
]

export function FieldTypeSelector({ value, onChange, disabled }: FieldTypeSelectorProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as FieldType)}
      disabled={disabled}
    >
      {FIELD_TYPES.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </Select>
  )
}

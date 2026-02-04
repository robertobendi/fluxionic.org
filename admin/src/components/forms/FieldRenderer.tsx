import type { Control } from 'react-hook-form'
import type { FieldDefinition } from '@/types/collection'
import {
  StringField,
  TextField,
  NumberField,
  BooleanField,
  DateField,
  SelectField,
  MultiSelectField,
  SlugField,
  RichTextField,
  MediaField,
} from './fields'

interface FieldRendererProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

export function FieldRenderer({ field, control, error }: FieldRendererProps) {
  switch (field.type) {
    case 'string':
      return <StringField field={field} control={control} error={error} />

    case 'text':
      return <TextField field={field} control={control} error={error} />

    case 'number':
      return <NumberField field={field} control={control} error={error} />

    case 'boolean':
      return <BooleanField field={field} control={control} error={error} />

    case 'date':
      return <DateField field={field} control={control} error={error} />

    case 'select':
      return <SelectField field={field} control={control} error={error} />

    case 'multi-select':
      return <MultiSelectField field={field} control={control} error={error} />

    case 'slug':
      return <SlugField field={field} control={control} error={error} />

    case 'rich-text':
      return <RichTextField field={field} control={control} error={error} />

    case 'media':
      return <MediaField field={field} control={control} error={error} />

    default:
      return <StringField field={field} control={control} error={error} />
  }
}

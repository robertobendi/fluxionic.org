import { useForm } from 'react-hook-form'
import type { Collection } from '@/types/collection'
import { FieldRenderer } from './FieldRenderer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'

interface DynamicFormProps {
  collection: Collection
  defaultValues?: Record<string, any>
  defaultStatus?: 'draft' | 'published'
  onSubmit: (data: { data: Record<string, any>; status: 'draft' | 'published' }) => void
  onCancel: () => void
  isPending?: boolean
  submitLabel?: string
}

export function DynamicForm({
  collection,
  defaultValues = {},
  defaultStatus = 'draft',
  onSubmit,
  onCancel,
  isPending = false,
  submitLabel = 'Save',
}: DynamicFormProps) {
  // Initialize form with default values
  const initialValues: Record<string, any> = {}
  collection.fields.forEach((field) => {
    if (defaultValues[field.name] !== undefined) {
      initialValues[field.name] = defaultValues[field.name]
    } else if (field.type === 'boolean') {
      initialValues[field.name] = false
    } else if (field.type === 'number') {
      initialValues[field.name] = ''
    } else if (field.type === 'multi-select') {
      initialValues[field.name] = []
    } else {
      initialValues[field.name] = ''
    }
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      ...initialValues,
      status: defaultStatus,
    },
  })

  const status = watch('status') as 'draft' | 'published'

  const onFormSubmit = (formData: any) => {
    const { status, ...data } = formData

    // Clean up data - convert empty strings to appropriate types
    const cleanedData: Record<string, any> = {}
    collection.fields.forEach((field) => {
      const value = data[field.name]
      if (field.type === 'number') {
        cleanedData[field.name] = value === '' ? null : Number(value)
      } else if (field.type === 'boolean') {
        cleanedData[field.name] = Boolean(value)
      } else {
        cleanedData[field.name] = value
      }
    })

    onSubmit({
      data: cleanedData,
      status,
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Status selector */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          value={status}
          onChange={(e) => setValue('status', e.target.value as 'draft' | 'published')}
          disabled={isPending}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </Select>
      </div>

      {/* Dynamic fields based on collection schema */}
      {collection.fields.map((field) => {
        const fieldError = errors[field.name as keyof typeof errors]
        return (
          <FieldRenderer
            key={field.id}
            field={field}
            control={control}
            error={fieldError?.message as string | undefined}
          />
        )
      })}

      {/* Form actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

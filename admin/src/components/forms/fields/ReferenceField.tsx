import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { FieldDefinition } from '@/types/collection'
import { fetcher } from '@/lib/api'
import { AlertCircle } from 'lucide-react'

interface ReferenceFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

interface PaginatedEntries {
  data: Array<{ id: string; slug: string; data: Record<string, unknown>; status: 'draft' | 'published' }>
  meta: { total: number; limit: number; page: number; totalPages: number }
}

function entryLabel(entry: PaginatedEntries['data'][number], field: FieldDefinition): string {
  const key = field.labelField
  if (key && typeof entry.data[key] === 'string') return entry.data[key] as string
  // Fall back to common label fields
  for (const k of ['title', 'name', 'label', 'heading']) {
    if (typeof entry.data[k] === 'string') return entry.data[k] as string
  }
  return entry.slug
}

export function ReferenceField({ field, control, error }: ReferenceFieldProps) {
  const { data, isLoading } = useQuery<PaginatedEntries>({
    queryKey: ['reference-options', field.referenceCollection],
    queryFn: () =>
      fetcher<PaginatedEntries>(
        `/admin/collections/${field.referenceCollection}/entries?limit=100`
      ),
    enabled: !!field.referenceCollection,
  })

  const isMulti = field.type === 'multi-reference'
  const options = data?.data ?? []

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
        {!field.referenceCollection && (
          <span className="text-xs text-destructive ml-2">
            (missing referenceCollection)
          </span>
        )}
      </Label>
      <Controller
        name={field.name}
        control={control}
        rules={{ required: field.required ? `${field.label} is required` : false }}
        render={({ field: controllerField }) => (
          isMulti ? (
            <Select
              id={field.name}
              multiple
              value={Array.isArray(controllerField.value) ? controllerField.value : []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
                controllerField.onChange(selected)
              }}
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {entryLabel(o, field)}
                  {o.status === 'draft' ? ' (draft)' : ''}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              {...controllerField}
              id={field.name}
              value={controllerField.value ?? ''}
            >
              <option value="">{isLoading ? 'Loading…' : `Select ${field.label.toLowerCase()}`}</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {entryLabel(o, field)}
                  {o.status === 'draft' ? ' (draft)' : ''}
                </option>
              ))}
            </Select>
          )
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

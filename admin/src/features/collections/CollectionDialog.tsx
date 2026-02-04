import { useEffect, useState } from 'react'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SchemaBuilder } from './SchemaBuilder'
import { useCreateCollection, useUpdateCollection } from '@/hooks/use-collections'
import type { Collection, FieldDefinition } from '@/types/collection'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface CollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection?: Collection | null
  onSuccess?: () => void
}

export function CollectionDialog({
  open,
  onOpenChange,
  collection,
  onSuccess,
}: CollectionDialogProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [fields, setFields] = useState<FieldDefinition[]>([])
  const [slugTouched, setSlugTouched] = useState(false)

  const createMutation = useCreateCollection()
  const updateMutation = useUpdateCollection()

  const isEdit = !!collection

  // Initialize form with collection data when editing
  useEffect(() => {
    if (collection) {
      setName(collection.name)
      setSlug(collection.slug)
      setFields(collection.fields)
      setSlugTouched(true)
    } else {
      setName('')
      setSlug('')
      setFields([])
      setSlugTouched(false)
    }
  }, [collection, open])

  // Auto-generate slug from name (only if not editing and slug hasn't been manually touched)
  const handleNameChange = (value: string) => {
    setName(value)
    if (!isEdit && !slugTouched) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(autoSlug)
    }
  }

  const handleSlugChange = (value: string) => {
    setSlug(value)
    setSlugTouched(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!name.trim()) {
      toast.error('Collection name is required')
      return
    }

    if (!slug.trim()) {
      toast.error('Collection slug is required')
      return
    }

    if (fields.length === 0) {
      toast.error('At least one field is required')
      return
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
      toast.error('Slug must be lowercase letters, numbers, and hyphens only')
      return
    }

    // Validate all fields have name and label
    const invalidFields = fields.filter((f) => !f.name || !f.label)
    if (invalidFields.length > 0) {
      toast.error('All fields must have a name and label')
      return
    }

    // Validate field names are unique
    const fieldNames = fields.map((f) => f.name)
    const uniqueNames = new Set(fieldNames)
    if (fieldNames.length !== uniqueNames.size) {
      toast.error('Field names must be unique')
      return
    }

    // Validate select/multi-select fields have options
    const selectFields = fields.filter(
      (f) => (f.type === 'select' || f.type === 'multi-select') && (!f.options || f.options.length === 0)
    )
    if (selectFields.length > 0) {
      toast.error('Select and multi-select fields must have at least one option')
      return
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: collection.id,
          data: { name, fields },
        })
        toast.success('Collection updated successfully')
      } else {
        await createMutation.mutateAsync({ name, slug, fields })
        toast.success('Collection created successfully')
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to save collection')
      } else {
        toast.error('Failed to save collection')
      }
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-4xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isEdit ? 'Edit Collection' : 'Create Collection'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Collection Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Blog Posts"
                  disabled={isPending}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                  {isEdit && (
                    <span className="ml-2 text-xs text-muted-foreground">(locked)</span>
                  )}
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="blog-posts"
                  disabled={isPending || isEdit}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  title="Lowercase letters, numbers, and hyphens only"
                />
              </div>
            </div>

            {/* Schema builder */}
            <div className="space-y-2">
              <Label>
                Fields <span className="text-destructive">*</span>
              </Label>
              <SchemaBuilder fields={fields} onChange={setFields} />
            </div>
          </div>

          <ResponsiveDialogFooter showCloseButton={false} className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? 'Update Collection' : 'Create Collection'}
                </>
              )}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

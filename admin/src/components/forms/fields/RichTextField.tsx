import { useState } from 'react'
import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import type { FieldDefinition } from '@/types/collection'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaPickerDialog } from '@/features/media/MediaPickerDialog'
import type { MediaFile } from '@/types/media'

interface RichTextFieldProps {
  field: FieldDefinition
  control: Control<any>
  error?: string
}

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder: string
}

function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Image,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  const handleImageSelect = (media: MediaFile) => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .setImage({ src: media.url, alt: media.altText ?? undefined })
      .run()
  }

  return (
    <>
      <div className="rounded-md border border-input bg-background">
        <Toolbar editor={editor} onInsertImage={() => setIsPickerOpen(true)} />
        <EditorContent editor={editor} />
      </div>
      <MediaPickerDialog
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onSelect={handleImageSelect}
        accept="image/*"
      />
    </>
  )
}

interface ToolbarProps {
  editor: Editor | null
  onInsertImage: () => void
}

function Toolbar({ editor, onInsertImage }: ToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-input p-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleBold().run()}
        className={editor?.isActive('bold') ? 'bg-accent' : ''}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className={editor?.isActive('italic') ? 'bg-accent' : ''}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <div className="mx-2 h-6 w-px bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor?.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor?.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <div className="mx-2 h-6 w-px bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        className={editor?.isActive('bulletList') ? 'bg-accent' : ''}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        className={editor?.isActive('orderedList') ? 'bg-accent' : ''}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <div className="mx-2 h-6 w-px bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onInsertImage}
        disabled={!editor}
        title="Insert image"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function RichTextField({ field, control, error }: RichTextFieldProps) {
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
        }}
        render={({ field: controllerField }) => (
          <RichTextEditor
            value={controllerField.value}
            onChange={controllerField.onChange}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
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

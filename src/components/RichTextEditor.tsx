import { useRef, useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react'

const FONT_SIZES = [
  { label: 'Pequeno', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Médio', value: '4' },
  { label: 'Grande', value: '5' },
  { label: 'Muito Grande', value: '6' },
]

const FONT_FAMILIES = [
  { label: 'Padrão', value: 'inherit' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
]

interface RichTextEditorProps {
  name?: string
  defaultValue?: string
  value?: string
  onChange?: (html: string) => void
}

function ToolButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: ReactNode
}) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} title={title}>
      {children}
    </Button>
  )
}

export function RichTextEditor({ name, defaultValue, value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastSync = useRef<string>('')

  useEffect(() => {
    if (editorRef.current) {
      const initial = value ?? defaultValue ?? ''
      editorRef.current.innerHTML = initial
      if (inputRef.current) inputRef.current.value = initial
      lastSync.current = initial
    }
  }, [])

  useEffect(() => {
    if (value !== undefined && editorRef.current && value !== lastSync.current) {
      editorRef.current.innerHTML = value
      if (inputRef.current) inputRef.current.value = value
      lastSync.current = value
    }
  }, [value])

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val)
    syncValue()
    editorRef.current?.focus()
  }

  const syncValue = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      if (inputRef.current) inputRef.current.value = html
      lastSync.current = html
      onChange?.(html)
    }
  }

  return (
    <div className="border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {name && <input type="hidden" name={name} ref={inputRef} />}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-slate-50 rounded-t-md items-center">
        <ToolButton onClick={() => exec('bold')} title="Negrito">
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec('italic')} title="Itálico">
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec('underline')} title="Sublinhado">
          <Underline className="w-4 h-4" />
        </ToolButton>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <ToolButton onClick={() => exec('formatBlock', 'H1')} title="Título 1">
          <Heading1 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec('formatBlock', 'H2')} title="Título 2">
          <Heading2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec('insertUnorderedList')} title="Lista">
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec('insertOrderedList')} title="Lista Numerada">
          <ListOrdered className="w-4 h-4" />
        </ToolButton>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <ToolButton onClick={() => exec('justifyLeft')} title="Alinhar à Esquerda">
          <AlignLeft className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec('justifyCenter')} title="Centralizar">
          <AlignCenter className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec('justifyRight')} title="Alinhar à Direita">
          <AlignRight className="w-4 h-4" />
        </ToolButton>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <Select onValueChange={(v) => exec('fontSize', v)}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Tamanho" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => exec('fontName', v)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <label className="flex items-center gap-1 cursor-pointer px-2 h-9 rounded-md hover:bg-slate-200 transition-colors">
          <span className="text-xs font-medium text-slate-600">Cor</span>
          <input
            type="color"
            onChange={(e) => exec('foreColor', e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            title="Cor do texto"
          />
        </label>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[200px] focus:outline-none prose max-w-none"
        onInput={syncValue}
        onBlur={syncValue}
      />
    </div>
  )
}

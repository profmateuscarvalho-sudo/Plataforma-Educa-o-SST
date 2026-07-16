import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bold, Italic, Underline, List, Heading1, Heading2 } from 'lucide-react'

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

export function RichTextEditor({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue
      if (inputRef.current) inputRef.current.value = defaultValue
    }
  }, [defaultValue])

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    updateInput()
  }

  const updateInput = () => {
    if (inputRef.current && editorRef.current) {
      inputRef.current.value = editorRef.current.innerHTML
    }
  }

  return (
    <div className="border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <input type="hidden" name={name} ref={inputRef} />
      <div className="flex flex-wrap gap-1 p-2 border-b bg-slate-50 rounded-t-md items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec('bold')}
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec('italic')}
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec('underline')}
          title="Sublinhado"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec('formatBlock', 'H1')}
          title="Título 1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec('formatBlock', 'H2')}
          title="Título 2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exec('insertUnorderedList')}
          title="Lista"
        >
          <List className="w-4 h-4" />
        </Button>
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
        onInput={updateInput}
        onBlur={updateInput}
      />
    </div>
  )
}

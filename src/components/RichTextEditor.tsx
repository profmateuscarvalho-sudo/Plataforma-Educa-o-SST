import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, Heading1, Heading2 } from 'lucide-react'

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
      <div className="flex gap-1 p-2 border-b bg-slate-50 rounded-t-md">
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
          onClick={() => exec('insertUnorderedList')}
          title="Lista"
        >
          <List className="w-4 h-4" />
        </Button>
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

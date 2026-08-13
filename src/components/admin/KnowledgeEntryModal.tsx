import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import { createKnowledgeEntry, updateKnowledgeEntry } from '@/services/knowledge'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'
import type { KnowledgeEntry } from '@/types'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_TEXT_LENGTH = 100000
const MAX_JSON_LENGTH = 200000

type EntryType = 'pdf' | 'image' | 'link' | 'free_text' | 'json'

interface Props {
  open: boolean
  setOpen: (v: boolean) => void
  editing: KnowledgeEntry | null
  onSuccess: () => void
}

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  image: 'Imagem',
  link: 'Link (URL)',
  free_text: 'Texto Livre',
  json: 'JSON Estruturado',
}

export function KnowledgeEntryModal({ open, setOpen, editing, onSuccess }: Props) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<EntryType>('free_text')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [jsonData, setJsonData] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [fileError, setFileError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [textError, setTextError] = useState('')
  const [jsonError, setJsonError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setTitle(editing?.title || '')
      setType((editing?.type as EntryType) || 'free_text')
      setFile(null)
      setUrl(editing?.url || '')
      setRawText(editing?.raw_text || '')
      setJsonData(editing?.json_data != null ? JSON.stringify(editing.json_data, null, 2) : '')
      setTagsText(editing?.tags?.join(', ') || '')
      setFileError('')
      setErrorMessage('')
      setTextError('')
      setJsonError('')
    }
  }, [open, editing])

  const handleFileChange = (selectedFile: File | null) => {
    setFileError('')
    if (selectedFile && selectedFile.size > MAX_FILE_SIZE) {
      setFileError(
        `O arquivo excede o limite de 50MB (tamanho atual: ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB)`,
      )
      setFile(null)
      return
    }
    setFile(selectedFile)
  }

  const parseTags = () =>
    tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

  const validateJson = (value: string) => {
    if (!value.trim()) return 'O JSON não pode estar vazio.'
    try {
      const parsed = JSON.parse(value)
      if (parsed === null || typeof parsed !== 'object') {
        return 'O JSON deve ser um objeto ou array.'
      }
      return ''
    } catch (err) {
      return 'JSON inválido: ' + (err instanceof Error ? err.message : String(err))
    }
  }

  const buildCreateFormData = (): FormData => {
    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('type', type)
    formData.append('tags', JSON.stringify(parseTags()))
    formData.append('status', 'processing')

    if (type === 'pdf' || type === 'image') {
      if (file) formData.append('file', file)
    } else if (type === 'link') {
      formData.append('url', url.trim())
    } else if (type === 'free_text') {
      formData.append('raw_text', rawText)
    } else if (type === 'json') {
      formData.append('json_data', jsonData)
    }
    return formData
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setTextError('')
    setJsonError('')

    if (!title.trim()) return

    if (rawText.length > MAX_TEXT_LENGTH) {
      setTextError(
        `O texto deve ter no máximo ${MAX_TEXT_LENGTH.toLocaleString('pt-BR')} caracteres.`,
      )
      return
    }

    if (jsonData.length > MAX_JSON_LENGTH) {
      setJsonError(
        `O JSON deve ter no máximo ${MAX_JSON_LENGTH.toLocaleString('pt-BR')} caracteres.`,
      )
      return
    }

    if (file && file.size > MAX_FILE_SIZE) {
      setFileError(
        `O arquivo excede o limite de 50MB (tamanho atual: ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      )
      return
    }

    if (type === 'json') {
      const jsonValidation = validateJson(jsonData)
      if (jsonValidation) {
        setJsonError(jsonValidation)
        return
      }
    }

    if (!editing) {
      if ((type === 'pdf' || type === 'image') && !file) return
      if (type === 'link' && !url.trim()) return
      if (type === 'free_text' && !rawText.trim()) return
      if (type === 'json' && !jsonData.trim()) return
    }

    setSaving(true)
    try {
      if (editing) {
        const tags = parseTags()
        const contentChanged =
          file !== null ||
          url !== (editing.url || '') ||
          rawText !== (editing.raw_text || '') ||
          jsonData !== (editing.json_data != null ? JSON.stringify(editing.json_data, null, 2) : '')

        if (contentChanged || file) {
          const formData = new FormData()
          formData.append('title', title.trim())
          formData.append('tags', JSON.stringify(tags))
          if (rawText) formData.append('raw_text', rawText)
          if (url.trim()) formData.append('url', url.trim())
          if (file) formData.append('file', file)
          if (type === 'json' && jsonData.trim()) {
            formData.append('json_data', jsonData)
          }
          formData.append('status', 'processing')
          await updateKnowledgeEntry(editing.id, formData)
        } else {
          await updateKnowledgeEntry(editing.id, { title: title.trim(), tags })
        }
        toast({ title: 'Entrada atualizada!' })
      } else {
        const formData = buildCreateFormData()
        await createKnowledgeEntry(formData)
        toast({ title: 'Entrada criada! Processando...' })
      }
      onSuccess()
      setOpen(false)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('[KnowledgeEntryModal] Failed to save entry:', {
        url: `${import.meta.env.VITE_POCKETBASE_URL}/api/collections/knowledge_entries/records`,
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        bodyKeys: editing
          ? [
              'title',
              'tags',
              'status',
              file ? 'file' : '',
              url ? 'url' : '',
              rawText ? 'raw_text' : '',
              type === 'json' && jsonData ? 'json_data' : '',
            ].filter(Boolean)
          : [
              'title',
              'type',
              'tags',
              'status',
              type === 'pdf' || type === 'image' ? 'file' : '',
              type === 'link' ? 'url' : '',
              type === 'free_text' ? 'raw_text' : '',
              type === 'json' ? 'json_data' : '',
            ].filter(Boolean),
        editing: !!editing,
        entryType: type,
        title: title.trim(),
        hasFile: !!file,
        fileSize: file?.size,
        hasUrl: !!url.trim(),
        hasRawText: !!rawText,
        hasJsonData: !!jsonData,
        error,
      })
      setErrorMessage(`Erro ao salvar: ${message}`)
    } finally {
      setSaving(false)
    }
  }

  const hasBlockingError = !!fileError || !!textError || !!jsonError

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          {!editing && (
            <div>
              <Label>Tipo *</Label>
              <Select
                value={type}
                onValueChange={(v: EntryType) => {
                  setType(v)
                  setFileError('')
                  setErrorMessage('')
                  setTextError('')
                  setJsonError('')
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {(type === 'pdf' || type === 'image') && (
            <div>
              <Label>{editing ? 'Substituir arquivo' : 'Arquivo *'}</Label>
              <Input
                type="file"
                accept={type === 'pdf' ? 'application/pdf' : 'image/png,image/jpeg,image/webp'}
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                required={!editing}
              />
              {fileError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fileError}
                </p>
              )}
              {!fileError && type === 'pdf' && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Cole o texto extraído do PDF no campo abaixo.
                  PDFs digitalizados sem texto extraível devem usar "Texto Livre".
                </p>
              )}
              {!fileError && type === 'image' && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> OCR não é suportado. Descreva o conteúdo da
                  imagem no campo de texto abaixo.
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Tamanho máximo: 50MB</p>
            </div>
          )}
          {type === 'link' && (
            <div>
              <Label>URL *</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com/artigo"
                required={!editing}
              />
              <p className="text-xs text-slate-500 mt-1">
                O sistema buscará o conteúdo da página automaticamente.
              </p>
            </div>
          )}
          {(type === 'free_text' || type === 'pdf' || type === 'image') && (
            <div>
              <Label>{type === 'free_text' ? 'Conteúdo *' : 'Texto extraído / Descrição'}</Label>
              <Textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value)
                  if (e.target.value.length > MAX_TEXT_LENGTH) {
                    setTextError(
                      `O texto deve ter no máximo ${MAX_TEXT_LENGTH.toLocaleString('pt-BR')} caracteres.`,
                    )
                  } else {
                    setTextError('')
                  }
                }}
                rows={8}
                placeholder="Digite ou cole o conteúdo aqui..."
                required={type === 'free_text' && !editing}
              />
              <div className="flex items-center justify-between mt-1">
                <span
                  className={`text-xs ${rawText.length > MAX_TEXT_LENGTH ? 'text-red-600 font-medium' : 'text-slate-500'}`}
                >
                  {rawText.length.toLocaleString('pt-BR')} /{' '}
                  {MAX_TEXT_LENGTH.toLocaleString('pt-BR')} caracteres
                </span>
              </div>
              {textError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {textError}
                </p>
              )}
            </div>
          )}
          {type === 'json' && (
            <div>
              <Label>Conteúdo JSON *</Label>
              <Textarea
                value={jsonData}
                onChange={(e) => {
                  setJsonData(e.target.value)
                  if (e.target.value.length > MAX_JSON_LENGTH) {
                    setJsonError(
                      `O JSON deve ter no máximo ${MAX_JSON_LENGTH.toLocaleString('pt-BR')} caracteres.`,
                    )
                  } else if (e.target.value.trim()) {
                    setJsonError(validateJson(e.target.value))
                  } else {
                    setJsonError('')
                  }
                }}
                rows={15}
                className="font-mono text-xs"
                placeholder={
                  '{\n  "items": [\n    {\n      "title": "...",\n      "content": "..."\n    }\n  ]\n}'
                }
                required={!editing}
                spellCheck={false}
              />
              <div className="flex items-center justify-between mt-1">
                <span
                  className={`text-xs ${jsonData.length > MAX_JSON_LENGTH ? 'text-red-600 font-medium' : 'text-slate-500'}`}
                >
                  {jsonData.length.toLocaleString('pt-BR')} /{' '}
                  {MAX_JSON_LENGTH.toLocaleString('pt-BR')} caracteres
                </span>
                {!jsonError && jsonData.trim() && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    JSON válido
                  </span>
                )}
              </div>
              {jsonError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {jsonError}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Cole o JSON gerado pela IA. O conteúdo textual (títulos, descrições, perguntas e
                respostas) será extraído automaticamente para alimentar a base de conhecimento.
              </p>
            </div>
          )}
          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="NR-12, Ergonomia, eSocial"
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving || hasBlockingError}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? 'Salvar' : 'Criar e Processar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

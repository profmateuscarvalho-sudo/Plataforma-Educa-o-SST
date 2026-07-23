import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertCircle } from 'lucide-react'
import { createKnowledgeEntry, updateKnowledgeEntry } from '@/services/knowledge'
import { useToast } from '@/hooks/use-toast'
import type { KnowledgeEntry } from '@/types'

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
}

export function KnowledgeEntryModal({ open, setOpen, editing, onSuccess }: Props) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'pdf' | 'image' | 'link' | 'free_text'>('free_text')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setTitle(editing?.title || '')
      setType(editing?.type || 'free_text')
      setFile(null)
      setUrl(editing?.url || '')
      setRawText(editing?.raw_text || '')
      setTagsText(editing?.tags?.join(', ') || '')
    }
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if ((type === 'pdf' || type === 'image') && !editing && !file) return
    if (type === 'link' && !editing && !url.trim()) return
    setSaving(true)
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      if (editing) {
        const contentChanged =
          file !== null || url !== (editing.url || '') || rawText !== (editing.raw_text || '')
        if (contentChanged || file) {
          const formData = new FormData()
          formData.append('title', title.trim())
          formData.append('tags', JSON.stringify(tags))
          if (rawText) formData.append('raw_text', rawText)
          if (url) formData.append('url', url)
          if (file) formData.append('file', file)
          formData.append('status', 'processing')
          await updateKnowledgeEntry(editing.id, formData)
        } else {
          await updateKnowledgeEntry(editing.id, { title: title.trim(), tags })
        }
        toast({ title: 'Entrada atualizada!' })
      } else {
        const formData = new FormData()
        formData.append('title', title.trim())
        formData.append('type', type)
        formData.append('tags', JSON.stringify(tags))
        formData.append('status', 'processing')
        if (rawText) formData.append('raw_text', rawText)
        if (url) formData.append('url', url)
        if (file) formData.append('file', file)
        await createKnowledgeEntry(formData)
        toast({ title: 'Entrada criada! Processando...' })
      }
      onSuccess()
      setOpen(false)
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          {!editing && (
            <div>
              <Label>Tipo *</Label>
              <Select
                value={type}
                onValueChange={(v: 'pdf' | 'image' | 'link' | 'free_text') => setType(v)}
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
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required={!editing}
              />
              {type === 'pdf' && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Cole o texto extraído do PDF no campo abaixo.
                  PDFs digitalizados sem texto extraível devem usar "Texto Livre".
                </p>
              )}
              {type === 'image' && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> OCR não é suportado. Descreva o conteúdo da
                  imagem no campo de texto abaixo.
                </p>
              )}
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
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                placeholder="Digite ou cole o conteúdo aqui..."
                required={type === 'free_text' && !editing}
              />
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
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? 'Salvar' : 'Criar e Processar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { RichTextEditor } from '@/components/RichTextEditor'
import { createAgentKnowledge, updateAgentKnowledge } from '@/services/agent'
import { useToast } from '@/hooks/use-toast'
import type { AgentKnowledgeBase } from '@/types'

interface Props {
  open: boolean
  setOpen: (v: boolean) => void
  editing: AgentKnowledgeBase | null
  onSuccess: () => void
}

export function KnowledgeBaseModal({ open, setOpen, editing, onSuccess }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [source, setSource] = useState('')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setTitle(editing?.title || '')
      setContent(editing?.content || '')
      setTagsText(editing?.tags?.join(', ') || '')
      setSource(editing?.source || '')
      setActive(editing?.active ?? true)
    }
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const data = { title: title.trim(), content, tags, source: source.trim(), active }
      if (editing) {
        await updateAgentKnowledge(editing.id, data)
        toast({ title: 'Entrada atualizada!' })
      } else {
        await createAgentKnowledge(data)
        toast({ title: 'Entrada criada!' })
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
          <div>
            <Label>Conteúdo</Label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>
          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="NR-6, EPI, Ergonomia"
            />
          </div>
          <div>
            <Label>Fonte</Label>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Ex: NR-6, Revista Educação SST Ed. 12"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label>Ativo</Label>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Tag, Loader2, Pencil } from 'lucide-react'
import {
  getProfessionalTagOptions,
  createProfessionalTagOption,
  updateProfessionalTagOption,
  deleteProfessionalTagOption,
  type ProfessionalTagOption,
} from '@/services/professional-tag-options'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminProfessionalTags() {
  const [tags, setTags] = useState<ProfessionalTagOption[]>([])
  const [open, setOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [creating, setCreating] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<ProfessionalTagOption | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    try {
      setTags(await getProfessionalTagOptions())
    } catch {
      toast({ title: 'Erro ao carregar tags', variant: 'destructive' })
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('professional_tag_options', () => load())

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return
    setCreating(true)
    try {
      await createProfessionalTagOption(newTag.trim())
      toast({ title: 'Tag criada com sucesso' })
      setNewTag('')
      setOpen(false)
    } catch {
      toast({ title: 'Erro ao criar tag', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleEditOpen = (tag: ProfessionalTagOption) => {
    setEditingTag(tag)
    setEditName(tag.name)
    setEditOpen(true)
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTag || !editName.trim()) return
    setSaving(true)
    try {
      await updateProfessionalTagOption(editingTag.id, { name: editName.trim() })
      toast({ title: 'Tag atualizada com sucesso' })
      setEditOpen(false)
      setEditingTag(null)
    } catch {
      toast({ title: 'Erro ao atualizar tag', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (tag: ProfessionalTagOption) => {
    try {
      await updateProfessionalTagOption(tag.id, { active: !tag.active })
    } catch {
      toast({ title: 'Erro ao atualizar tag', variant: 'destructive' })
    }
  }

  const handleDelete = async (tag: ProfessionalTagOption) => {
    if (!confirm(`Excluir a tag "${tag.name}"?`)) return
    try {
      await deleteProfessionalTagOption(tag.id)
      toast({ title: 'Tag excluída' })
    } catch {
      toast({ title: 'Erro ao excluir tag', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Tags Profissionais</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie as opções de perfil profissional exibidas no cadastro e perfil do usuário.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 w-4 h-4" /> Nova Tag
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-800">{tag.name}</span>
                  {!tag.active && <span className="text-xs text-red-500 font-medium">Inativa</span>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {tag.active ? 'Ativa' : 'Inativa'}
                    </span>
                    <Switch checked={tag.active} onCheckedChange={() => handleToggle(tag)} />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Editar"
                    onClick={() => handleEditOpen(tag)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    title="Excluir"
                    onClick={() => handleDelete(tag)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {tags.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Nenhuma tag cadastrada.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tag Profissional</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div>
              <Label>Nome da Tag *</Label>
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ex: Técnico em Segurança"
              />
            </div>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}Criar Tag
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tag</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4 pt-4">
            <div>
              <Label>Nome da Tag *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome da tag"
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}Salvar Alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Edit, BookOpen, Loader2, Star } from 'lucide-react'
import { getMagazines, createMagazine, updateMagazine, deleteMagazine } from '@/services/magazines'
import { MagazineTabs } from '@/components/admin/MagazineTabs'
import { Magazine } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'

export default function AdminMagazines() {
  const [mags, setMags] = useState<Magazine[]>([])
  const [open, setOpen] = useState(false)
  const [editingMag, setEditingMag] = useState<Magazine | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const { toast } = useToast()

  const load = () => getMagazines().then(setMags)
  useEffect(() => {
    load()
  }, [])

  useRealtime('magazines', () => {
    load()
  })

  const handleOpenNew = () => {
    setEditingMag(null)
    setIsFeatured(false)
    setOpen(true)
  }

  const handleOpenEdit = (m: Magazine) => {
    setEditingMag(m)
    setIsFeatured(!!m.is_featured)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData(e.currentTarget)

    const file = form.get('thumbnail') as File
    if (!file || file.size === 0) {
      form.delete('thumbnail')
    }

    form.set('is_featured', isFeatured ? 'true' : 'false')

    try {
      if (editingMag) {
        await updateMagazine(editingMag.id, form)
        toast({ title: 'Revista atualizada com sucesso' })
      } else {
        await createMagazine(form)
        toast({ title: 'Revista adicionada com sucesso' })
      }
      setOpen(false)
    } catch (err) {
      toast({ title: 'Erro ao salvar revista', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Revistas (FlipHTML5)</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie as revistas e defina a Revista do Mês.
          </p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="mr-2 w-4 h-4" /> Nova Revista
        </Button>
      </div>

      <MagazineTabs />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMag ? 'Editar Revista' : 'Cadastrar Revista'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input name="title" required defaultValue={editingMag?.title} />
            </div>
            <div>
              <Label>Resumo</Label>
              <Input name="summary" defaultValue={editingMag?.summary} />
            </div>
            <div>
              <Label>Link FlipHTML5</Label>
              <Input
                name="fliphtml5_link"
                type="url"
                required
                defaultValue={editingMag?.fliphtml5_link}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2 pb-2">
              <Switch id="is_featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
              <Label htmlFor="is_featured">Destacar como Revista do Mês na Home</Label>
            </div>
            <div>
              <Label>Capa (Opcional)</Label>
              <Input name="thumbnail" type="file" accept="image/*" />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe em branco para buscar automaticamente.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0 divide-y">
          {mags.map((m) => (
            <div key={m.id} className="flex justify-between items-center p-4 hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {m.thumbnail ? (
                    <img
                      src={pb.files.getUrl(m, m.thumbnail, { thumb: '100x100' })}
                      alt={m.title}
                      className="w-16 h-20 object-cover rounded shadow-sm border"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-slate-100 rounded border flex items-center justify-center text-slate-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  )}
                  {m.is_featured && (
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white shadow-md"
                      title="Revista do Mês"
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-800">{m.title}</p>
                  <a
                    href={m.fliphtml5_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {m.fliphtml5_link}
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(m)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    if (confirm('Deseja realmente excluir esta revista?')) {
                      await deleteMagazine(m.id)
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {mags.length === 0 && (
            <div className="p-8 text-center text-slate-500">Nenhuma revista cadastrada.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

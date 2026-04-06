import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, Edit } from 'lucide-react'
import { getMagazines, createMagazine, updateMagazine, deleteMagazine } from '@/services/magazines'
import { Magazine } from '@/types'
import { toast } from '@/hooks/use-toast'
import { MagazineTabs } from '@/components/admin/MagazineTabs'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function AdminMagazines() {
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Magazine | null>(null)

  const load = () => getMagazines().then(setMagazines)
  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      if (editing) {
        await updateMagazine(editing.id, form)
        toast({ title: 'Revista atualizada' })
      } else {
        await createMagazine(form)
        toast({ title: 'Revista publicada' })
      }
      setOpen(false)
      setEditing(null)
      load()
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary mb-4">Revistas SST</h2>
          <MagazineTabs />
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) setEditing(null)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" /> Nova Revista
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Revista' : 'Publicar Revista'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input name="title" defaultValue={editing?.title} required />
              </div>
              <div>
                <Label>Resumo</Label>
                <Textarea name="summary" defaultValue={editing?.summary} required />
              </div>
              <div>
                <Label>Link FlipHTML5 (Opcional)</Label>
                <Input
                  name="fliphtml5_link"
                  type="url"
                  defaultValue={editing?.fliphtml5_link}
                  placeholder="https://online.fliphtml5.com/..."
                />
              </div>
              <div>
                <Label>Código de Incorporação (Embed HTML)</Label>
                <Textarea
                  name="embed_code"
                  defaultValue={editing?.embed_code}
                  placeholder="<iframe src='...' ></iframe>"
                  className="font-mono text-xs min-h-[100px]"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Se fornecido, substituirá o link do FlipHTML5 na visualização.
                </p>
              </div>
              <div>
                <Label>Capa (Opcional para edição)</Label>
                <Input name="thumbnail" type="file" accept="image/*" />
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {magazines.map((m) => (
            <div key={m.id} className="flex justify-between items-center p-4 hover:bg-slate-50">
              <div>
                <p className="font-bold flex items-center gap-2">
                  {m.title}
                  {m.embed_code && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Embed
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{m.fliphtml5_link || 'Sem link externo'}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(m)
                    setOpen(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600"
                  onClick={async () => {
                    if (confirm('Tem certeza que deseja excluir esta revista?')) {
                      await deleteMagazine(m.id)
                      load()
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {magazines.length === 0 && (
            <div className="p-8 text-center text-slate-500">Nenhuma revista cadastrada.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

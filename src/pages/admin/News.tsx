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
import { getNews, createNews, updateNews, deleteNews } from '@/services/news'
import { News } from '@/types'
import { toast } from '@/hooks/use-toast'

export default function AdminNews() {
  const [news, setNews] = useState<News[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<News | null>(null)

  const load = () => getNews().then(setNews)
  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      if (editing) await updateNews(editing.id, form)
      else await createNews(form)
      toast({ title: editing ? 'Notícia atualizada' : 'Notícia publicada' })
      setOpen(false)
      setEditing(null)
      load()
    } catch (err) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold text-secondary">Notícias</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) setEditing(null)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" /> Nova Notícia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Notícia' : 'Publicar Notícia'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input name="title" defaultValue={editing?.title} required />
              </div>
              <div>
                <Label>Conteúdo (HTML suportado)</Label>
                <Textarea
                  name="content"
                  defaultValue={editing?.content}
                  required
                  className="min-h-[150px]"
                />
              </div>
              <div>
                <Label>Imagens (Suporta múltiplas)</Label>
                <Input name="images" type="file" accept="image/*" multiple />
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
          {news.map((n) => (
            <div key={n.id} className="flex justify-between items-center p-4 hover:bg-slate-50">
              <div>
                <p className="font-bold">{n.title}</p>
                <p className="text-xs text-slate-500">{new Date(n.created).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(n)
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
                    await deleteNews(n.id)
                    load()
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {news.length === 0 && (
            <div className="p-4 text-center text-slate-500">Nenhuma notícia cadastrada.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

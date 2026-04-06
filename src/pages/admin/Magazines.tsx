import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import { getMagazines, createMagazine, deleteMagazine } from '@/services/magazines'
import { Magazine } from '@/types'
import { toast } from '@/hooks/use-toast'
import { MagazineTabs } from '@/components/admin/MagazineTabs'

export default function AdminMagazines() {
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [open, setOpen] = useState(false)

  const load = () => getMagazines().then(setMagazines)
  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      await createMagazine(form)
      toast({ title: 'Revista publicada' })
      setOpen(false)
      load()
    } catch (err) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary mb-4">Revistas SST</h2>
          <MagazineTabs />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" /> Nova Revista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publicar Revista</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input name="title" required />
              </div>
              <div>
                <Label>Resumo</Label>
                <Input name="summary" required />
              </div>
              <div>
                <Label>Link FlipHTML5</Label>
                <Input
                  name="fliphtml5_link"
                  type="url"
                  placeholder="https://online.fliphtml5.com/..."
                  required
                />
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
                <p className="font-bold">{m.title}</p>
                <p className="text-xs text-slate-500">{m.fliphtml5_link}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600"
                onClick={async () => {
                  await deleteMagazine(m.id)
                  load()
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
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

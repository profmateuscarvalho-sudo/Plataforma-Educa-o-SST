import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Edit } from 'lucide-react'
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/services/announcements'
import { PlatformAnnouncement } from '@/types'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const TYPES = ['Texto Customizado', 'Novo Curso', 'Documentário', 'Mentoria', 'Aula Ao Vivo']

export default function AdminAnnouncements() {
  const [items, setItems] = useState<PlatformAnnouncement[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PlatformAnnouncement | null>(null)
  const [active, setActive] = useState(false)
  const [type, setType] = useState('Texto Customizado')

  const load = () => getAllAnnouncements().then(setItems)
  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      title: fd.get('title') as string,
      content: fd.get('content') as string,
      type,
      reference_id: fd.get('reference_id') as string,
      active,
      priority: Number(fd.get('priority')) || 0,
    }
    try {
      if (editing) await updateAnnouncement(editing.id, data)
      else await createAnnouncement(data)
      toast({ title: 'Aviso salvo' })
      setOpen(false)
      setEditing(null)
      load()
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Quadro de Avisos</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie avisos exibidos no dashboard dos alunos.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) setEditing(null)
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setActive(true)
                setType('Texto Customizado')
              }}
            >
              <Plus className="mr-2 w-4 h-4" /> Novo Aviso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Aviso' : 'Novo Aviso'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input name="title" defaultValue={editing?.title} required />
              </div>
              <div>
                <Label>Conteúdo</Label>
                <RichTextEditor name="content" defaultValue={editing?.content} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Input name="priority" type="number" defaultValue={editing?.priority ?? 0} />
                </div>
              </div>
              <div>
                <Label>ID de Referência (opcional)</Label>
                <Input
                  name="reference_id"
                  defaultValue={editing?.reference_id}
                  placeholder="ID do curso, documentário, etc."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ann_active" checked={active} onCheckedChange={setActive} />
                <Label htmlFor="ann_active">Ativo</Label>
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.active ? 'Sim' : 'Não'}</TableCell>
                  <TableCell>{a.priority ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(a)
                        setActive(a.active)
                        setType(a.type)
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
                        await deleteAnnouncement(a.id)
                        load()
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum aviso cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

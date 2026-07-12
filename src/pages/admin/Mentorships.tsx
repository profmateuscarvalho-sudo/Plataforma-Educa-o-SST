import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Edit, Send } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  getMentorships,
  createMentorship,
  updateMentorship,
  deleteMentorship,
} from '@/services/mentorships'
import { Mentorship } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

export default function AdminMentorships() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Mentorship | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isFree, setIsFree] = useState(false)
  const { toast } = useToast()

  const load = () => getMentorships().then(setMentorships).catch(console.error)
  useEffect(() => {
    load()
  }, [])

  useRealtime('mentorships', () => {
    load()
  })

  const handleOpenNew = () => {
    setEditingItem(null)
    setFieldErrors({})
    setIsFree(false)
    setOpen(true)
  }

  const handleOpenEdit = (m: Mentorship) => {
    setEditingItem(m)
    setFieldErrors({})
    setIsFree(m.is_free || false)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries()) as Partial<Mentorship>
    data.is_free = isFree

    try {
      if (editingItem) {
        await updateMentorship(editingItem.id, data)
        toast({ title: 'Mentoria atualizada com sucesso' })
      } else {
        await createMentorship(data)
        toast({ title: 'Mentoria criada com sucesso' })
      }
      setOpen(false)
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar mentoria', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta mentoria?')) {
      try {
        await deleteMentorship(id)
        toast({ title: 'Mentoria excluída' })
      } catch (err) {
        toast({ title: 'Erro ao excluir', variant: 'destructive' })
      }
    }
  }

  const handleSendLink = (name: string) => {
    toast({
      title: 'Link Enviado!',
      description: `O link de agendamento foi enviado para ${name}.`,
    })
  }

  const mockParticipants = [
    { id: 1, name: 'Ana Oliveira', email: 'ana@example.com', status: 'Aguardando Link' },
    { id: 2, name: 'Carlos Santos', email: 'carlos@example.com', status: 'Link Enviado' },
  ]

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Título do Programa *</Label>
          <Input name="title" defaultValue={editingItem?.title} required />
          {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
        </div>
        <div>
          <Label>Nome do Mentor *</Label>
          <Input name="mentor_name" defaultValue={editingItem?.mentor_name} required />
          {fieldErrors.mentor_name && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.mentor_name}</p>
          )}
        </div>
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea name="description" defaultValue={editingItem?.description} className="h-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Preço (R$)</Label>
          <Input
            name="price"
            type="number"
            step="0.01"
            defaultValue={editingItem?.price}
            required
          />
        </div>
        <div>
          <Label>Link Privado (Zoom, Meet, etc)</Label>
          <Input
            name="scheduling_link"
            type="url"
            defaultValue={editingItem?.scheduling_link}
            placeholder="https://"
          />
        </div>
      </div>
      <div>
        <Label>Horários Disponíveis</Label>
        <Textarea
          name="available_dates"
          defaultValue={editingItem?.available_dates}
          placeholder="Ex: Segundas às 14h, Quartas às 10h..."
          className="h-20"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="ment_is_free" checked={isFree} onCheckedChange={setIsFree} />
        <Label htmlFor="ment_is_free">Acesso Gratuito</Label>
      </div>
      <Button type="submit" className="w-full">
        {editingItem ? 'Salvar Alterações' : 'Criar Mentoria'}
      </Button>
    </form>
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Mentorias</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie programas de mentoria, disponibilidade de mentores e links de sessões.
          </p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="mr-2 w-4 h-4" /> Nova Mentoria
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentorships.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.title}</TableCell>
                  <TableCell>{m.mentor_name}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      m.price || 0,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(m)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mentorships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhuma mentoria cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Mentoria' : 'Nova Mentoria'}</DialogTitle>
          </DialogHeader>

          {editingItem ? (
            <Tabs defaultValue="details" className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Detalhes do Programa</TabsTrigger>
                <TabsTrigger value="confirmations">Confirmações</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <FormContent />
              </TabsContent>
              <TabsContent value="confirmations" className="space-y-4">
                <div className="text-sm text-slate-500 mb-4">
                  Lista de alunos que adquiriram esta mentoria. Envie o link da sala privada para os
                  participantes confirmados.
                </div>
                <div className="rounded-md border divide-y">
                  {mockParticipants.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50">
                      <div>
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.email}</p>
                        <p className="text-xs text-primary mt-1 font-medium">{p.status}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleSendLink(p.name)}>
                        <Send className="w-3 h-3 mr-2" /> Enviar Link
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <FormContent />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

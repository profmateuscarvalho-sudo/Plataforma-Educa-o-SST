import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit, Copy, Loader2 } from 'lucide-react'
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/services/events'
import { PlatformEvent } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

// Helper to format ISO date to local input datetime-local string
const formatForInput = (isoString?: string) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminEvents() {
  const [events, setEvents] = useState<PlatformEvent[]>([])
  const [open, setOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<PlatformEvent | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [selectedType, setSelectedType] = useState<string>('Workshop')
  const { toast } = useToast()

  const load = () => getEvents().then(setEvents).catch(console.error)
  useEffect(() => {
    load()
  }, [])

  useRealtime('events', () => {
    load()
  })

  const handleOpenNew = () => {
    setEditingEvent(null)
    setSelectedType('Workshop')
    setFieldErrors({})
    setOpen(true)
  }

  const handleOpenEdit = (evt: PlatformEvent) => {
    setEditingEvent(evt)
    setSelectedType(evt.type)
    setFieldErrors({})
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})

    const form = new FormData(e.currentTarget)

    const file = form.get('thumbnail') as File
    if (!file || file.size === 0) {
      form.delete('thumbnail')
    }

    const dateVal = form.get('date')
    if (dateVal) {
      form.set('date', new Date(dateVal as string).toISOString())
    }

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, form)
        toast({ title: 'Evento atualizado com sucesso' })
      } else {
        await createEvent(form)
        toast({ title: 'Evento adicionado com sucesso' })
      }
      setOpen(false)
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar evento', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/eventos/${id}`
    navigator.clipboard.writeText(url)
    toast({
      title: 'Link copiado!',
      description: 'URL de venda copiada para a área de transferência.',
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Eventos e Workshops</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie aulas online, presenciais e workshops. Compartilhe o link de venda com
            interessados.
          </p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="mr-2 w-4 h-4" /> Novo Evento
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell className="font-medium">{evt.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700">
                      {evt.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(evt.date).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      evt.price,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Copiar Link de Venda"
                      onClick={() => copyLink(evt.id)}
                    >
                      <Copy className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(evt)}>
                      <Edit className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        if (confirm('Deseja realmente excluir este evento?')) {
                          await deleteEvent(evt.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum evento cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Evento' : 'Cadastrar Evento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título *</Label>
                <Input name="title" required defaultValue={editingEvent?.title} />
                {fieldErrors.title && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
                )}
              </div>
              <div>
                <Label>Tipo de Evento *</Label>
                <Select name="type" value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Aula Online">Aula Online</SelectItem>
                    <SelectItem value="Aula Presencial">Aula Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descrição *</Label>
              <Textarea
                name="description"
                required
                defaultValue={editingEvent?.description}
                className="h-24"
              />
              {fieldErrors.description && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Data e Hora *</Label>
                <Input
                  name="date"
                  type="datetime-local"
                  required
                  defaultValue={formatForInput(editingEvent?.date)}
                />
                {fieldErrors.date && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.date}</p>
                )}
              </div>
              <div>
                <Label>Preço (R$) *</Label>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editingEvent?.price}
                />
                {fieldErrors.price && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.price}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedType === 'Aula Presencial' || selectedType === 'Workshop') && (
                <div className="col-span-1 md:col-span-2">
                  <Label>Localização (Endereço)</Label>
                  <Input
                    name="location"
                    defaultValue={editingEvent?.location}
                    placeholder="Ex: Av. Paulista, 1000 - SP"
                  />
                </div>
              )}

              {(selectedType === 'Aula Online' || selectedType === 'Workshop') && (
                <div className="col-span-1 md:col-span-2">
                  <Label>Link da Transmissão (Meet, Zoom)</Label>
                  <Input
                    name="meeting_link"
                    type="url"
                    defaultValue={editingEvent?.meeting_link}
                    placeholder="https://"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este link não será visível publicamente na página de vendas.
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>Capa (Thumbnail)</Label>
              <Input name="thumbnail" type="file" accept="image/*" />
              {fieldErrors.thumbnail && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.thumbnail}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Evento
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

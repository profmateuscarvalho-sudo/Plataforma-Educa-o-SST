import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
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
import { Plus, Trash2, Edit, Calendar, Clock } from 'lucide-react'
import {
  getMentorships,
  createMentorship,
  updateMentorship,
  deleteMentorship,
} from '@/services/mentorships'
import { getMentors } from '@/services/mentors'
import { Mentorship, Mentor, AvailableSlot } from '@/types'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'

const parseSlots = (slots: any): AvailableSlot[] => {
  if (Array.isArray(slots)) return slots
  if (typeof slots === 'string') {
    try {
      const p = JSON.parse(slots)
      if (Array.isArray(p)) return p
    } catch {
      /* intentionally ignored */
    }
  }
  return []
}

export default function AdminMentorships() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Mentorship | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isFree, setIsFree] = useState(false)
  const [mentorId, setMentorId] = useState('')
  const [slots, setSlots] = useState<AvailableSlot[]>([])

  const load = () => getMentorships().then(setMentorships).catch(console.error)
  useEffect(() => {
    load()
    getMentors().then(setMentors).catch(console.error)
  }, [])
  useRealtime('mentorships', () => {
    load()
  })

  const handleOpenNew = () => {
    setEditing(null)
    setFieldErrors({})
    setIsFree(false)
    setMentorId('')
    setSlots([])
    setOpen(true)
  }

  const handleOpenEdit = (m: Mentorship) => {
    setEditing(m)
    setFieldErrors({})
    setIsFree(m.is_free || false)
    setMentorId(m.mentor || '')
    setSlots(parseSlots(m.available_slots))
    setOpen(true)
  }

  const addSlot = () => setSlots([...slots, { date: '', time: '' }])
  const removeSlot = (i: number) => setSlots(slots.filter((_, idx) => idx !== i))
  const updateSlot = (i: number, field: keyof AvailableSlot, val: string) =>
    setSlots(slots.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)))

  const selectedMentor = mentors.find((m) => m.id === mentorId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})
    const fd = new FormData(e.currentTarget)
    const data: Record<string, any> = {
      title: fd.get('title'),
      description: fd.get('description'),
      price: Number(fd.get('price')),
      scheduling_link: fd.get('scheduling_link'),
      is_free: isFree,
      mentor_name: selectedMentor?.name || fd.get('mentor_name'),
      available_slots: slots.filter((s) => s.date && s.time),
      mentor: mentorId || null,
    }
    try {
      if (editing) {
        await updateMentorship(editing.id, data)
        toast({ title: 'Mentoria atualizada' })
      } else {
        await createMentorship(data)
        toast({ title: 'Mentoria criada' })
      }
      setOpen(false)
      load()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta mentoria?')) return
    try {
      await deleteMentorship(id)
      toast({ title: 'Mentoria excluída' })
      load()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Mentorias</h2>
          <p className="text-muted-foreground mt-1">Gerencie programas de mentoria e horários.</p>
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
                  <TableCell>{m.expand?.mentor?.name || m.mentor_name}</TableCell>
                  <TableCell>
                    {m.is_free
                      ? 'Gratuito'
                      : new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(m.price || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(m)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
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

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Mentoria' : 'Nova Mentoria'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="mentor">Mentor</TabsTrigger>
              <TabsTrigger value="schedule">Horários</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <form id="ment-form" onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <Label>Título *</Label>
                  <Input name="title" defaultValue={editing?.title} required />
                  {fieldErrors.title && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
                  )}
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    name="description"
                    defaultValue={editing?.description}
                    className="h-24"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Preço (R$)</Label>
                    <Input
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={editing?.price}
                      required
                    />
                  </div>
                  <div>
                    <Label>Link Privado</Label>
                    <Input
                      name="scheduling_link"
                      type="url"
                      defaultValue={editing?.scheduling_link}
                      placeholder="https://"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="ment_free" checked={isFree} onCheckedChange={setIsFree} />
                  <Label htmlFor="ment_free">Acesso Gratuito</Label>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  O link de agendamento só será enviado após confirmação de pagamento.
                </p>
                <Button type="submit" className="w-full">
                  {editing ? 'Salvar' : 'Criar Mentoria'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="mentor" className="space-y-4 pt-2">
              <div>
                <Label>Selecionar Mentor</Label>
                <Select value={mentorId} onValueChange={setMentorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} — {m.topics}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedMentor && (
                <div className="p-4 bg-slate-50 rounded-lg border space-y-2">
                  <p className="font-bold text-secondary">{selectedMentor.name}</p>
                  <p className="text-sm text-slate-500">{selectedMentor.topics}</p>
                  <div
                    className="text-sm text-slate-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedMentor.mini_cv }}
                  />
                </div>
              )}
              <div>
                <Label>Nome do Mentor (manual) *</Label>
                <Input name="mentor_name" defaultValue={editing?.mentor_name} required />
                {fieldErrors.mentor_name && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.mentor_name}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 pt-2">
              <p className="text-sm text-slate-500">
                Adicione os horários disponíveis para agendamento.
              </p>
              {slots.map((slot, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Data
                    </Label>
                    <Input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateSlot(i, 'date', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>
                      <Clock className="w-3 h-3 inline mr-1" />
                      Hora
                    </Label>
                    <Input
                      type="time"
                      value={slot.time}
                      onChange={(e) => updateSlot(i, 'time', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    onClick={() => removeSlot(i)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Horário
              </Button>
              {slots.length > 0 && (
                <p className="text-xs text-slate-500">
                  {slots.filter((s) => s.date && s.time).length} horário(s) definido(s).
                </p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

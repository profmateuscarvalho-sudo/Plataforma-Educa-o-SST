import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { createEvent, updateEvent } from '@/services/events'
import { PlatformEvent } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

const formatForInput = (isoString?: string) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EventFormModal({
  open,
  setOpen,
  editingEvent,
  onSuccess,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  editingEvent: PlatformEvent | null
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [selectedType, setSelectedType] = useState<string>('Workshop')
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setFieldErrors({})
      setSelectedType(editingEvent?.type || 'Workshop')
    }
  }, [open, editingEvent])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})
    const form = new FormData(e.currentTarget)

    const file = form.get('thumbnail') as File
    if (!file || file.size === 0) form.delete('thumbnail')

    const dateVal = form.get('date')
    const endDateVal = form.get('end_date')

    if (dateVal) {
      const start = new Date(dateVal as string)
      form.set('date', start.toISOString())

      if (endDateVal) {
        const end = new Date(endDateVal as string)
        if (end <= start) {
          setFieldErrors({ end_date: 'A data de término deve ser posterior à data de início.' })
          setIsSubmitting(false)
          return
        }
        form.set('end_date', end.toISOString())
      }
    }

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, form)
        toast({ title: 'Evento atualizado com sucesso' })
      } else {
        await createEvent(form)
        toast({ title: 'Evento adicionado com sucesso' })
      }
      onSuccess()
      setOpen(false)
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar evento', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Início *</Label>
              <Input
                name="date"
                type="datetime-local"
                required
                defaultValue={formatForInput(editingEvent?.date)}
              />
              {fieldErrors.date && <p className="text-xs text-red-500 mt-1">{fieldErrors.date}</p>}
            </div>
            <div>
              <Label>Término (Opcional)</Label>
              <Input
                name="end_date"
                type="datetime-local"
                defaultValue={formatForInput(editingEvent?.end_date)}
              />
              {fieldErrors.end_date && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.end_date}</p>
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
                <Input name="location" defaultValue={editingEvent?.location} />
              </div>
            )}
            {(selectedType === 'Aula Online' || selectedType === 'Workshop') && (
              <div className="col-span-1 md:col-span-2">
                <Label>Link da Transmissão (Meet, Zoom)</Label>
                <Input name="meeting_link" type="url" defaultValue={editingEvent?.meeting_link} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Capa (Thumbnail)</Label>
              <Input name="thumbnail" type="file" accept="image/*" />
              {fieldErrors.thumbnail && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.thumbnail}</p>
              )}
            </div>
            <div>
              <Label>ID do Vídeo (Panda Video)</Label>
              <Input
                name="panda_video_id"
                defaultValue={editingEvent?.panda_video_id}
                placeholder="ID ou URL de embed (Opcional)"
              />
              {fieldErrors.panda_video_id && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.panda_video_id}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Evento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

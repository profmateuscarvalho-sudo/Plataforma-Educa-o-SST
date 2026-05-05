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
  const [isWorkshop, setIsWorkshop] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setFieldErrors({})
      setSelectedType(editingEvent?.type || 'Workshop')
      setIsWorkshop(!!editingEvent?.is_workshop)
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

    form.set('is_workshop', isWorkshop.toString())
    if (isWorkshop) {
      const spk = ((form.get('speakers_raw') as string) || '')
        .split('\n')
        .filter(Boolean)
        .map((l) => {
          const parts = l.split('|')
          return {
            name: parts[0]?.trim() || '',
            topic: parts[1]?.trim() || '',
            bio: parts[2]?.trim() || '',
          }
        })
      form.set('speakers', JSON.stringify(spk))
      form.delete('speakers_raw')

      const tiers = ((form.get('tiers_raw') as string) || '')
        .split('\n')
        .filter(Boolean)
        .map((l) => {
          const parts = l.split('|')
          return {
            name: parts[0]?.trim() || '',
            price: Number(parts[1]) || 0,
            benefits: (parts[2] || '').split(',').map((b) => b.trim()),
          }
        })
      form.set('sponsorship_tiers', JSON.stringify(tiers))
      form.delete('tiers_raw')

      const struct = ((form.get('structure_raw') as string) || '')
        .split('\n')
        .filter(Boolean)
        .map((l) => l.trim())
      form.set('structure', JSON.stringify(struct))
      form.delete('structure_raw')

      const obj = ((form.get('objectives_raw') as string) || '')
        .split('\n')
        .filter(Boolean)
        .map((l) => l.trim())
      form.set('objectives', JSON.stringify(obj))
      form.delete('objectives_raw')
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

          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="is_workshop"
                checked={isWorkshop}
                onChange={(e) => setIsWorkshop(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="is_workshop" className="font-semibold text-base">
                Habilitar Funcionalidades de Workshop Avançado
              </Label>
            </div>

            {isWorkshop && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <Label>Valor do Patrocínio (R$)</Label>
                  <Input
                    name="sponsorship_value"
                    type="number"
                    step="0.01"
                    defaultValue={editingEvent?.sponsorship_value}
                  />
                </div>
                <div>
                  <Label>Palestrantes (Um por linha, formato: Nome | Tópico | Mini Bio)</Label>
                  <Textarea
                    name="speakers_raw"
                    defaultValue={editingEvent?.speakers
                      ?.map((s) => `${s.name} | ${s.topic} | ${s.bio || ''}`)
                      .join('\n')}
                    placeholder="Ex: Mateus | Espiritualidade | Especialista em SST..."
                  />
                </div>
                <div>
                  <Label>
                    Cotas de Patrocínio (Um por linha, formato: Nome | Valor | Benefícios separados
                    por vírgula)
                  </Label>
                  <Textarea
                    name="tiers_raw"
                    defaultValue={editingEvent?.sponsorship_tiers
                      ?.map((t) => `${t.name} | ${t.price} | ${t.benefits.join(', ')}`)
                      .join('\n')}
                    placeholder="Ex: Ouro | 10000 | Logo no banner, Menção honrosa"
                  />
                </div>
                <div>
                  <Label>Estrutura do Evento (Um por linha)</Label>
                  <Textarea
                    name="structure_raw"
                    defaultValue={editingEvent?.structure?.join('\n')}
                    placeholder="Ex: Café da manhã&#10;Palestras&#10;Encerramento"
                  />
                </div>
                <div>
                  <Label>Objetivos (Um por linha)</Label>
                  <Textarea
                    name="objectives_raw"
                    defaultValue={editingEvent?.objectives?.join('\n')}
                    placeholder="Ex: Promover networking&#10;Discutir saúde mental"
                  />
                </div>
                <div>
                  <Label>Importância HWAW / Descrição do Patrocínio</Label>
                  <Textarea
                    name="importance"
                    className="h-24"
                    defaultValue={editingEvent?.importance}
                    placeholder="Texto detalhando a importância do evento para potenciais patrocinadores."
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Evento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

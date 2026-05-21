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
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { createEvent, updateEvent } from '@/services/events'
import { PlatformEvent } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

const getSpeakerPhotoUrl = (event: PlatformEvent, index: number) => {
  if (!event.speaker_photos || event.speaker_photos.length === 0) return null
  const prefix = `speaker_${index}_`
  const photos = event.speaker_photos.filter((p) => p.startsWith(prefix))
  if (photos.length === 0) return null
  const latestPhoto = photos[photos.length - 1]
  return pb.files.getUrl(event, latestPhoto)
}

const formatForInput = (isoString?: string) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type SpeakerForm = {
  name: string
  topic: string
  bio: string
  photo: string
  photoFile?: File
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
  const [speakers, setSpeakers] = useState<SpeakerForm[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setFieldErrors({})
      setSelectedType(editingEvent?.type || 'Workshop')
      setIsWorkshop(!!editingEvent?.is_workshop)
      setSpeakers(
        editingEvent?.speakers?.map((s) => ({
          name: s.name || '',
          topic: s.topic || '',
          bio: s.bio || '',
          photo: s.photo || '',
        })) || [],
      )
    }
  }, [open, editingEvent])

  const handleAddSpeaker = () =>
    setSpeakers([...speakers, { name: '', topic: '', bio: '', photo: '' }])
  const handleRemoveSpeaker = (index: number) => setSpeakers(speakers.filter((_, i) => i !== index))

  const handleSpeakerChange = (index: number, field: keyof SpeakerForm, value: string) => {
    const newSpeakers = [...speakers]
    newSpeakers[index][field] = value
    setSpeakers(newSpeakers)
  }

  const handleSpeakerPhoto = (index: number, file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const newSpeakers = [...speakers]
      newSpeakers[index].photo = e.target?.result as string
      newSpeakers[index].photoFile = file
      setSpeakers(newSpeakers)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFieldErrors({})
    const form = new FormData(e.currentTarget)

    const dateVal = form.get('date') as string
    const endDateVal = form.get('end_date') as string

    let finalDate = null
    let finalEndDate = null

    if (dateVal) {
      const start = new Date(dateVal)
      finalDate = start.toISOString()

      if (endDateVal) {
        const end = new Date(endDateVal)
        if (end <= start) {
          setFieldErrors({ end_date: 'A data de término deve ser posterior à data de início.' })
          setIsSubmitting(false)
          return
        }
        finalEndDate = end.toISOString()
      }
    }

    const struct = ((form.get('structure_raw') as string) || '')
      .split('\n')
      .filter(Boolean)
      .map((l) => l.trim())

    const obj = ((form.get('objectives_raw') as string) || '')
      .split('\n')
      .filter(Boolean)
      .map((l) => l.trim())

    const formData = new FormData()

    formData.append('title', form.get('title') as string)
    if (form.get('subtitle')) formData.append('subtitle', form.get('subtitle') as string)

    formData.append('type', selectedType)
    formData.append('description', form.get('description') as string)

    if (finalDate) formData.append('date', finalDate)

    if (finalEndDate) {
      formData.append('end_date', finalEndDate)
    } else {
      formData.append('end_date', 'null')
    }

    const price = form.get('price')
    if (price) {
      formData.append('price', price as string)
    } else {
      formData.append('price', 'null')
    }

    if (form.get('location')) formData.append('location', form.get('location') as string)
    else formData.append('location', '')

    if (form.get('meeting_link'))
      formData.append('meeting_link', form.get('meeting_link') as string)
    else formData.append('meeting_link', '')

    formData.append('structure', JSON.stringify(struct))
    formData.append('objectives', JSON.stringify(obj))
    formData.append('is_workshop', isWorkshop ? 'true' : 'false')

    if (isWorkshop) {
      const sponsorshipValue = form.get('sponsorship_value')
      if (sponsorshipValue) {
        formData.append('sponsorship_value', sponsorshipValue as string)
      } else {
        formData.append('sponsorship_value', 'null')
      }

      if (form.get('importance')) formData.append('importance', form.get('importance') as string)
      else formData.append('importance', '')

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
      formData.append('sponsorship_tiers', JSON.stringify(tiers))
    } else {
      formData.append('importance', '')
      formData.append('sponsorship_tiers', JSON.stringify([]))
    }

    const file = form.get('thumbnail') as File
    if (file && file.size > 0) {
      formData.append('thumbnail', file)
    }

    const logos = form.getAll('partner_logos') as File[]
    const validLogos = logos.filter((l) => l.size > 0)

    if (
      validLogos.length > 0 ||
      (editingEvent?.partner_logos && editingEvent.partner_logos.length > 0)
    ) {
      const existingLogos = editingEvent?.partner_logos || []
      existingLogos.forEach((logo) => formData.append('partner_logos', logo))
      validLogos.forEach((logo) => formData.append('partner_logos', logo))
    }

    const speakerPhotosArray: File[] = []
    const speakersJson = speakers.map((spk, idx) => {
      let photoRef = spk.photo
      if (spk.photoFile) {
        const ext = spk.photoFile.name.split('.').pop()
        const newName = `speaker_${idx}_${Date.now()}.${ext}`
        const renamedFile = new File([spk.photoFile], newName, { type: spk.photoFile.type })
        speakerPhotosArray.push(renamedFile)
        photoRef = ''
      }
      return {
        name: spk.name,
        topic: spk.topic,
        bio: spk.bio,
        photo: photoRef,
      }
    })

    formData.append('speakers', JSON.stringify(speakersJson))

    if (
      speakerPhotosArray.length > 0 ||
      (editingEvent?.speaker_photos && editingEvent.speaker_photos.length > 0)
    ) {
      const existingSpeakerPhotos = editingEvent?.speaker_photos || []
      existingSpeakerPhotos.forEach((photo) => formData.append('speaker_photos', photo))
      speakerPhotosArray.forEach((photo) => formData.append('speaker_photos', photo))
    }

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData)
        toast({ title: 'Evento atualizado com sucesso' })
      } else {
        await createEvent(formData)
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEvent ? 'Editar Evento' : 'Cadastrar Evento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
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
                  <SelectItem value="Summit">Summit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Subtítulo (Opcional)</Label>
            <Input
              name="subtitle"
              defaultValue={editingEvent?.subtitle}
              placeholder="Ex: Um mergulho profundo na Segurança do Trabalho"
            />
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
              <Label>Preço (R$ - Opcional)</Label>
              <Input name="price" type="number" step="0.01" defaultValue={editingEvent?.price} />
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
              {editingEvent?.thumbnail && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Capa Atual:</p>
                  <img
                    src={pb.files.getUrl(editingEvent, editingEvent.thumbnail)}
                    alt="Thumbnail"
                    className="h-20 rounded border object-cover"
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Logos de Parceiros (Opcional)</Label>
              <Input name="partner_logos" type="file" accept="image/*" multiple />
              <p className="text-xs text-muted-foreground mt-1">
                Selecione múltiplos arquivos para adicionar ao evento.
              </p>
              {editingEvent?.partner_logos && editingEvent.partner_logos.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Logos Atuais:</p>
                  <div className="flex gap-2 flex-wrap bg-slate-100 p-2 rounded border">
                    {editingEvent.partner_logos.map((logo, i) => (
                      <img
                        key={i}
                        src={pb.files.getUrl(editingEvent, logo)}
                        alt="Logo"
                        className="h-10 w-16 object-contain mix-blend-multiply"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Speakers Section */}
          <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Palestrantes / Especialistas</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSpeaker}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>
            {speakers.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum palestrante adicionado.</p>
            )}
            <div className="space-y-4">
              {speakers.map((spk, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 bg-white border rounded-md relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveSpeaker(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="sm:col-span-4">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      value={spk.name}
                      onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                      placeholder="Ex: Dr. João"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Label className="text-xs">Tópico/Cargo</Label>
                    <Input
                      value={spk.topic}
                      onChange={(e) => handleSpeakerChange(index, 'topic', e.target.value)}
                      placeholder="Ex: Higiene Ocupacional"
                    />
                  </div>
                  <div className="sm:col-span-4 flex gap-4 items-center">
                    <div className="flex-1">
                      <Label className="text-xs">Foto</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="text-xs h-9"
                        onChange={(e) => handleSpeakerPhoto(index, e.target.files?.[0] || null)}
                      />
                    </div>
                    {(spk.photo || (editingEvent && getSpeakerPhotoUrl(editingEvent, index))) && (
                      <img
                        src={spk.photo || getSpeakerPhotoUrl(editingEvent!, index)!}
                        alt="Preview"
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    )}
                  </div>
                  <div className="sm:col-span-12">
                    <Label className="text-xs">Mini Bio</Label>
                    <Textarea
                      value={spk.bio}
                      onChange={(e) => handleSpeakerChange(index, 'bio', e.target.value)}
                      placeholder="Breve currículo..."
                      className="h-16"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Cronograma (Um por linha)</Label>
              <Textarea
                name="structure_raw"
                defaultValue={editingEvent?.structure?.join('\n')}
                placeholder="Ex: 08:00 - Credenciamento&#10;09:00 - Abertura"
                className="h-32"
              />
            </div>
            <div>
              <Label>Objetivos (Um por linha)</Label>
              <Textarea
                name="objectives_raw"
                defaultValue={editingEvent?.objectives?.join('\n')}
                placeholder="Ex: Promover networking&#10;Discutir saúde mental"
                className="h-32"
              />
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
                Evento VIP (Habilitar Convites Individuais e Patrocínios)
              </Label>
            </div>

            {isWorkshop && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                <div>
                  <Label>Valor Total do Patrocínio Almejado (R$)</Label>
                  <Input
                    name="sponsorship_value"
                    type="number"
                    step="0.01"
                    defaultValue={editingEvent?.sponsorship_value}
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
                  <Label>Importância do Patrocínio / Pitch Comercial</Label>
                  <Textarea
                    name="importance"
                    className="h-24"
                    defaultValue={editingEvent?.importance}
                    placeholder="Texto detalhando por que patrocinar este evento é importante."
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

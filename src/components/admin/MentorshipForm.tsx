import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import { Mentorship } from '@/types'
import { FieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'

interface MentorshipFormProps {
  editing: Mentorship | null
  isFree: boolean
  setIsFree: (v: boolean) => void
  onSubmit: (fd: FormData) => Promise<void>
  fieldErrors: FieldErrors
}

const parseDates = (s?: string): Date[] => {
  if (!s) return []
  try {
    const arr = JSON.parse(s)
    if (Array.isArray(arr))
      return arr.map((d: string) => new Date(d)).filter((d: Date) => !isNaN(d.getTime()))
  } catch {
    /* fallthrough */
  }
  return s
    .split(',')
    .filter(Boolean)
    .map((d: string) => new Date(d.trim()))
    .filter((d: Date) => !isNaN(d.getTime()))
}

const formatDates = (dates: Date[]): string =>
  JSON.stringify(dates.map((d) => format(d, 'yyyy-MM-dd')))

export function MentorshipForm({
  editing,
  isFree,
  setIsFree,
  onSubmit,
  fieldErrors,
}: MentorshipFormProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>(parseDates(editing?.available_dates))

  useEffect(() => {
    setSelectedDates(parseDates(editing?.available_dates))
  }, [editing])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('is_free', String(isFree))
    fd.set('available_dates', formatDates(selectedDates))
    const photo = fd.get('mentor_photo') as File
    if (!photo?.size) fd.delete('mentor_photo')
    await onSubmit(fd)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Título do Programa *</Label>
          <Input name="title" defaultValue={editing?.title} required />
          {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
        </div>
        <div>
          <Label>Nome do Mentor *</Label>
          <Input name="mentor_name" defaultValue={editing?.mentor_name} required />
          {fieldErrors.mentor_name && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.mentor_name}</p>
          )}
        </div>
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea name="description" defaultValue={editing?.description} className="h-24" />
      </div>
      <div className="border-t pt-4 space-y-4">
        <p className="text-sm font-bold text-secondary">Perfil do Mentor</p>
        <div>
          <Label>Mini CV (Bio)</Label>
          <Textarea name="mentor_bio" defaultValue={editing?.mentor_bio} className="h-24" />
        </div>
        <div>
          <Label>Foto do Mentor</Label>
          <Input type="file" name="mentor_photo" accept="image/*" />
          {editing?.mentor_photo && (
            <img
              src={pb.files.getUrl(editing, editing.mentor_photo)}
              alt="Mentor"
              className="w-20 h-20 rounded-full object-cover mt-2"
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Preço (R$)</Label>
          <Input name="price" type="number" step="0.01" defaultValue={editing?.price} required />
        </div>
        <div>
          <Label>Link Privado (Zoom, Meet, etc)</Label>
          <Input
            name="scheduling_link"
            type="url"
            defaultValue={editing?.scheduling_link}
            placeholder="https://"
          />
        </div>
      </div>
      <div>
        <Label>Datas Disponíveis (selecione no calendário)</Label>
        <div className="p-4 border rounded-xl bg-slate-50 flex justify-center">
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={(d) => setSelectedDates(d || [])}
            className="rounded-md bg-white"
            disabled={(d) =>
              d < new Date(new Date().setHours(0, 0, 0, 0)) || d.getDay() === 0 || d.getDay() === 6
            }
          />
        </div>
        {selectedDates.length > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            {selectedDates.length} data(s):{' '}
            {selectedDates.map((d) => format(d, 'dd/MM/yyyy')).join(', ')}
          </p>
        )}
      </div>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        ⚠️ O link de agendamento só será enviado ao aluno após a confirmação do pagamento.
      </div>
      <div className="flex items-center gap-2">
        <Switch id="ment_is_free" checked={isFree} onCheckedChange={setIsFree} />
        <Label htmlFor="ment_is_free">Acesso Gratuito</Label>
      </div>
      <Button type="submit" className="w-full">
        {editing ? 'Salvar Alterações' : 'Criar Mentoria'}
      </Button>
    </form>
  )
}

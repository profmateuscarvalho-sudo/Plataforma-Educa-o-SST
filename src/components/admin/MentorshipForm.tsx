import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Mentorship } from '@/types'
import { FieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

interface MentorshipFormProps {
  editing: Mentorship | null
  isFree: boolean
  setIsFree: (v: boolean) => void
  onSubmit: (fd: FormData) => Promise<void>
  fieldErrors: FieldErrors
}

export function MentorshipForm({
  editing,
  isFree,
  setIsFree,
  onSubmit,
  fieldErrors,
}: MentorshipFormProps) {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('is_free', String(isFree))
      // available_dates / available_slots NÃO são enviados: ficam congelados
      // no banco (decisão do usuário — agenda nova = mentorship_slots).
      const photo = fd.get('mentor_photo') as File
      if (!photo?.size) fd.delete('mentor_photo')
      await onSubmit(fd)
    } finally {
      setSubmitting(false)
    }
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
        <div>
          <Label>Duração da sessão (min)</Label>
          <Input
            name="session_minutes"
            type="number"
            min={15}
            defaultValue={editing?.session_minutes ?? 60}
          />
        </div>
        <div>
          <Label>Antecedência mínima (h)</Label>
          <Input
            name="min_notice_hours"
            type="number"
            min={0}
            defaultValue={editing?.min_notice_hours ?? 24}
          />
        </div>
        <div>
          <Label>Semanas à frente</Label>
          <Input
            name="weeks_ahead"
            type="number"
            min={1}
            defaultValue={editing?.weeks_ahead ?? 4}
          />
        </div>
        <div>
          <Label>Máx. horários por compra</Label>
          <Input
            name="max_slots_per_purchase"
            type="number"
            min={1}
            defaultValue={editing?.max_slots_per_purchase ?? 4}
          />
        </div>
      </div>
      {/* Campos antigos (available_dates / available_slots) escondidos — continuam
          no banco, mas a agenda real agora vem de mentorship_slots. */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        ⚠️ O link de agendamento só será enviado ao aluno após a confirmação do pagamento.
      </div>
      <div className="flex items-center gap-2">
        <Switch id="ment_is_free" checked={isFree} onCheckedChange={setIsFree} />
        <Label htmlFor="ment_is_free">Acesso Gratuito</Label>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {editing ? 'Salvar Alterações' : 'Criar Mentoria'}
      </Button>
    </form>
  )
}

import { useState } from 'react'
import { Mentorship, AvailableSlot } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ExternalLink, CheckCircle2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface MentorshipListProps {
  mentorships: Mentorship[]
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const formatDate = (d: string) => {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

export function MentorshipList({ mentorships }: MentorshipListProps) {
  const [selectedSlot, setSelectedSlot] = useState<Record<string, AvailableSlot | null>>({})

  if (mentorships.length === 0) {
    return (
      <p className="text-slate-500 col-span-full text-center py-12">
        Nenhuma mentoria disponível no momento.
      </p>
    )
  }

  const handleAgendar = (m: Mentorship, slot: AvailableSlot) => {
    if (m.scheduling_link) {
      window.open(m.scheduling_link, '_blank', 'noopener,noreferrer')
    } else {
      toast({
        title: 'Agendamento',
        description: `Selecionado: ${formatDate(slot.date)} às ${slot.time}`,
      })
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {mentorships.map((m) => {
        const mentor = m.expand?.mentor
        const photoUrl = mentor?.photo
          ? pb.files.getUrl(mentor, mentor.photo)
          : m.mentor_photo
            ? pb.files.getUrl(m, m.mentor_photo)
            : null
        const bio = mentor?.mini_cv || m.mentor_bio
        const slots = Array.isArray(m.available_slots) ? m.available_slots : []
        const selected = selectedSlot[m.id]

        return (
          <Card
            key={m.id}
            className="overflow-hidden flex flex-col hover:shadow-xl transition-shadow group"
          >
            {photoUrl && (
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={photoUrl}
                  alt={m.mentor_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg font-serif text-secondary">{m.title}</CardTitle>
              <p className="text-sm font-medium text-primary">
                Com {mentor?.name || m.mentor_name}
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-slate-600 line-clamp-3">{m.description}</p>
              {bio && <p className="text-xs text-slate-400 line-clamp-2 mt-2">{stripHtml(bio)}</p>}
              {slots.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Horários disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot, i) => {
                      const isSelected =
                        selected?.date === slot.date && selected?.time === slot.time
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedSlot({ ...selectedSlot, [m.id]: slot })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {formatDate(slot.date)}
                          <Clock className="w-3 h-3 ml-0.5" />
                          {slot.time}
                          {isSelected && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t pt-4">
              <span className="text-lg font-bold text-slate-800">
                {m.is_free ? 'Gratuito' : formatBRL(m.price)}
              </span>
              <Button
                size="sm"
                disabled={slots.length > 0 && !selected}
                onClick={() =>
                  selected
                    ? handleAgendar(m, selected)
                    : m.scheduling_link
                      ? window.open(m.scheduling_link, '_blank', 'noopener,noreferrer')
                      : null
                }
              >
                Agendar <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

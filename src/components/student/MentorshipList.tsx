import { useState } from 'react'
import { Mentorship, AvailableSlot } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ExternalLink, CheckCircle2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { CheckoutModal } from '@/components/CheckoutModal'

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
  const [selectedSlots, setSelectedSlots] = useState<Record<string, AvailableSlot[]>>({})
  const [checkoutMentorship, setCheckoutMentorship] = useState<Mentorship | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  if (mentorships.length === 0) {
    return (
      <p className="text-muted-foreground col-span-full text-center py-12">
        Nenhuma mentoria disponível no momento.
      </p>
    )
  }

  const toggleSlot = (mid: string, slot: AvailableSlot) => {
    setSelectedSlots((prev) => {
      const current = prev[mid] || []
      const exists = current.some((s) => s.date === slot.date && s.time === slot.time)
      if (exists)
        return {
          ...prev,
          [mid]: current.filter((s) => !(s.date === slot.date && s.time === slot.time)),
        }
      return { ...prev, [mid]: [...current, slot] }
    })
  }

  const handleCheckout = (m: Mentorship) => {
    const slots = selectedSlots[m.id] || []
    if (m.is_free) {
      if (m.scheduling_link) window.open(m.scheduling_link, '_blank', 'noopener,noreferrer')
      else toast({ title: 'Agendamento', description: 'Entre em contato para agendar.' })
      return
    }
    if (slots.length === 0) {
      toast({ title: 'Selecione pelo menos um horario' })
      return
    }
    setCheckoutMentorship(m)
    setIsCheckoutOpen(true)
  }

  return (
    <>
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
          const selected = selectedSlots[m.id] || []
          const subtotal = (m.price || 0) * Math.max(selected.length, 1)
          const discount = selected.length >= 2 ? subtotal * 0.2 : 0
          const total = subtotal - discount

          return (
            <Card
              key={m.id}
              className="rounded-[28px] border border-border bg-card text-card-foreground overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(28,27,24,0.08)] group"
            >
              {photoUrl ? (
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={photoUrl}
                    alt={m.mentor_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="p-6 pb-2 bg-muted/40 border-b border-border/50 flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-foreground group-hover:bg-primary/20 transition-colors">
                    <Calendar className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  {!m.is_free && (
                    <Badge className="bg-primary/20 text-foreground border-primary/30 rounded-full font-semibold px-2.5 py-0.5 text-xs border">
                      Assinantes
                    </Badge>
                  )}
                </div>
              )}
              <CardHeader className="pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-serif font-bold text-foreground">
                      {m.title}
                    </CardTitle>
                    <p className="text-sm font-semibold text-primary mt-1">
                      Com {mentor?.name || m.mentor_name}
                    </p>
                  </div>
                  {!m.is_free && photoUrl && (
                    <Badge className="bg-primary/20 text-foreground border-primary/30 rounded-full font-semibold px-2.5 py-1 text-xs border shrink-0">
                      Assinantes
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {m.description}
                </p>
                {bio && (
                  <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-2 italic">
                    {stripHtml(bio)}
                  </p>
                )}
                {slots.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-foreground">
                      Selecione os horários (20% off em 2+):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot, i) => {
                        const isSelected = selected.some(
                          (s) => s.date === slot.date && s.time === slot.time,
                        )
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleSlot(m.id, slot)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                                : 'bg-card text-foreground border-border hover:border-primary hover:bg-muted'
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
                    {selected.length >= 2 && (
                      <p className="text-xs text-success font-semibold">
                        Desconto de 20% aplicado! Total: {formatBRL(total)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t border-border p-5">
                <span className="text-lg font-bold text-foreground">
                  {m.is_free ? 'Gratuito' : formatBRL(m.price)}
                </span>
                <Button
                  size="sm"
                  onClick={() => handleCheckout(m)}
                  className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 h-10 shadow-sm"
                >
                  {m.is_free
                    ? 'Agendar'
                    : selected.length >= 2
                      ? `Agendar (${formatBRL(total)})`
                      : 'Agendar'}{' '}
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        itemTitle={checkoutMentorship?.title || 'Mentoria'}
        price={checkoutMentorship?.price || 0}
        mentorshipId={checkoutMentorship?.id}
        selectedSlots={checkoutMentorship ? selectedSlots[checkoutMentorship.id] || [] : []}
        slotPrice={checkoutMentorship?.price}
      />
    </>
  )
}

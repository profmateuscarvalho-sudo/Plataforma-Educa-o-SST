import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Video, CalendarDays, Clock, Ticket } from 'lucide-react'
import { CheckoutModal } from '@/components/CheckoutModal'
import { getEvent } from '@/services/events'
import { PlatformEvent } from '@/types'
import pb from '@/lib/pocketbase/client'

export default function EventDetails() {
  const { id } = useParams()
  const [evt, setEvt] = useState<PlatformEvent | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (id) {
      getEvent(id)
        .then(setEvt)
        .catch(() => setNotFound(true))
    }
  }, [id])

  if (notFound) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-50 text-center px-4">
        <Ticket className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-3xl font-bold text-secondary mb-2">Evento não encontrado</h1>
        <p className="text-slate-500">
          O evento que você está procurando não existe ou foi removido.
        </p>
      </div>
    )
  }

  if (!evt) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Carregando detalhes...
      </div>
    )
  }

  const imgUrl = evt.thumbnail
    ? pb.files.getUrl(evt, evt.thumbnail)
    : 'https://img.usecurling.com/p/800/400?q=conference&color=blue'

  const dateObj = new Date(evt.date)
  const isOnline = evt.type === 'Aula Online' || evt.type === 'Workshop'
  const isPresencial = evt.type === 'Aula Presencial' || evt.type === 'Workshop'

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <section className="bg-secondary text-white py-16 lg:py-24">
        <div className="container px-4">
          <div className="max-w-4xl space-y-6">
            <Badge className="bg-accent text-secondary hover:bg-accent/90 border-none px-3 py-1 text-sm">
              {evt.type}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight">{evt.title}</h1>

            <div className="flex flex-wrap gap-6 pt-4 text-sm font-medium text-slate-300">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-accent" />
                {dateObj.toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {isPresencial && evt.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  {evt.location}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container px-4 mt-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="flex-1 space-y-12">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-serif font-bold text-secondary mb-6">Sobre o Evento</h2>
              <div className="prose max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {evt.description}
              </div>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
              <h2 className="text-2xl font-serif font-bold text-secondary">
                Informações de Acesso
              </h2>
              <div className="grid gap-4">
                {isOnline && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Transmissão Online</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        O link de acesso seguro será enviado para o seu e-mail imediatamente após a
                        confirmação da inscrição.
                      </p>
                    </div>
                  </div>
                )}

                {isPresencial && evt.location && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Local do Evento</h4>
                      <p className="text-sm text-slate-500 mt-1">{evt.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="w-full lg:w-96 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
              <img
                src={imgUrl}
                alt={evt.title}
                className="w-full aspect-video object-cover rounded-xl mb-6 shadow-sm border border-slate-100"
              />
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 font-medium mb-1">Valor da Inscrição</p>
                <p className="text-4xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    evt.price,
                  )}
                </p>
              </div>
              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold mb-4 shadow-lg shadow-primary/20"
                onClick={() => setIsCheckoutOpen(true)}
              >
                Quero me inscrever
              </Button>
              <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1">
                <Ticket className="w-3.5 h-3.5" /> Vagas limitadas. Garanta a sua.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        itemTitle={evt.title}
        price={evt.price}
      />
    </div>
  )
}

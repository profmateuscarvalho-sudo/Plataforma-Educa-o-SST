import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  MapPin,
  Video,
  CalendarDays,
  Clock,
  Ticket,
  CheckCircle2,
  User,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { getEvent } from '@/services/events'
import { createEventRegistration } from '@/services/event_registrations'
import { PlatformEvent } from '@/types'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export default function EventDetails() {
  const { id } = useParams()
  const [evt, setEvt] = useState<PlatformEvent | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)
  const { toast } = useToast()

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id)
      getEvent(id)
        .then(setEvt)
        .catch(() => setNotFound(true))
  }, [id])

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' })

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!evt) return
    setIsSubmitting(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createEventRegistration({
        event: evt.id,
        name: fd.get('name') as string,
        email: fd.get('email') as string,
        phone: fd.get('phone') as string,
        status: evt.price > 0 ? 'pending' : 'confirmed',
      })
      setRegistered(true)
      toast({ title: 'Inscrição realizada com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao processar inscrição', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (notFound)
    return (
      <div className="min-h-screen flex items-center justify-center">Evento não encontrado.</div>
    )
  if (!evt)
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>

  const imgUrl = evt.thumbnail
    ? pb.files.getUrl(evt, evt.thumbnail)
    : 'https://img.usecurling.com/p/1200/600?q=conference&color=blue'
  const startDate = new Date(evt.date)
  const endDate = evt.end_date ? new Date(evt.end_date) : null
  const isOnline = evt.type === 'Aula Online' || evt.type === 'Workshop'
  const isPresencial = evt.type === 'Aula Presencial' || evt.type === 'Workshop'

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Hero Section */}
      <section className="relative bg-secondary py-20 lg:py-28 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={imgUrl} alt={evt.title} className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/90 to-transparent mix-blend-multiply" />
        </div>
        <div className="container px-4 relative z-10">
          <div className="max-w-4xl space-y-6">
            <Badge className="bg-accent text-secondary hover:bg-accent/90 border-none px-3 py-1 text-sm">
              {evt.type}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight">{evt.title}</h1>
            <div className="flex flex-wrap gap-6 pt-4 text-sm font-medium text-slate-200">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-accent" />{' '}
                {startDate.toLocaleDateString('pt-BR')}
              </div>
              {isPresencial && evt.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" /> {evt.location}
                </div>
              )}
            </div>
            <div className="pt-4">
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-bold shadow-lg shadow-primary/20"
                onClick={scrollToForm}
              >
                Garantir minha vaga <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container px-4 mt-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Main Content */}
          <div className="flex-1 space-y-12">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-serif font-bold text-secondary mb-6">
                O que você vai aprender
              </h2>
              <div className="prose max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {evt.description}
              </div>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-serif font-bold text-secondary mb-6">
                Por que participar?
              </h2>
              <ul className="space-y-4 text-slate-600">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />{' '}
                  <span>
                    Conteúdo focado na prática e aplicabilidade imediata no mercado de SST.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />{' '}
                  <span>Material de apoio exclusivo para os participantes confirmados.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />{' '}
                  <span>Networking qualificado com profissionais da área.</span>
                </li>
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-96 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
              <h3 className="font-serif font-bold text-xl text-secondary mb-4">
                Informações Chave
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Data</p>
                    <p className="text-sm">{startDate.toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Horário</p>
                    <p className="text-sm">
                      {startDate.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      {endDate &&
                        `às ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
                {isOnline && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Formato Online</p>
                      <p className="text-sm">Link enviado pós-inscrição</p>
                    </div>
                  </div>
                )}
                {isPresencial && evt.location && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Local</p>
                      <p className="text-sm line-clamp-2">{evt.location}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 font-medium mb-1">Investimento</p>
                <p className="text-4xl font-bold text-primary">
                  {evt.price > 0
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        evt.price,
                      )
                    : 'Gratuito'}
                </p>
              </div>
              <Button size="lg" className="w-full h-12 text-lg font-bold" onClick={scrollToForm}>
                Inscreva-se Agora
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Registration Form Section */}
      <section ref={formRef} className="container px-4 mt-20 scroll-mt-24">
        <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-slate-200">
          {registered ? (
            <div className="text-center py-8 animate-fade-in">
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
              <h3 className="text-3xl font-serif font-bold text-secondary mb-2">
                Inscrição Confirmada!
              </h3>
              <p className="text-slate-600 text-lg">
                Sua vaga está garantida. Enviamos todas as informações detalhadas para o seu e-mail.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-secondary mb-2">
                  Garanta sua Vaga
                </h2>
                <p className="text-slate-600">
                  Preencha os dados abaixo para confirmar sua presença no evento.
                </p>
              </div>
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <Label className="text-base">Nome Completo *</Label>
                  <Input
                    name="name"
                    required
                    placeholder="Como você gostaria de ser chamado"
                    className="h-12 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-base">E-mail *</Label>
                  <Input
                    name="email"
                    type="email"
                    required
                    placeholder="seu.melhor@email.com"
                    className="h-12 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-base">WhatsApp *</Label>
                  <Input
                    name="phone"
                    required
                    placeholder="(00) 90000-0000"
                    className="h-12 mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 text-xl font-bold mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  ) : (
                    <Ticket className="w-6 h-6 mr-2" />
                  )}
                  Confirmar Minha Inscrição
                </Button>
                {evt.price > 0 && (
                  <p className="text-xs text-center text-slate-500 mt-4">
                    Ao confirmar, você será direcionado para as instruções de pagamento.
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

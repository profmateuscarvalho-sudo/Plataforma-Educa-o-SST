import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  MapPin,
  Video,
  CalendarDays,
  Clock,
  Ticket,
  CheckCircle2,
  Loader2,
  Sparkles,
  User,
  Calendar,
} from 'lucide-react'
import { getEvent } from '@/services/events'
import { createEventRegistration } from '@/services/event_registrations'
import { PlatformEvent } from '@/types'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

const getPandaUrl = (val?: string) => {
  if (!val) return ''
  if (val.includes('<iframe') || val.includes('src="')) {
    const match = val.match(/src="([^"]+)"/)
    return match ? match[1] : ''
  }
  if (val.startsWith('http')) return val
  return `https://player-vz-c2b2b8c9-251.tv.pandavideo.com.br/embed/?v=${val}`
}

const getSpeakerPhotoUrl = (event: PlatformEvent, index: number) => {
  if (!event.speaker_photos || event.speaker_photos.length === 0) return null
  const prefix = `speaker_${index}_`
  const photos = event.speaker_photos.filter((p) => p.startsWith(prefix))
  if (photos.length === 0) return null
  const latestPhoto = photos[photos.length - 1]
  return pb.files.getUrl(event, latestPhoto)
}

export default function EventDetails() {
  const { id } = useParams()
  const [evt, setEvt] = useState<PlatformEvent | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)
  const { toast } = useToast()

  const formRef = useRef<HTMLDivElement>(null)

  const loadEvent = () => {
    if (id) {
      getEvent(id)
        .then(setEvt)
        .catch(() => setNotFound(true))
    }
  }

  useEffect(() => {
    loadEvent()
  }, [id])

  useRealtime('events', (e) => {
    if (e.record.id === id) {
      loadEvent()
    }
  })

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
        position: fd.get('position') as string,
        status: evt.price && evt.price > 0 ? 'pending' : 'confirmed',
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-500">
        Evento não encontrado.
      </div>
    )
  if (!evt)
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )

  const imgUrl = evt.thumbnail
    ? pb.files.getUrl(evt, evt.thumbnail)
    : 'https://img.usecurling.com/p/1200/600?q=luxury%20event&color=black'
  const startDate = new Date(evt.date)
  const endDate = evt.end_date ? new Date(evt.end_date) : null
  const isOnline = evt.type === 'Aula Online' || evt.type === 'Workshop'
  const isPresencial = evt.type === 'Aula Presencial' || evt.type === 'Workshop'
  const iframeUrl = evt.panda_video_id ? getPandaUrl(evt.panda_video_id) : null

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500 selection:text-zinc-950 pb-20 relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="https://img.usecurling.com/p/1920/1080?q=corporate%20conference%20audience&color=black"
          className="w-full h-full object-cover opacity-[0.15] mix-blend-luminosity"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/95 to-zinc-950" />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-16 px-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 z-10">
        <div className="absolute inset-0 -z-10">
          <img src={imgUrl} alt={evt.title} className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-400 px-6 py-1.5 text-sm rounded-full mb-4 uppercase tracking-widest bg-zinc-950/80 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 mr-2 inline" /> {evt.type}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
            {evt.title}
          </h1>
          {evt.subtitle && (
            <p className="text-2xl text-amber-200 mt-4 font-serif italic max-w-3xl mx-auto opacity-90">
              {evt.subtitle}
            </p>
          )}
          <div className="w-24 h-1 bg-amber-500/50 mx-auto rounded-full mt-8" />

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold h-14 px-8 text-lg w-full sm:w-auto shadow-[0_0_40px_rgba(245,158,11,0.3)]"
              onClick={scrollToForm}
            >
              <Ticket className="w-5 h-5 mr-2" /> Garantir minha vaga
            </Button>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-24 relative z-20">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:border-amber-500/50 transition-colors duration-500">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-amber-500/10 rounded-full">
                <Calendar className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-zinc-100">Data</h3>
                <p className="text-zinc-400">
                  {startDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:border-amber-500/50 transition-colors duration-500">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-amber-500/10 rounded-full">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-zinc-100">Horário</h3>
                <p className="text-zinc-400">
                  {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {endDate &&
                    ` às ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:border-amber-500/50 transition-colors duration-500">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-amber-500/10 rounded-full">
                {isPresencial ? (
                  <MapPin className="w-8 h-8 text-amber-400" />
                ) : (
                  <Video className="w-8 h-8 text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-zinc-100">Local</h3>
                <p className="text-zinc-400">{evt.location || 'Online'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video / Importance Section */}
        <div className="space-y-12">
          {iframeUrl && (
            <section className="bg-zinc-900/50 p-2 rounded-3xl shadow-2xl border border-zinc-800">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black relative">
                <iframe
                  src={iframeUrl}
                  className="absolute inset-0 w-full h-full border-none"
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          <section className="bg-zinc-900/50 p-8 md:p-12 rounded-3xl shadow-2xl border border-zinc-800 backdrop-blur-sm">
            <h2 className="text-3xl font-serif font-bold text-amber-100 mb-6 text-center">
              Por que participar?
            </h2>
            {evt.importance ? (
              <div
                className="prose prose-invert prose-amber max-w-none text-zinc-300 leading-relaxed font-light"
                dangerouslySetInnerHTML={{ __html: evt.importance }}
              />
            ) : (
              <p className="text-zinc-300 leading-relaxed font-light text-lg">{evt.description}</p>
            )}
          </section>
        </div>

        {/* Objectives */}
        {evt.objectives && evt.objectives.length > 0 && (
          <section className="space-y-12 animate-in fade-in duration-1000">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-100">
                O que você vai aprender
              </h2>
              <div className="w-16 h-1 bg-amber-500/50 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {evt.objectives.map((obj, i) => (
                <Card
                  key={i}
                  className="bg-zinc-900 border-zinc-800 hover:border-amber-500/30 transition-all group"
                >
                  <CardContent className="p-8 text-center space-y-4 flex flex-col items-center">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      <CheckCircle2 className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-zinc-300 leading-relaxed font-light">{obj}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Structure */}
        {evt.structure && evt.structure.length > 0 && (
          <section className="max-w-2xl mx-auto space-y-12 animate-in fade-in duration-1000">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-100">
                Cronograma Oficial
              </h2>
              <div className="w-16 h-1 bg-amber-500/50 mx-auto rounded-full" />
            </div>
            <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-amber-500/50 before:via-zinc-800 before:to-transparent">
              {evt.structure.map((item, i) => (
                <li key={i} className="relative flex items-center group pl-10">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 rounded-full border-2 border-zinc-950 bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20">
                    <div className="w-2 h-2 rounded-full bg-zinc-950" />
                  </div>
                  <div className="bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 shadow-sm w-full group-hover:border-amber-500/30 transition-colors">
                    <div className="font-medium text-zinc-200">{item}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Speakers */}
        {evt.speakers && evt.speakers.length > 0 && (
          <section className="space-y-12 animate-in fade-in duration-1000">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-100">
                Especialistas Convidados
              </h2>
              <div className="w-16 h-1 bg-amber-500/50 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {evt.speakers.map((spk, i) => {
                const photoSrc = spk.photo || getSpeakerPhotoUrl(evt, i)
                return (
                  <Card
                    key={i}
                    className="bg-zinc-900 border-zinc-800 hover:border-amber-500/30 transition-all group overflow-hidden"
                  >
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="w-24 h-24 mx-auto bg-zinc-800 rounded-full flex items-center justify-center group-hover:ring-4 ring-amber-500/20 transition-all overflow-hidden">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={spk.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-xl text-zinc-100">{spk.name}</h4>
                        <p className="text-amber-400 font-medium mt-1">{spk.topic}</p>
                        {spk.bio && (
                          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">{spk.bio}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Registration Form */}
        <section ref={formRef} className="scroll-mt-32 max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/20 shadow-2xl shadow-amber-500/5 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
            <CardContent className="p-8 md:p-12 relative z-10">
              {registered ? (
                <div className="text-center py-8 animate-in zoom-in-95 duration-500 space-y-4">
                  <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-amber-500" />
                  </div>
                  <h3 className="text-3xl font-serif font-bold text-amber-100 mb-2">
                    Inscrição Recebida!
                  </h3>
                  <p className="text-zinc-400 text-lg">
                    Sua vaga está pré-garantida. Entraremos em contato com os próximos passos no
                    e-mail informado.
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif font-bold text-zinc-50 mb-2">
                      Garanta sua Vaga
                    </h2>
                    <p className="text-zinc-400">
                      Preencha os dados abaixo para iniciar sua inscrição.
                    </p>
                    <div className="mt-6 text-center">
                      <p className="text-sm text-zinc-500 font-medium mb-1">Investimento</p>
                      <p className="text-4xl font-bold text-amber-400">
                        {evt.price && evt.price > 0
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(evt.price)
                          : 'Gratuito'}
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                      <Label className="text-zinc-300">Nome Completo *</Label>
                      <Input
                        name="name"
                        required
                        placeholder="Como você gostaria de ser chamado"
                        className="h-12 mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">E-mail Corporativo *</Label>
                      <Input
                        name="email"
                        type="email"
                        required
                        placeholder="seu.melhor@email.com"
                        className="h-12 mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label className="text-zinc-300">WhatsApp *</Label>
                        <Input
                          name="phone"
                          required
                          placeholder="(00) 90000-0000"
                          className="h-12 mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-300">Cargo / Função *</Label>
                        <Input
                          name="position"
                          required
                          placeholder="Ex: Gestor de SST"
                          className="h-12 mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-14 text-xl font-bold mt-4 bg-amber-500 hover:bg-amber-600 text-zinc-950"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      ) : (
                        <Ticket className="w-6 h-6 mr-2" />
                      )}
                      Solicitar Inscrição VIP
                    </Button>
                    {evt.price && evt.price > 0 && (
                      <p className="text-xs text-center text-zinc-500 mt-4">
                        Ao confirmar, você receberá as instruções de pagamento de forma segura.
                      </p>
                    )}
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Partner Logos */}
        {evt.partner_logos && evt.partner_logos.length > 0 && (
          <section className="pt-16 border-t border-zinc-800/50 animate-in fade-in duration-1000 delay-500">
            <div className="text-center space-y-10">
              <div className="space-y-4">
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-amber-100">
                  Apoiadores & Parceiros
                </h3>
                <div className="w-16 h-1 bg-amber-500/50 mx-auto rounded-full" />
              </div>
              <div className="flex flex-wrap justify-center gap-6 items-center">
                {evt.partner_logos.map((logo, i) => (
                  <div
                    key={i}
                    className="w-40 h-28 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-zinc-800 flex items-center justify-center p-5 hover:scale-105 hover:shadow-amber-500/20 transition-all duration-300"
                  >
                    <img
                      src={pb.files.getUrl(evt, logo)}
                      alt={`Parceiro ${i + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

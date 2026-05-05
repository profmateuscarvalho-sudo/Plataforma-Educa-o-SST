import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, MapPin, User, CheckCircle2, XCircle, Sparkles } from 'lucide-react'
import { WorkshopInvitation } from '@/types'
import { updateInvitationStatus } from '@/services/workshop'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

export default function WorkshopInvitationPage() {
  const { token } = useParams()
  const [invite, setInvite] = useState<WorkshopInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const record = await pb
          .collection('workshop_invitations')
          .getFirstListItem<WorkshopInvitation>(`token="${token}"`, {
            expand: 'event',
          })

        setInvite(record)

        if (record.status === 'pending') {
          await updateInvitationStatus(record.id, 'viewed')
          setInvite({ ...record, status: 'viewed' })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchInvite()
  }, [token])

  const handleRSVP = async (status: 'confirmed' | 'declined') => {
    if (!invite) return
    try {
      await updateInvitationStatus(invite.id, status)
      setInvite({ ...invite, status })
      toast({ title: status === 'confirmed' ? 'Presença confirmada!' : 'Agradecemos o aviso.' })
    } catch {
      toast({ title: 'Erro ao atualizar status.', variant: 'destructive' })
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-amber-50">
        Carregando...
      </div>
    )
  if (!invite || !invite.expand?.event)
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-amber-50">
        Convite não encontrado ou expirado.
      </div>
    )

  const event = invite.expand.event
  const eventDate = new Date(event.date)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500 selection:text-zinc-950 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 px-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="absolute inset-0 opacity-20 bg-[url('https://img.usecurling.com/p/1920/1080?q=spirituality%20light&color=black')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/80 to-zinc-950" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-400 px-6 py-1.5 text-sm rounded-full mb-4 uppercase tracking-widest"
          >
            <Sparkles className="w-4 h-4 mr-2 inline" /> Convite VIP Exclusivo
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
            {event.title}
          </h1>
          <div className="w-24 h-1 bg-amber-500/50 mx-auto rounded-full mt-8" />
          <p className="text-xl md:text-2xl text-zinc-300 font-light mt-8 leading-relaxed max-w-2xl mx-auto">
            Olá, <span className="font-semibold text-amber-400">{invite.guest_name}</span>. Você é
            nosso convidado especial para uma experiência transformadora.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-20">
          <Card className="shadow-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:border-amber-500/50 transition-colors duration-500">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-amber-500/10 rounded-full">
                <Calendar className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-zinc-100">Data</h3>
                <p className="text-zinc-400">
                  {eventDate.toLocaleDateString('pt-BR', {
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
                  {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às{' '}
                  {event.end_date
                    ? new Date(event.end_date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '13h'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:border-amber-500/50 transition-colors duration-500">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-amber-500/10 rounded-full">
                <MapPin className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-zinc-100">Local</h3>
                <p className="text-zinc-400">{event.location}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* The "Why" or Importance Section */}
        {event.importance && (
          <section className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-10 md:p-16 text-center space-y-6 animate-in fade-in duration-1000">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto opacity-50" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-100">
              O Propósito
            </h2>
            <div className="prose prose-invert prose-lg mx-auto text-zinc-300 font-light leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: event.importance }} />
            </div>
          </section>
        )}

        {/* Speakers */}
        {event.speakers && event.speakers.length > 0 && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-100">
                Líderes e Especialistas
              </h2>
              <div className="w-16 h-1 bg-amber-500/50 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {event.speakers.map((spk, i) => (
                <Card
                  key={i}
                  className="bg-zinc-900 border-zinc-800 hover:border-amber-500/30 transition-all group"
                >
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                      <User className="w-10 h-10 text-zinc-500 group-hover:text-amber-400 transition-colors" />
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
              ))}
            </div>
          </section>
        )}

        {/* Structure & RSVP */}
        <section className="grid lg:grid-cols-2 gap-16 items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          {event.structure && event.structure.length > 0 ? (
            <div className="space-y-8">
              <h3 className="text-3xl font-bold font-serif text-amber-100 mb-8">
                Jornada do Encontro
              </h3>
              <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-amber-500/50 before:via-zinc-800 before:to-transparent">
                {event.structure.map((item, i) => (
                  <li key={i} className="relative flex items-center group is-active pl-10">
                    <div className="absolute left-0 flex items-center justify-center w-6 h-6 rounded-full border-2 border-zinc-950 bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20">
                      <div className="w-2 h-2 rounded-full bg-zinc-950" />
                    </div>
                    <div className="bg-zinc-900/80 p-5 rounded-xl border border-zinc-800 shadow-sm w-full group-hover:border-amber-500/30 transition-colors">
                      <div className="font-medium text-zinc-200">{item}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-3xl blur-2xl" />
              <img
                src="https://img.usecurling.com/p/600/800?q=meditation%20corporate&color=black"
                alt="Meeting"
                className="rounded-3xl shadow-2xl relative z-10 border border-zinc-800 object-cover"
              />
            </div>
          )}

          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/20 shadow-2xl shadow-amber-500/5 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
            <CardContent className="p-10 space-y-8 text-center relative z-10">
              <h3 className="text-3xl font-serif font-bold text-zinc-50">
                Confirmação de Presença
              </h3>
              <p className="text-zinc-400">
                Sua presença é fundamental para nós. Por favor, confirme se poderá participar desta
                experiência.
              </p>

              {invite.status === 'viewed' || invite.status === 'pending' ? (
                <div className="flex flex-col gap-4">
                  <Button
                    size="lg"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold h-14 text-lg transition-all shadow-lg shadow-amber-500/20"
                    onClick={() => handleRSVP('confirmed')}
                  >
                    <CheckCircle2 className="w-6 h-6 mr-2" /> Sim, eu estarei presente
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300 h-14"
                    onClick={() => handleRSVP('declined')}
                  >
                    <XCircle className="w-5 h-5 mr-2" /> Não poderei comparecer
                  </Button>
                </div>
              ) : (
                <div className="p-8 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
                  {invite.status === 'confirmed' ? (
                    <>
                      <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-amber-500" />
                      </div>
                      <p className="text-2xl font-serif text-amber-100">Presença Confirmada!</p>
                      <p className="text-zinc-400">
                        Aguardamos você no dia {eventDate.toLocaleDateString('pt-BR')}. Um lembrete
                        será enviado próximo à data.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-rose-500" />
                      </div>
                      <p className="text-2xl font-serif text-rose-200">Agradecemos o aviso.</p>
                      <p className="text-zinc-400">
                        Sentiremos sua falta, mas esperamos vê-lo em uma próxima oportunidade.
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

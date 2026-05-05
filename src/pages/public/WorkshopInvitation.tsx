import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, MapPin, User, CheckCircle2, XCircle } from 'lucide-react'
import { WorkshopInvitation } from '@/types'
import { updateInvitationStatus } from '@/services/workshop'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

export default function WorkshopInvitationPage() {
  const { slug } = useParams()
  const [invite, setInvite] = useState<WorkshopInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const record = await pb
          .collection('workshop_invitations')
          .getFirstListItem<WorkshopInvitation>(`slug="${slug}"`, {
            expand: 'event',
          })
        setInvite(record)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchInvite()
  }, [slug])

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
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  if (!invite || !invite.expand?.event)
    return (
      <div className="min-h-screen flex items-center justify-center">Convite não encontrado.</div>
    )

  const event = invite.expand.event
  const eventDate = new Date(event.date)

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary selection:text-primary-foreground pb-20">
      {/* Hero Section */}
      <section className="relative bg-secondary text-secondary-foreground overflow-hidden py-24 px-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="absolute inset-0 opacity-10 bg-[url('https://img.usecurling.com/p/1920/1080?q=corporate%20event&color=blue')] bg-cover bg-center" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <Badge
            variant="outline"
            className="border-secondary-foreground/20 text-secondary-foreground px-4 py-1 text-sm rounded-full mb-4"
          >
            Convite VIP Exclusivo
          </Badge>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight leading-tight">
            {event.title}
          </h1>
          <p className="text-xl md:text-2xl text-secondary-foreground/80 font-light mt-4">
            Olá, <span className="font-semibold text-white">{invite.guest_name}</span>. Você é nosso
            convidado especial.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-32 relative z-20">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Data</h3>
                <p className="text-muted-foreground">
                  {eventDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Horário</h3>
                <p className="text-muted-foreground">
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
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Local</h3>
                <p className="text-muted-foreground">{event.location}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Speakers */}
        {event.speakers && event.speakers.length > 0 && (
          <section className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-serif font-bold text-secondary">
                Palestrantes Confirmados
              </h2>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {event.speakers.map((spk, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow group">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-3 bg-slate-100 rounded-full group-hover:bg-primary/10 transition-colors">
                      <User className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{spk.name}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                        {spk.topic}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Structure & RSVP */}
        <section className="grid md:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          {event.structure && event.structure.length > 0 ? (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold font-serif text-secondary mb-6">
                Estrutura do Evento
              </h3>
              <ul className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {event.structure.map((item, i) => (
                  <li
                    key={i}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow-sm">
                      <div className="font-medium text-slate-800">{item}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="hidden md:block">
              <img
                src="https://img.usecurling.com/p/600/800?q=corporate%20meeting&color=blue"
                alt="Meeting"
                className="rounded-2xl shadow-lg object-cover"
              />
            </div>
          )}

          <Card className="bg-primary text-primary-foreground border-0 shadow-2xl">
            <CardContent className="p-10 space-y-8 text-center">
              <h3 className="text-3xl font-serif font-bold">Confirmação de Presença</h3>
              <p className="text-primary-foreground/80">
                Por favor, informe-nos se você poderá comparecer ao evento para organizarmos a
                melhor experiência.
              </p>

              {invite.status === 'pending' ? (
                <div className="flex flex-col gap-4">
                  <Button
                    size="lg"
                    className="w-full bg-white text-primary hover:bg-slate-100"
                    onClick={() => handleRSVP('confirmed')}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Sim, eu vou
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-primary-foreground/20 hover:bg-primary-foreground/10 text-white"
                    onClick={() => handleRSVP('declined')}
                  >
                    <XCircle className="w-5 h-5 mr-2" /> Não poderei comparecer
                  </Button>
                </div>
              ) : (
                <div className="p-6 bg-primary-foreground/10 rounded-lg space-y-4">
                  {invite.status === 'confirmed' ? (
                    <>
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                      <p className="text-xl font-medium">Presença Confirmada!</p>
                      <p className="text-sm opacity-80">
                        Aguardamos você no dia {eventDate.toLocaleDateString('pt-BR')}.
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
                      <p className="text-xl font-medium">Agradecemos o aviso.</p>
                      <p className="text-sm opacity-80">Sentiremos sua falta no evento.</p>
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

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { WorkshopInvitation, PlatformEvent } from '@/types'
import { updateInvitationStatus } from '@/services/workshop'
import { createEventRegistration } from '@/services/event_registrations'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

type ExtraGuest = { name: string; position: string; phone: string }

const getSpeakerPhotoUrl = (event: PlatformEvent, index: number) => {
  if (!event.speaker_photos || event.speaker_photos.length === 0) return null
  const prefix = `speaker_${index}_`
  const photos = event.speaker_photos.filter((p) => p.startsWith(prefix))
  if (photos.length === 0) return null
  const latestPhoto = photos[photos.length - 1]
  return pb.files.getUrl(event, latestPhoto)
}

export default function WorkshopInvitationPage() {
  const { token } = useParams()
  const [invite, setInvite] = useState<WorkshopInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // RSVP Flow State
  const [rsvpStep, setRsvpStep] = useState<'initial' | 'details' | 'success'>('initial')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [formData, setFormData] = useState({ email: '', phone: '', position: '', company_name: '' })
  const [extraGuests, setExtraGuests] = useState<ExtraGuest[]>([])
  const [confirmPhone, setConfirmPhone] = useState('')

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

        if (record.status === 'confirmed') setRsvpStep('success')
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchInvite()
  }, [token])

  const handleDecline = async () => {
    if (!invite) return
    setIsSubmitting(true)
    try {
      await updateInvitationStatus(invite.id, 'declined')
      setInvite({ ...invite, status: 'declined' })
      toast({ title: 'Agradecemos o aviso.' })
    } catch {
      toast({ title: 'Erro ao atualizar status.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProceedToVerify = () => {
    if (!formData.email || !formData.phone || !formData.position || !formData.company_name) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }
    setIsConfirmModalOpen(true)
  }

  const handleFinalizeRegistration = async () => {
    if (!invite || !invite.expand?.event) return

    if (confirmPhone.replace(/\D/g, '') !== formData.phone.replace(/\D/g, '')) {
      toast({ title: 'O número de confirmação não confere', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      await createEventRegistration({
        event: invite.expand.event.id,
        name: invite.guest_name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        company_name: formData.company_name,
        extra_guests: extraGuests.filter((g) => g.name && g.phone),
        status: 'confirmed',
      })
      await updateInvitationStatus(invite.id, 'confirmed')
      setInvite({ ...invite, status: 'confirmed' })
      setRsvpStep('success')
      setIsConfirmModalOpen(false)
      toast({ title: 'Presença confirmada com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao processar inscrição', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addGuest = () => setExtraGuests([...extraGuests, { name: '', position: '', phone: '' }])
  const removeGuest = (i: number) => setExtraGuests(extraGuests.filter((_, idx) => idx !== i))
  const updateGuest = (i: number, field: keyof ExtraGuest, val: string) => {
    const updated = [...extraGuests]
    updated[i][field] = val
    setExtraGuests(updated)
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-amber-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )

  if (!invite || !invite.expand?.event)
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50">
        <div className="text-center space-y-4">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto opacity-80" />
          <h2 className="text-3xl font-serif text-rose-200">Convite não encontrado</h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            Não conseguimos localizar este convite. Ele pode ter expirado ou o link pode estar
            incorreto.
          </p>
        </div>
      </div>
    )

  const event = invite.expand.event
  const eventDate = new Date(event.date)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500 selection:text-zinc-950 pb-20 relative">
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-amber-500/10 via-zinc-950 to-zinc-950 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-16 px-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-400 px-6 py-1.5 text-sm rounded-full mb-4 uppercase tracking-widest bg-zinc-950"
          >
            <Sparkles className="w-4 h-4 mr-2 inline" /> Convite VIP Exclusivo
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
            {event.title}
          </h1>
          {event.subtitle && (
            <p className="text-2xl text-amber-200 mt-4 font-serif italic max-w-3xl mx-auto opacity-90">
              {event.subtitle}
            </p>
          )}
          <div className="w-24 h-1 bg-amber-500/50 mx-auto rounded-full mt-8" />
          <p className="text-xl md:text-2xl text-zinc-300 font-light mt-8 leading-relaxed max-w-2xl mx-auto">
            Olá, <span className="font-semibold text-amber-400">{invite.guest_name}</span>. Você é
            nosso convidado especial para uma experiência transformadora.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
        {/* Description / Importance */}
        {event.importance && (
          <section className="relative z-20 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm animate-in fade-in duration-1000">
            <h2 className="text-3xl font-serif font-bold text-amber-100 mb-6 text-center">
              Por que participar?
            </h2>
            <div
              className="prose prose-invert prose-amber max-w-none text-zinc-300 leading-relaxed font-light"
              dangerouslySetInnerHTML={{ __html: event.importance }}
            />
          </section>
        )}
        {/* Info Cards */}{' '}
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
                <p className="text-zinc-400">{event.location || 'Online'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Objectives */}
        {event.objectives && event.objectives.length > 0 && (
          <section className="space-y-12 animate-in fade-in duration-1000">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-100">
                Objetivos do Encontro
              </h2>
              <div className="w-16 h-1 bg-amber-500/50 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {event.objectives.map((obj, i) => (
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
        {/* Speakers */}
        {event.speakers && event.speakers.length > 0 && (
          <section className="space-y-12 animate-in fade-in duration-1000">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-100">
                Especialistas Convidados
              </h2>
              <div className="w-16 h-1 bg-amber-500/50 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {event.speakers.map((spk, i) => {
                const photoSrc = spk.photo || getSpeakerPhotoUrl(event, i)
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
        {/* Structure & RSVP */}
        <section
          className={`grid ${event.structure && event.structure.length > 0 ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'} gap-16 items-start animate-in fade-in duration-1000`}
        >
          {event.structure && event.structure.length > 0 && (
            <div className="space-y-8">
              <h3 className="text-3xl font-bold font-serif text-amber-100 mb-8">Cronograma</h3>
              <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-amber-500/50 before:via-zinc-800 before:to-transparent">
                {event.structure.map((item, i) => (
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
            </div>
          )}

          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/20 shadow-2xl shadow-amber-500/5 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
            <CardContent className="p-8 md:p-10 relative z-10">
              {invite.status === 'declined' ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-20 h-20 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-rose-500" />
                  </div>
                  <p className="text-2xl font-serif text-rose-200">Agradecemos o aviso.</p>
                  <p className="text-zinc-400">Sentiremos sua falta nesta edição.</p>
                </div>
              ) : rsvpStep === 'success' ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-amber-500" />
                  </div>
                  <p className="text-2xl font-serif text-amber-100">Presença Confirmada!</p>
                  <p className="text-zinc-400">
                    Aguardamos você no dia {eventDate.toLocaleDateString('pt-BR')}. Sua vaga e de
                    seus convidados estão garantidas.
                  </p>
                </div>
              ) : rsvpStep === 'initial' ? (
                <div className="text-center space-y-8 py-4">
                  <h3 className="text-3xl font-serif font-bold text-zinc-50">
                    Confirmação de Presença
                  </h3>
                  <p className="text-zinc-400">
                    Sua presença é fundamental para nós. Por favor, confirme se poderá participar.
                  </p>
                  <div className="flex flex-col gap-4 mt-8">
                    <Button
                      size="lg"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold h-14 text-lg"
                      onClick={() => setRsvpStep('details')}
                    >
                      <CheckCircle2 className="w-6 h-6 mr-2" /> Sim, eu estarei presente
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300 h-14"
                      onClick={handleDecline}
                      disabled={isSubmitting}
                    >
                      <XCircle className="w-5 h-5 mr-2" /> Não poderei comparecer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-serif font-bold text-zinc-50">
                      Detalhes da Inscrição
                    </h3>
                    <p className="text-zinc-400 text-sm mt-2">
                      Complete seus dados e adicione convidados extras da sua empresa.
                    </p>
                  </div>

                  <div className="space-y-4 bg-zinc-900/50 p-5 rounded-xl border border-zinc-800">
                    <div>
                      <Label className="text-zinc-300">Nome Principal</Label>
                      <Input
                        value={invite.guest_name}
                        disabled
                        className="bg-zinc-900 border-zinc-800 text-zinc-400"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-zinc-300">E-mail *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="bg-zinc-950 border-zinc-800"
                          placeholder="seu@email.com"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-300">Telefone *</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="bg-zinc-950 border-zinc-800"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-zinc-300">Cargo / Função *</Label>
                        <Input
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="bg-zinc-950 border-zinc-800"
                          placeholder="Ex: Diretor de RH"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-300">Nome da Empresa *</Label>
                        <Input
                          value={formData.company_name}
                          onChange={(e) =>
                            setFormData({ ...formData, company_name: e.target.value })
                          }
                          className="bg-zinc-950 border-zinc-800"
                          placeholder="Ex: Indústria X"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-zinc-200 text-lg font-serif">
                        Convidados da Empresa
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addGuest}
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Adicionar convidado
                      </Button>
                    </div>

                    {extraGuests.length === 0 ? (
                      <p className="text-zinc-500 text-sm italic">Nenhum convidado adicionado.</p>
                    ) : (
                      <div className="space-y-4">
                        {extraGuests.map((guest, i) => (
                          <div
                            key={i}
                            className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg relative grid gap-4"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeGuest(i)}
                              className="absolute top-2 right-2 text-zinc-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <div>
                              <Label className="text-xs text-zinc-400">Nome do Convidado</Label>
                              <Input
                                value={guest.name}
                                onChange={(e) => updateGuest(i, 'name', e.target.value)}
                                className="bg-zinc-950 border-zinc-800 h-9"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-zinc-400">Cargo</Label>
                                <Input
                                  value={guest.position}
                                  onChange={(e) => updateGuest(i, 'position', e.target.value)}
                                  className="bg-zinc-950 border-zinc-800 h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-zinc-400">Telefone</Label>
                                <Input
                                  value={guest.phone}
                                  onChange={(e) => updateGuest(i, 'phone', e.target.value)}
                                  className="bg-zinc-950 border-zinc-800 h-9"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-zinc-700 hover:bg-zinc-800"
                      onClick={() => setRsvpStep('initial')}
                    >
                      Voltar
                    </Button>
                    <Button
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
                      onClick={handleProceedToVerify}
                    >
                      Confirmar Participação
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        {/* Partner Logos */}
        {event.partner_logos && event.partner_logos.length > 0 && (
          <section className="mt-24 p-12 md:p-20 bg-gradient-to-br from-zinc-900 to-black border border-amber-500/20 rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in duration-1000">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
            <div className="relative z-10 text-center space-y-12">
              <div className="inline-flex items-center justify-center space-x-4 w-full">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/50 max-w-[100px]" />
                <h3 className="text-2xl md:text-3xl font-serif text-amber-100 font-bold tracking-widest uppercase">
                  Parceiros Oficiais
                </h3>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/50 max-w-[100px]" />
              </div>
              <div className="flex flex-wrap justify-center gap-10 md:gap-16 items-center">
                {event.partner_logos.map((logo, i) => (
                  <div
                    key={i}
                    className="w-60 h-40 bg-white rounded-2xl border border-white/10 hover:border-amber-500/50 transition-colors duration-500 hover:bg-white/90 shadow-xl flex items-center justify-center p-8"
                  >
                    <img
                      src={pb.files.getUrl(event, logo)}
                      alt="Logo Parceiro"
                      className="w-full h-full object-contain transition-transform duration-500 transform hover:scale-110 drop-shadow-2xl mix-blend-multiply"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-amber-500/20 text-zinc-50">
          <DialogHeader>
            <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-serif text-center">
              Confirmação de Segurança
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-center">
              Para validar sua inscrição e garantir sua segurança, por favor, redigite o número de
              telefone informado:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={confirmPhone}
              onChange={(e) => setConfirmPhone(e.target.value)}
              className="bg-zinc-900 border-zinc-800 focus-visible:ring-amber-500 text-center text-lg tracking-wider"
              placeholder="(00) 00000-0000"
            />
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold h-12"
              onClick={handleFinalizeRegistration}
              disabled={isSubmitting || !confirmPhone}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar Inscrição'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

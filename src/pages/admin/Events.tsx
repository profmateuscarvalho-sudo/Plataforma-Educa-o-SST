import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit, Copy, Users } from 'lucide-react'
import { getEvents, deleteEvent } from '@/services/events'
import { PlatformEvent } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { EventFormModal } from '@/components/admin/EventFormModal'
import { EventSubscribersModal } from '@/components/admin/EventSubscribersModal'
import { EventVipModal } from '@/components/admin/EventVipModal'
import pb from '@/lib/pocketbase/client'
import { Link } from 'react-router-dom'
import { ExternalLink, Mail, MessageSquare } from 'lucide-react'

export default function AdminEvents() {
  const [events, setEvents] = useState<PlatformEvent[]>([])
  const [subCounts, setSubCounts] = useState<Record<string, number>>({})

  const [formOpen, setFormOpen] = useState(false)
  const [subsOpen, setSubsOpen] = useState(false)
  const [vipOpen, setVipOpen] = useState(false)
  const [activeEvent, setActiveEvent] = useState<PlatformEvent | null>(null)

  const { toast } = useToast()

  const loadCounts = async (evts: PlatformEvent[]) => {
    const counts: Record<string, number> = {}
    await Promise.all(
      evts.map(async (evt) => {
        try {
          const res = await pb
            .collection('event_registrations')
            .getList(1, 1, { filter: `event="${evt.id}"` })
          counts[evt.id] = res.totalItems
        } catch {
          counts[evt.id] = 0
        }
      }),
    )
    setSubCounts(counts)
  }

  const load = async () => {
    try {
      const data = await getEvents()
      setEvents(data)
      await loadCounts(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('events', () => load())
  useRealtime('event_registrations', () => loadCounts(events))

  const handleOpenForm = (evt?: PlatformEvent) => {
    setActiveEvent(evt || null)
    setFormOpen(true)
  }

  const handleOpenSubs = (evt: PlatformEvent) => {
    setActiveEvent(evt)
    setSubsOpen(true)
  }

  const handleOpenVip = (evt: PlatformEvent) => {
    setActiveEvent(evt)
    setVipOpen(true)
  }

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/eventos/${id}`)
    toast({
      title: 'Link copiado!',
      description: 'URL de venda copiada para a área de transferência.',
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Eventos e Workshops</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie aulas online, presenciais e acompanhe os inscritos.
          </p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 w-4 h-4" /> Novo Evento
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Início</TableHead>
                <TableHead className="text-center">Inscritos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell className="font-medium">{evt.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{evt.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(evt.date).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-primary">
                    {subCounts[evt.id] || 0}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Copiar Link"
                      onClick={() => copyLink(evt.id)}
                    >
                      <Copy className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Gerenciar Inscritos"
                      onClick={() => handleOpenSubs(evt)}
                    >
                      <Users className="w-4 h-4 text-emerald-600" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Q&A ao Vivo" asChild>
                      <Link to={`/admin/eventos/${evt.id}/qa`}>
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                      </Link>
                    </Button>
                    {(evt.is_workshop || evt.type === 'Workshop' || evt.type === 'Summit') && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Enviar Convite VIP"
                          onClick={() => handleOpenVip(evt)}
                        >
                          <Mail className="w-4 h-4 text-purple-600" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Página de Patrocínio" asChild>
                          <Link to={`/workshop/patrocinio/${evt.id}`} target="_blank">
                            <ExternalLink className="w-4 h-4 text-orange-600" />
                          </Link>
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm(evt)}>
                      <Edit className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={async () => {
                        if (confirm('Deseja realmente excluir este evento?')) {
                          await deleteEvent(evt.id)
                          toast({ title: 'Evento excluído' })
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum evento cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EventFormModal
        open={formOpen}
        setOpen={setFormOpen}
        editingEvent={activeEvent}
        onSuccess={load}
      />
      <EventSubscribersModal open={subsOpen} setOpen={setSubsOpen} event={activeEvent} />
      <EventVipModal open={vipOpen} setOpen={setVipOpen} event={activeEvent} />
    </div>
  )
}

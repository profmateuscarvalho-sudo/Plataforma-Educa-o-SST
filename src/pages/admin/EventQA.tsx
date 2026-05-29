import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { PlatformEvent, LiveMessage } from '@/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { Download, MessageSquare, ArrowLeft, Check, Trash2, Zap, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminEventQA() {
  const { id } = useParams()
  const [event, setEvent] = useState<PlatformEvent | null>(null)
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [speakerFilter, setSpeakerFilter] = useState<string>('')
  const { toast } = useToast()

  const loadEvent = async () => {
    if (!id) return
    try {
      const ev = await pb.collection('events').getOne<PlatformEvent>(id)
      setEvent(ev)
      if (ev.speakers && ev.speakers.length > 0) {
        setSpeakerFilter(ev.speakers[0].name)
      }
    } catch (err) {
      toast({ title: 'Erro ao carregar evento', variant: 'destructive' })
    }
  }

  const loadMessages = async () => {
    if (!id) return
    try {
      const msgs = await pb.collection('live_messages').getFullList<LiveMessage>({
        filter: `event="${id}" && status != 'hidden'`,
        sort: '-created',
      })
      setMessages(msgs)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadEvent()
    loadMessages()
  }, [id])

  useRealtime('live_messages', (e) => {
    if (e.record.event === id) {
      loadMessages()
    }
  })

  const handleStatusUpdate = async (msgId: string, status: string) => {
    try {
      await pb.collection('live_messages').update(msgId, { status })
      if (status === 'hidden') {
        setMessages((prev) => prev.filter((m) => m.id !== msgId))
        toast({ title: 'Pergunta arquivada' })
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, status: status as LiveMessage['status'] } : m)),
        )
      }
    } catch (err) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const filteredMessages = useMemo(() => {
    if (!speakerFilter) return []
    return messages.filter((m) => m.speaker_name === speakerFilter)
  }, [messages, speakerFilter])

  const qaUrl = `${window.location.origin}/eventos/${id}/qa`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qaUrl)}`

  const handleDownloadQR = async () => {
    try {
      const res = await fetch(qrCodeUrl)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrcode-${event?.title?.replace(/\s+/g, '-').toLowerCase() || 'qa'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast({ title: 'Erro ao baixar QR Code', variant: 'destructive' })
    }
  }

  if (!event) return null

  const speakersList = event.speakers?.map((s) => s.name) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/admin/eventos">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Live Q&A
          </h2>
          <p className="text-muted-foreground mt-1">Evento: {event.title}</p>
        </div>
      </div>

      <Tabs defaultValue="moderation" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="moderation">Painel de Moderação</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code & Link</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                {filteredMessages.length} Perguntas
              </Badge>
              <Badge variant="default" className="px-3 py-1 text-sm bg-amber-500">
                {filteredMessages.filter((m) => m.status === 'pending').length} Pendentes
              </Badge>
            </div>
            <div className="w-full sm:w-64">
              <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Palestrante" />
                </SelectTrigger>
                <SelectContent>
                  {speakersList.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMessages.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                {!speakerFilter
                  ? 'Selecione um palestrante para visualizar as perguntas.'
                  : 'Nenhuma pergunta recebida ainda para este palestrante.'}
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <Card
                  key={msg.id}
                  className={cn(
                    'transition-all duration-300 relative overflow-hidden flex flex-col',
                    msg.status === 'active' ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : '',
                    msg.status === 'answered' ? 'opacity-70 bg-slate-50' : '',
                  )}
                >
                  {msg.status === 'active' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse" />
                  )}
                  <CardHeader className="pb-3 flex-none">
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant={
                          msg.status === 'active'
                            ? 'default'
                            : msg.status === 'answered'
                              ? 'outline'
                              : 'secondary'
                        }
                      >
                        {msg.status === 'active'
                          ? 'Em Destaque'
                          : msg.status === 'answered'
                            ? 'Respondida'
                            : 'Pendente'}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(msg.created).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <CardTitle className="text-lg leading-snug">{msg.content}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 text-sm text-muted-foreground flex flex-col gap-2 flex-grow">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{msg.author_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>
                        Para: <strong>{msg.speaker_name}</strong>
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t bg-slate-50/50 flex gap-2 flex-none">
                    {msg.status !== 'active' && msg.status !== 'answered' && (
                      <Button
                        size="sm"
                        className="flex-1 bg-amber-500 hover:bg-amber-600"
                        onClick={() => handleStatusUpdate(msg.id, 'active')}
                      >
                        <Zap className="w-4 h-4 mr-2" /> Destacar
                      </Button>
                    )}
                    {msg.status === 'active' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleStatusUpdate(msg.id, 'answered')}
                      >
                        <Check className="w-4 h-4 mr-2" /> Concluir
                      </Button>
                    )}
                    {msg.status !== 'answered' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleStatusUpdate(msg.id, 'hidden')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {msg.status === 'answered' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleStatusUpdate(msg.id, 'hidden')}
                      >
                        Arquivar
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="qrcode">
          <Card className="max-w-2xl mx-auto mt-8">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">QR Code para Perguntas</CardTitle>
              <CardDescription>
                Exiba este código no telão para que o público envie perguntas via celular.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-8 space-y-8">
              <div className="p-4 bg-white border-2 border-dashed rounded-2xl shadow-sm">
                <img src={qrCodeUrl} alt="QR Code Q&A" className="w-64 h-64 md:w-80 md:h-80" />
              </div>

              <div className="w-full space-y-2">
                <Label>Link Público Direto</Label>
                <div className="flex gap-2">
                  <Input readOnly value={qaUrl} className="font-mono text-sm bg-slate-50" />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(qaUrl)
                      toast({ title: 'Link copiado!' })
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>

              <Button size="lg" className="w-full text-lg mt-4" onClick={handleDownloadQR}>
                <Download className="w-5 h-5 mr-2" /> Baixar QR Code (Imagem PNG)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getLiveSession, getLiveMessages, sendLiveMessage } from '@/services/live'
import { LiveSession, LiveMessage } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, Send, Lock } from 'lucide-react'

export default function StudentLive() {
  const { id } = useParams()
  const { user } = useAuth()
  const [session, setSession] = useState<LiveSession | null>(null)
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [content, setContent] = useState('')
  const [isQuestion, setIsQuestion] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadData = async () => {
    if (!id) return
    const [s, m] = await Promise.all([getLiveSession(id), getLiveMessages(id)])
    setSession(s)
    setMessages(m)
  }

  useEffect(() => {
    loadData()
  }, [id])
  useRealtime('live_messages', () => {
    loadData()
  })
  useRealtime('live_sessions', () => {
    loadData()
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !session || !user) return
    await sendLiveMessage({ session: session.id, user: user.id, content, isQuestion })
    setContent('')
    setIsQuestion(false)
  }

  if (!session) return <div className="p-8 text-white">Carregando...</div>

  const iframeUrl = session.panda_video_id.startsWith('http')
    ? session.panda_video_id
    : `https://player-vz-c2b2b8c9-251.tv.pandavideo.com.br/embed/?v=${session.panda_video_id}`

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background text-foreground">
      <div className="h-16 border-b border-border flex items-center px-4 md:px-8 gap-4 bg-card shrink-0">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground rounded-full min-h-[40px] px-3"
        >
          <Link to="/plataforma/live-sessions">
            <ChevronLeft className="mr-2 w-4 h-4" /> Voltar
          </Link>
        </Button>
        <div className="h-6 w-px bg-border mx-2 hidden md:block" />
        <h1 className="font-serif font-semibold truncate text-foreground text-sm md:text-base">
          {session.title}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {session.status === 'live' && (
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#B4472E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#B4472E]"></span>
            </span>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {session.status === 'live'
              ? 'AO VIVO'
              : session.status === 'finished'
                ? 'ENCERRADA'
                : 'AGENDADA'}
          </span>
        </div>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-144px)]">
        <div className="flex-1 flex flex-col p-4 md:p-8 gap-6 overflow-y-auto">
          <div
            className="bg-black w-full rounded-[28px] overflow-hidden relative border border-border"
            style={{ paddingTop: '56.25%' }}
          >
            {session.status === 'scheduled' ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Transmissão inicia em {new Date(session.scheduled_at).toLocaleString()}
              </div>
            ) : session.status === 'finished' &&
              user?.plan_tier === 'free' &&
              user?.role !== 'admin' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card text-center p-8 gap-3">
                <Lock className="w-12 h-12 text-primary" />
                <p className="text-foreground text-lg font-serif font-semibold">
                  Conteúdo disponível para membros Prata e Ouro
                </p>
                <p className="text-muted-foreground text-sm max-w-md">
                  Faça upgrade do seu plano para acessar as gravações das aulas ao vivo.
                </p>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-primary-foreground mt-2 font-semibold px-8 min-h-[52px] rounded-full"
                >
                  <Link to="/planos">Faça um upgrade para ter acesso</Link>
                </Button>
              </div>
            ) : (
              <iframe
                src={iframeUrl}
                className="absolute top-0 left-0 w-full h-full border-none"
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
              {session.title}
            </h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm">
              {session.description}
            </p>
          </div>
        </div>
        <div className="w-full lg:w-96 shrink-0 bg-card border-l border-border flex flex-col h-full text-card-foreground">
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            <TabsList className="w-full grid grid-cols-2 rounded-none bg-muted/50 p-1 h-14 border-b border-border">
              <TabsTrigger
                value="chat"
                className="rounded-full data-[state=active]:bg-card data-[state=active]:text-foreground text-xs font-semibold"
              >
                Chat Geral
              </TabsTrigger>
              <TabsTrigger
                value="questions"
                className="rounded-full data-[state=active]:bg-card data-[state=active]:text-foreground text-xs font-semibold"
              >
                Perguntas
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-hidden relative">
              <TabsContent
                value="chat"
                className="absolute inset-0 m-0 overflow-y-auto p-4 flex flex-col gap-4"
              >
                {messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <span className="font-serif font-semibold text-foreground mr-2">
                      {m.expand?.user?.name || 'Aluno'}:
                    </span>
                    <span className="text-muted-foreground break-words">{m.content}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </TabsContent>
              <TabsContent
                value="questions"
                className="absolute inset-0 m-0 overflow-y-auto p-4 flex flex-col gap-4"
              >
                {messages
                  .filter((m) => m.is_question)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="text-sm bg-primary/10 border border-primary/20 p-4 rounded-[18px]"
                    >
                      <span className="font-serif font-semibold text-foreground block mb-1">
                        {m.expand?.user?.name || 'Aluno'} perguntou:
                      </span>
                      <span className="text-foreground/90">{m.content}</span>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </TabsContent>
            </div>
            {session.status === 'live' && (
              <form onSubmit={handleSend} className="p-4 bg-card border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs flex items-center gap-2 text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isQuestion}
                      onChange={(e) => setIsQuestion(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    Marcar como Pergunta
                  </label>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="rounded-full border-border bg-card text-foreground min-h-[44px] px-4"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="shrink-0 rounded-full w-11 h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}

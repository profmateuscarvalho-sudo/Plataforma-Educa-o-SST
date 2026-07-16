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
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-slate-950 text-slate-200">
      <div className="h-16 border-b border-white/10 flex items-center px-4 md:px-8 gap-4 bg-slate-900 shrink-0">
        <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
          <Link to="/plataforma/live-sessions">
            <ChevronLeft className="mr-2 w-4 h-4" /> Voltar
          </Link>
        </Button>
        <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />
        <h1 className="font-medium truncate text-white">{session.title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {session.status === 'live' && (
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
          <span className="text-sm font-bold uppercase tracking-wider">
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
            className="bg-black w-full rounded-2xl overflow-hidden shadow-2xl relative border border-white/5"
            style={{ paddingTop: '56.25%' }}
          >
            {session.status === 'scheduled' ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                Transmissão inicia em {new Date(session.scheduled_at).toLocaleString()}
              </div>
            ) : session.status === 'finished' &&
              user?.plan_tier === 'free' &&
              user?.role !== 'admin' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-center p-8 gap-3">
                <Lock className="w-12 h-12 text-amber-400" />
                <p className="text-white text-lg font-semibold">
                  Conteúdo disponível para membros Prata e Ouro
                </p>
                <p className="text-slate-400 text-sm max-w-md">
                  Faça upgrade do seu plano para acessar as gravações das aulas ao vivo.
                </p>
                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white mt-2">
                  <Link to="/planos">Desbloquear com Plano Prata</Link>
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
            <h2 className="text-2xl font-serif font-bold text-white mb-2">{session.title}</h2>
            <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">
              {session.description}
            </p>
          </div>
        </div>
        <div className="w-full lg:w-96 shrink-0 bg-slate-900 border-l border-white/10 flex flex-col h-full">
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            <TabsList className="w-full grid grid-cols-2 rounded-none bg-slate-950 p-0 h-14">
              <TabsTrigger
                value="chat"
                className="rounded-none data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Chat Geral
              </TabsTrigger>
              <TabsTrigger
                value="questions"
                className="rounded-none data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-primary"
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
                    <span className="font-bold text-primary mr-2">
                      {m.expand?.user?.name || 'Aluno'}:
                    </span>
                    <span className="text-slate-300 break-words">{m.content}</span>
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
                      className="text-sm bg-primary/10 border border-primary/20 p-3 rounded-lg"
                    >
                      <span className="font-bold text-primary block mb-1">
                        {m.expand?.user?.name || 'Aluno'} perguntou:
                      </span>
                      <span className="text-slate-200">{m.content}</span>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </TabsContent>
            </div>
            {session.status === 'live' && (
              <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs flex items-center gap-2 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isQuestion}
                      onChange={(e) => setIsQuestion(e.target.checked)}
                      className="rounded bg-slate-800 border-white/20"
                    />
                    Marcar como Pergunta
                  </label>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="bg-slate-900 border-white/10"
                  />
                  <Button type="submit" size="icon">
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

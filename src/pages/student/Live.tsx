import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getLiveSession, getLiveMessages, sendLiveMessage } from '@/services/live'
import { LiveSession, LiveMessage } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { useProtectedVideo } from '@/hooks/use-protected-video'
import { LockedVideo } from '@/components/student/LockedVideo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, Loader2, Radio } from 'lucide-react'

export default function StudentLive() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [session, setSession] = useState<LiveSession | null>(null)
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)

  // Link do vídeo da live NUNCA vem do registro (a guarda do servidor esconde
  // o campo de quem não tem direito): busca pela rota protegida ao abrir.
  const protectedVideo = useProtectedVideo(session?.id || null, 'live')

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const s = await getLiveSession(id)
        setSession(s)
      } catch {
        setSession(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const msgs = await getLiveMessages(id)
        setMessages(msgs)
      } catch {
        setMessages([])
      }
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [id])

  const handleSend = async () => {
    if (!user || !id || !newMsg.trim()) return
    const text = newMsg.trim()
    setNewMsg('')
    try {
      const created = await sendLiveMessage({ session: id, content: text })
      setMessages((prev) => [...prev, created])
    } catch {
      // mensagem duplicada localmente apenas se falhar — mantém simples
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando live...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Live não encontrada.</p>
          <Button variant="outline" asChild>
            <Link to="/plataforma/live-sessions">Voltar para lives</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/plataforma/live-sessions">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{session.title}</p>
              <p className="text-xs text-muted-foreground">
                {session.status === 'live' ? (
                  <span className="text-red-500 font-medium flex items-center gap-1">
                    <Radio className="w-3 h-3" /> Ao vivo agora
                  </span>
                ) : (
                  'Aula ao vivo'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Player / bloqueio */}
        <div className="space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            {protectedVideo.unlocked && protectedVideo.video?.url ? (
              <iframe
                src={protectedVideo.video.url}
                className="w-full h-full"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                title={session.title}
              />
            ) : protectedVideo.loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <LockedVideo message="Aulas ao vivo estão disponíveis apenas para assinantes dos planos Prata e Ouro." />
            )}
          </div>

          {session.description && (
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {session.description}
              </p>
            </div>
          )}
        </div>

        {/* Chat */}
        <aside className="flex flex-col rounded-xl border border-border bg-card h-[70vh] lg:h-auto">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Chat da live</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhuma mensagem ainda. Diga olá!
              </p>
            )}
            {messages.map((m) => {
              const author = m.expand?.user
              return (
                <div key={m.id} className="text-sm">
                  <span className="font-semibold text-primary">
                    {author?.name || 'Usuário'}
                  </span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {new Date(m.created).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <p className="text-foreground/90 break-words">{m.content}</p>
                </div>
              )
            })}
          </div>
          {user ? (
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Escreva uma mensagem..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button size="icon" onClick={handleSend} disabled={!newMsg.trim()} className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="p-3 border-t border-border">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">Entrar para participar do chat</Link>
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

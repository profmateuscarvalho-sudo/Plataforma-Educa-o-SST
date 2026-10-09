import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLiveSessions } from '@/services/live'
import { useRealtime } from '@/hooks/use-realtime'
import { useTrackAccess } from '@/hooks/use-track-access'
import { LiveSession } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Radio, Calendar, User, Play, Video, Clock } from 'lucide-react'

const getPandaUrl = (val?: string) => {
  if (!val) return ''
  if (val.includes('<iframe') || val.includes('src="')) {
    const m = val.match(/src="([^"]+)"/)
    return m ? m[1] : ''
  }
  if (val.startsWith('http')) return val
  return `https://player-vz-c2b2b8c9-251.tv.pandavideo.com.br/embed/?v=${val}`
}

const fmtDate = (d: string) => {
  const dt = new Date(d)
  return {
    date: dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }
}

export default function LiveSessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<LiveSession | null>(null)

  useTrackAccess('Aulas ao Vivo')

  const load = () => {
    getLiveSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('live_sessions', () => {
    load()
  })

  if (loading) return <div className="p-12 text-center text-slate-500">Carregando...</div>

  const liveNow = sessions.filter((s) => s.status === 'live')
  const scheduled = sessions
    .filter((s) => s.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const recordings = sessions.filter((s) => s.status === 'finished')

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background text-foreground">
      <div className="border-b border-border bg-card py-8 px-4">
        <div className="container max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/plataforma')}
            className="text-muted-foreground hover:text-foreground mb-4 -ml-4 rounded-full min-h-[40px] px-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Hub
          </Button>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground flex items-center gap-3">
            <Radio className="w-8 h-8 text-primary" /> Aulas ao Vivo
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Acompanhe transmissões ao vivo e assista gravações de sessões anteriores.
          </p>
          <div className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-primary/10 border border-border text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide">
              Início das transmissões em Agosto
            </span>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl px-4 py-8 space-y-10">
        {liveNow.length > 0 && (
          <section className="animate-fade-in">
            <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#B4472E] animate-pulse" /> Ao Vivo Agora
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveNow.map((s) => (
                <div
                  key={s.id}
                  className="bg-card text-card-foreground rounded-[28px] border border-border overflow-hidden hover:border-foreground/30 transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-muted flex items-center justify-center">
                    <div className="bg-[#FAE7E1] text-[#B4472E] dark:bg-[#B4472E]/30 dark:text-[#FAE7E1] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-[#B4472E]/30">
                      <Radio className="w-3.5 h-3.5 animate-pulse" /> AO VIVO
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-semibold text-lg text-foreground mb-2">
                        {s.title}
                      </h3>
                      {s.instructor_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <User className="w-4 h-4 text-primary" /> {s.instructor_name}
                        </p>
                      )}
                    </div>
                    <Button
                      className="w-full mt-5 min-h-[52px] rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      onClick={() => navigate(`/plataforma/live/${s.id}`)}
                    >
                      Acessar Transmissão
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="animate-fade-in">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Próximas Transmissões
          </h2>
          {scheduled.length === 0 ? (
            <div className="bg-card text-card-foreground p-8 rounded-[28px] border border-border text-center text-muted-foreground text-sm">
              Nenhuma transmissão programada.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduled.map((s) => {
                const { date, time } = fmtDate(s.scheduled_at)
                return (
                  <div
                    key={s.id}
                    className="bg-card text-card-foreground rounded-[28px] border border-border p-6 hover:border-foreground/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="font-serif font-semibold text-lg text-foreground mb-3 line-clamp-2">
                        {s.title}
                      </h3>
                      {s.instructor_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                          <User className="w-4 h-4 text-primary" /> {s.instructor_name}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-primary" /> {date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-primary" /> {time}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full min-h-[52px] rounded-full border-[1.5px] border-foreground bg-transparent text-foreground opacity-60 font-semibold"
                      disabled
                    >
                      Agendada
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="animate-fade-in">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" /> Gravações
          </h2>
          {recordings.length === 0 ? (
            <div className="bg-card text-card-foreground p-8 rounded-[28px] border border-border text-center text-muted-foreground text-sm">
              Nenhuma gravação disponível.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordings.map((s) => (
                <div
                  key={s.id}
                  className="bg-card text-card-foreground rounded-[28px] border border-border overflow-hidden hover:border-foreground/30 transition-all group cursor-pointer"
                  onClick={() => setPlaying(s)}
                >
                  <div className="relative aspect-video bg-muted">
                    <img
                      src="https://img.usecurling.com/p/800/500?q=video%20recording&color=gray"
                      alt={s.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif font-semibold text-foreground mb-1 line-clamp-2 text-base">
                      {s.title}
                    </h3>
                    {s.instructor_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                        <User className="w-4 h-4 text-primary" /> {s.instructor_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={!!playing} onOpenChange={(open) => !open && setPlaying(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-card text-card-foreground border border-border rounded-[28px]">
          <DialogTitle className="sr-only">{playing?.title}</DialogTitle>
          {playing && (
            <div className="flex flex-col">
              <div className="aspect-video bg-black">
                {getPandaUrl(playing.panda_video_id) ? (
                  <iframe
                    src={getPandaUrl(playing.panda_video_id)}
                    className="w-full h-full border-none"
                    allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    Vídeo não disponível.
                  </div>
                )}
              </div>
              <div className="p-6 bg-card border-t border-border">
                <h3 className="text-foreground font-serif font-semibold text-lg">
                  {playing.title}
                </h3>
                {playing.instructor_name && (
                  <p className="text-muted-foreground text-xs mt-1">{playing.instructor_name}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

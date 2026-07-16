import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLiveSessions } from '@/services/live'
import { useRealtime } from '@/hooks/use-realtime'
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
    <div className="min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="bg-gradient-to-br from-red-700 via-slate-800 to-slate-900 text-white py-8 px-4">
        <div className="container max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/plataforma')}
            className="text-white/80 hover:text-white mb-4 -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Hub
          </Button>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white flex items-center gap-3">
            <Radio className="w-8 h-8 text-red-400" /> Aulas ao Vivo
          </h1>
          <p className="text-white/60 mt-2">
            Acompanhe transmissões ao vivo e assista gravações de sessões anteriores.
          </p>
          <div className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 backdrop-blur-sm shadow-lg">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-bold tracking-wide">
              Início das transmissões em Agosto
            </span>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl px-4 py-8 space-y-10">
        {liveNow.length > 0 && (
          <section className="animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> Ao Vivo Agora
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveNow.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
                    <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 animate-pulse" /> AO VIVO
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif font-bold text-slate-800 mb-2">{s.title}</h3>
                    {s.instructor_name && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <User className="w-4 h-4" /> {s.instructor_name}
                      </p>
                    )}
                    <Button
                      className="w-full mt-4 bg-red-600 hover:bg-red-700"
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
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Próximas Transmissões
          </h2>
          {scheduled.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
              Nenhuma transmissão programada.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduled.map((s) => {
                const { date, time } = fmtDate(s.scheduled_at)
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="font-serif font-bold text-slate-800 mb-3 line-clamp-2">
                      {s.title}
                    </h3>
                    {s.instructor_name && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-2">
                        <User className="w-4 h-4" /> {s.instructor_name}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" /> {date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" /> {time}
                      </span>
                    </div>
                    <Button variant="outline" className="w-full" disabled>
                      Agendada
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="animate-fade-in">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" /> Gravações
          </h2>
          {recordings.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
              Nenhuma gravação disponível.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordings.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                  onClick={() => setPlaying(s)}
                >
                  <div className="relative aspect-video bg-slate-900">
                    <img
                      src="https://img.usecurling.com/p/800/500?q=video%20recording&color=gray"
                      alt={s.title}
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif font-bold text-slate-800 mb-1 line-clamp-2">
                      {s.title}
                    </h3>
                    {s.instructor_name && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <User className="w-4 h-4" /> {s.instructor_name}
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
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-black border-none">
          <DialogTitle className="sr-only">{playing?.title}</DialogTitle>
          {playing && (
            <div className="flex flex-col">
              <div className="aspect-video">
                {getPandaUrl(playing.panda_video_id) ? (
                  <iframe
                    src={getPandaUrl(playing.panda_video_id)}
                    className="w-full h-full border-none"
                    allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    Vídeo não disponível.
                  </div>
                )}
              </div>
              <div className="p-4 bg-black">
                <h3 className="text-white font-serif font-bold">{playing.title}</h3>
                {playing.instructor_name && (
                  <p className="text-white/60 text-sm mt-1">{playing.instructor_name}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

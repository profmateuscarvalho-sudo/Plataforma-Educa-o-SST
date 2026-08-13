import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  ChevronRight,
  CheckCircle2,
  BarChart3,
  Award,
  Target,
  TrendingUp,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BackToHub } from '@/components/student/BackToHub'
import pb from '@/lib/pocketbase/client'
import { getSimulados, getUserSimuladoSubmissions } from '@/services/simulados'
import type { Simulado, SimuladoSubmission } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { useTrackAccess } from '@/hooks/use-track-access'

const ph = (q: string, w = 800, h = 500) => `https://img.usecurling.com/p/${w}/${h}?q=${q}`

export default function StudentSimulados() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [submissions, setSubmissions] = useState<SimuladoSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useTrackAccess('Simulados')

  useEffect(() => {
    if (!user) return
    Promise.all([
      getSimulados(true).catch(() => [] as Simulado[]),
      getUserSimuladoSubmissions(user.id).catch(() => [] as SimuladoSubmission[]),
    ])
      .then(([s, sub]) => {
        setSimulados(s)
        setSubmissions(sub)
      })
      .finally(() => setLoading(false))
  }, [user])

  const completedBySimulado = (simuladoId: string) =>
    submissions.filter((s) => s.simulado === simuladoId)

  const bestSubmission = (simuladoId: string) => {
    const list = completedBySimulado(simuladoId)
    if (!list.length) return null
    return list.reduce(
      (best, cur) => ((cur.percentage ?? 0) > (best.percentage ?? 0) ? cur : best),
      list[0],
    )
  }

  const totalCompleted = submissions.length
  const avgScore = totalCompleted
    ? Math.round(submissions.reduce((acc, s) => acc + (s.percentage ?? 0), 0) / totalCompleted)
    : 0

  const stats = [
    {
      label: 'Simulados Disponíveis',
      value: simulados.length,
      icon: ClipboardList,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      label: 'Simulados Concluídos',
      value: totalCompleted,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Média de Acertos',
      value: `${avgScore}%`,
      icon: Target,
      color: 'from-amber-500 to-orange-600',
    },
  ]

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50">
      <div className="bg-gradient-to-br from-cyan-700 via-blue-800 to-slate-900 text-white py-8">
        <div className="container px-4 max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold">Simulados</h1>
              <p className="text-white/70 text-sm">Teste seus conhecimentos em SST</p>
            </div>
          </div>
          <BackToHub className="bg-white/15 hover:bg-white/25 text-white" />
        </div>
      </div>

      <div className="container px-4 max-w-6xl py-8">
        {/* Performance indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}
              >
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 leading-none">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Simulados list */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-slate-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : simulados.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">Nenhum simulado disponível</h3>
            <p className="text-slate-500 mt-2">Volte em breve para novos desafios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulados.map((simulado) => {
              const best = bestSubmission(simulado.id)
              const attempts = completedBySimulado(simulado.id).length
              return (
                <Card
                  key={simulado.id}
                  className="overflow-hidden hover:shadow-lg transition-all group flex flex-col"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    <img
                      src={
                        simulado.banner
                          ? pb.files.getUrl(simulado, simulado.banner)
                          : ph('exam%20test')
                      }
                      alt={simulado.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {attempts > 0 ? (
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Concluído · {attempts}x
                        </Badge>
                        {best && (
                          <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-none">
                            <Award className="w-3.5 h-3.5 mr-1" />
                            {best.percentage ?? 0}%
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-white/90 text-slate-700 hover:bg-white border-none">
                          Não iniciado
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <h3 className="text-lg font-bold line-clamp-2">{simulado.title}</h3>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {simulado.description || 'Sem descrição.'}
                    </p>
                    {best && (
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Melhor desempenho
                        </span>
                        <span className="font-semibold text-slate-700">
                          {best.score ?? 0}/{best.total_questions ?? 0} acertos
                        </span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-4 border-t">
                    <Button
                      className="w-full group"
                      onClick={() => navigate(`/plataforma/simulados/${simulado.id}`)}
                    >
                      {attempts > 0 ? (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" /> Refazer
                        </>
                      ) : (
                        <>Iniciar</>
                      )}
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* History */}
        {submissions.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" /> Histórico de Desempenho
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {submissions.slice(0, 10).map((s) => {
                  const sim = s.expand?.simulado
                  const pct = s.percentage ?? 0
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                          pct >= 70
                            ? 'bg-emerald-100 text-emerald-700'
                            : pct >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {pct}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">
                          {sim?.title || 'Simulado removido'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {s.completed_at
                            ? new Date(s.completed_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                      <span className="text-sm text-slate-500 shrink-0">
                        {s.score ?? 0}/{s.total_questions ?? 0}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

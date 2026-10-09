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
import { cn } from '@/lib/utils'
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
    },
    {
      label: 'Simulados Concluídos',
      value: totalCompleted,
      icon: CheckCircle2,
    },
    {
      label: 'Média de Acertos',
      value: `${avgScore}%`,
      icon: Target,
    },
  ]

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background text-foreground">
      <div className="border-b border-border bg-card">
        <div className="container px-4 max-w-6xl py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[18px] bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">
                Simulados
              </h1>
              <p className="text-muted-foreground text-sm">Teste seus conhecimentos em SST</p>
            </div>
          </div>
          <BackToHub className="border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-muted rounded-full min-h-[44px] px-5" />
        </div>
      </div>

      <div className="container px-4 max-w-6xl py-8">
        {/* Performance indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-card text-card-foreground rounded-[28px] border border-border p-6 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border text-foreground">
                <s.icon className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold font-serif text-foreground leading-none">
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Simulados list */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 bg-muted/60 animate-pulse rounded-[28px] border border-border"
              />
            ))}
          </div>
        ) : simulados.length === 0 ? (
          <div className="bg-card text-card-foreground rounded-[28px] border border-border p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-serif font-semibold text-foreground">
              Nenhum simulado disponível
            </h3>
            <p className="text-muted-foreground text-sm mt-2">
              Volte em breve para novos desafios.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulados.map((simulado) => {
              const best = bestSubmission(simulado.id)
              const attempts = completedBySimulado(simulado.id).length
              return (
                <Card
                  key={simulado.id}
                  className="rounded-[28px] border-border bg-card text-card-foreground overflow-hidden shadow-none flex flex-col"
                >
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={
                        simulado.banner
                          ? pb.files.getUrl(simulado, simulado.banner)
                          : ph('exam%20test')
                      }
                      alt={simulado.title}
                      className="w-full h-full object-cover transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    {attempts > 0 ? (
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <Badge className="bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A] dark:text-[#E3F1E9] border border-[#1F6B4A]/30 rounded-full px-3 py-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Concluído · {attempts}x
                        </Badge>
                        {best && (
                          <Badge className="bg-primary text-primary-foreground border-none rounded-full px-3 py-1 font-bold">
                            <Award className="w-3.5 h-3.5 mr-1" />
                            {best.percentage ?? 0}%
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-card/90 text-foreground border border-border rounded-full px-3 py-1 font-medium">
                          Não iniciado
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-6 pb-2">
                    <h3 className="text-lg font-serif font-semibold text-foreground line-clamp-2">
                      {simulado.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="px-6 flex-1">
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {simulado.description || 'Sem descrição.'}
                    </p>
                    {best && (
                      <div className="mt-3 p-3 rounded-[16px] bg-muted/60 border border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Melhor desempenho
                        </span>
                        <span className="font-semibold text-foreground">
                          {best.score ?? 0}/{best.total_questions ?? 0} acertos
                        </span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-6 pt-4 border-t border-border">
                    <Button
                      onClick={() => navigate(`/plataforma/simulados/${simulado.id}`)}
                      className={cn(
                        'w-full min-h-[52px] rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        attempts > 0
                          ? 'border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-muted'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90',
                      )}
                    >
                      {attempts > 0 ? (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" /> Refazer
                        </>
                      ) : (
                        <>Iniciar</>
                      )}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* History */}
        {submissions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Histórico de Desempenho
            </h2>
            <div className="bg-card text-card-foreground rounded-[28px] border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {submissions.slice(0, 10).map((s) => {
                  const sim = s.expand?.simulado
                  const pct = s.percentage ?? 0
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-4 p-5 hover:bg-muted/40 transition-colors"
                    >
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                          pct >= 70
                            ? 'bg-[#E3F1E9] text-[#1F6B4A] dark:bg-[#1F6B4A]/30 dark:text-[#E3F1E9]'
                            : pct >= 50
                              ? 'bg-primary/20 text-foreground'
                              : 'bg-[#FAE7E1] text-[#B4472E] dark:bg-[#B4472E]/30 dark:text-[#FAE7E1]'
                        }`}
                      >
                        {pct}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {sim?.title || 'Simulado removido'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
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
                      <span className="text-sm text-muted-foreground shrink-0 font-medium">
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

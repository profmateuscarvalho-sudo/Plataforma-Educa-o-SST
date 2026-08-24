import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, Activity, TrendingUp, Crown, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getAccessEvents, AccessEvent } from '@/services/access_events'
import { User } from '@/types'

type StudentRow = {
  user: User
  total: number
  logins: number
  lastAccess: Date | null
}

const AREA_LABELS: Record<string, string> = {
  Hub: 'Hub de Estudos',
  Cursos: 'Cursos',
  Revistas: 'Revistas',
  Mentorias: 'Mentorias',
  Documentários: 'Documentários',
  'Aulas ao Vivo': 'Aulas ao Vivo',
  Simulados: 'Simulados',
  'Caderno Virtual': 'Caderno Virtual',
  'Feed de Cases': 'Ágora de Debates',
  'Ágora de Debates': 'Ágora de Debates',
  'Criar Debate Ágora': 'Criar Debate Ágora',
  'Sala do Debate Ágora': 'Sala do Debate Ágora',
  'Meu Perfil': 'Meu Perfil',
}

const AREA_COLORS: Record<string, string> = {
  Hub: 'from-emerald-500 to-teal-600',
  Cursos: 'from-blue-500 to-indigo-600',
  Revistas: 'from-cyan-500 to-blue-600',
  Mentorias: 'from-rose-500 to-pink-600',
  Documentários: 'from-purple-500 to-indigo-600',
  'Aulas ao Vivo': 'from-red-500 to-rose-600',
  Simulados: 'from-cyan-500 to-blue-600',
  'Caderno Virtual': 'from-amber-500 to-orange-600',
  'Feed de Cases': 'from-[#C17A4E] to-[#8C4F2B]',
  'Ágora de Debates': 'from-[#C17A4E] to-[#8C4F2B]',
  'Criar Debate Ágora': 'from-[#C17A4E] to-[#8C4F2B]',
  'Sala do Debate Ágora': 'from-[#C17A4E] to-[#8C4F2B]',
  'Meu Perfil': 'from-slate-500 to-slate-700',
}

const prettyArea = (area: string) => AREA_LABELS[area] || area

export default function AdminAccessDashboard() {
  const [events, setEvents] = useState<AccessEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAccessEvents(30)
      .then((rows) => {
        if (!cancelled) setEvents(rows)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Falha ao carregar eventos de acesso:', err)
        toast({
          title: 'Não foi possível carregar os acessos',
          description: 'Tente recarregar a página em alguns instantes.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Start of today (local) — used for "acessos no dia"
  const startOfToday = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const todayCount = useMemo(
    () => events.filter((e) => new Date(e.created) >= startOfToday).length,
    [events, startOfToday],
  )

  const totalAccesses = events.length

  // Ranking por aluno
  const studentRows: StudentRow[] = useMemo(() => {
    const map = new Map<string, StudentRow>()
    for (const e of events) {
      const u = (e.expand?.user as User) || ({ id: e.user } as unknown as User)
      if (!u) continue
      const existing = map.get(e.user)
      const created = new Date(e.created)
      if (existing) {
        existing.total += 1
        if (e.event_type === 'login') existing.logins += 1
        if (!existing.lastAccess || created > existing.lastAccess) {
          existing.lastAccess = created
        }
      } else {
        map.set(e.user, {
          user: u,
          total: 1,
          logins: e.event_type === 'login' ? 1 : 0,
          lastAccess: created,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [events])

  // Ranking por área
  const areaRanking = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of events) {
      map.set(e.area, (map.get(e.area) || 0) + 1)
    }
    return Array.from(map.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
  }, [events])

  const maxAreaCount = areaRanking[0]?.count || 1

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Dashboard de Acessos</h2>
          <p className="text-slate-500">
            Acompanhe o engajamento dos alunos e as áreas mais visitadas (últimos 30 dias).
          </p>
        </div>
        <Badge variant="outline" className="text-slate-600">
          {totalAccesses} eventos registrados
        </Badge>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Acessos Hoje</CardTitle>
            <Activity className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{todayCount}</div>
            <p className="text-xs text-slate-400 mt-1">Eventos de acesso no dia de hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total (30 dias)</CardTitle>
            <BarChart3 className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{totalAccesses}</div>
            <p className="text-xs text-slate-400 mt-1">Todos os eventos no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Alunos Ativos</CardTitle>
            <Users className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{studentRows.length}</div>
            <p className="text-xs text-slate-400 mt-1">Alunos com pelo menos 1 acesso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Área Mais Acessada</CardTitle>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-secondary">
              {areaRanking[0] ? prettyArea(areaRanking[0].area) : '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {areaRanking[0] ? `${areaRanking[0].count} acessos` : 'Sem dados'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Ranking por aluno */}
        <Card className="border border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Acessos por Aluno
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
              </div>
            ) : studentRows.length === 0 ? (
              <p className="text-center text-slate-400 py-12">
                Nenhum acesso registrado ainda. Os dados aparecem conforme os alunos navegam pela
                plataforma.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200">
                      <TableHead className="text-slate-600 w-12 text-center">#</TableHead>
                      <TableHead className="text-slate-600">Aluno</TableHead>
                      <TableHead className="text-slate-600 text-center">Total de Acessos</TableHead>
                      <TableHead className="text-slate-600 text-center">Logins</TableHead>
                      <TableHead className="text-slate-600">Último Acesso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentRows.map((row, idx) => (
                      <TableRow key={row.user.id} className="border-slate-100">
                        <TableCell className="text-center">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600">
                              <Crown className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-slate-400">{idx + 1}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              {row.user.avatar ? (
                                <AvatarImage
                                  src={pb.files.getUrl(row.user, row.user.avatar)}
                                  alt={row.user.name}
                                />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {row.user.name?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 truncate">
                                {row.user.name || 'Sem nome'}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{row.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                            {row.total}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-slate-600 text-sm">
                          {row.logins}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {row.lastAccess
                            ? row.lastAccess.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking por área */}
        <Card className="border border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" /> Áreas Mais Acessadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
              </div>
            ) : areaRanking.length === 0 ? (
              <p className="text-center text-slate-400 py-12">Sem dados de áreas ainda.</p>
            ) : (
              areaRanking.map((row, idx) => {
                const pct = Math.round((row.count / maxAreaCount) * 100)
                const gradient = AREA_COLORS[row.area] || 'from-slate-500 to-slate-700'
                return (
                  <div key={row.area}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-4">{idx + 1}.</span>
                        {prettyArea(row.area)}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{row.count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

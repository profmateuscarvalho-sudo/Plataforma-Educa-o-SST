import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Mentorship, MentorshipSlot } from '@/types'
import {
  copySlotsFromDay,
  createSlot,
  deleteSlot,
  getMentorshipSlots,
} from '@/services/mentor-schedule'

// ---------------------------------------------------------------------------
// PAINEL "DISPONIBILIDADE" — calendário mensal de slots explícitos.
// Clique num dia abre o painel de horários: adicionar 1 horário (fim calculado
// pela duração da sessão) ou "adicionar vários" (faixa inicial→final gera N
// horários). Horário LIVRE pode ser removido; vendido NÃO (só cancelando a
// sessão). "Copiar horários deste dia para…" replica em outras datas.
// ---------------------------------------------------------------------------

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function hojeSp(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function mesDe(dia: string): string {
  return dia.slice(0, 7)
}

/** Data (relógio SP) como UTC real, para criar start_at/end_at */
function spParaUtcIso(dia: string, hhmm: string): string {
  const [a, m, d] = dia.split('-').map(Number)
  const [hh, mm] = hhmm.split(':').map(Number)
  return new Date(Date.UTC(a, m - 1, d, hh, mm, 0) - 3 * 3600 * 1000).toISOString()
}

/** hh:mm do relógio SP a partir de um start_at ISO */
function horaDe(iso: string): string {
  try {
    return new Date(new Date(iso).getTime() + 3 * 3600 * 1000).toISOString().slice(11, 16)
  } catch (_) {
    return ''
  }
}

function addMinutos(hhmm: string, minutos: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutos
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function diasDoMes(ano: number, mes0: number): (string | null)[] {
  const primeiro = new Date(Date.UTC(ano, mes0, 1)).getUTCDay()
  const total = new Date(Date.UTC(ano, mes0 + 1, 0)).getUTCDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < primeiro; i++) cells.push(null)
  for (let d = 1; d <= total; d++) {
    cells.push(`${ano}-${String(mes0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

type DayStatus = 'livre' | 'vendido' | 'misto' | 'passado'

interface Props {
  mentorship: Mentorship
}

export function MentorshipSlotCalendar({ mentorship }: Props) {
  const { toast } = useToast()
  const hoje = useMemo(() => hojeSp(), [])
  const [mes, setMes] = useState(() => hojeSp().slice(0, 7))
  const [slots, setSlots] = useState<MentorshipSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [diaAberto, setDiaAberto] = useState<string | null>(null)

  const sessionMinutes = Math.max(15, Number(mentorship.session_minutes) || 60)

  const carregar = useCallback(async () => {
    if (!mentorship.id) return
    setLoading(true)
    const lista = await getMentorshipSlots(mentorship.id, mes)
    setSlots(lista)
    setLoading(false)
  }, [mentorship.id, mes])

  useEffect(() => {
    carregar()
  }, [carregar])

  /** mapa dia → slots do dia */
  const porDia = useMemo(() => {
    const map = new Map<string, MentorshipSlot[]>()
    for (const s of slots) {
      const dia = new Date(new Date(s.start_at).getTime() + 3 * 3600 * 1000)
        .toISOString()
        .slice(0, 10)
      if (!map.has(dia)) map.set(dia, [])
      map.get(dia)!.push(s)
    }
    return map
  }, [slots])

  function statusDoDia(dia: string, lista: MentorshipSlot[]): DayStatus | null {
    if (!lista.length) return null
    if (dia < hoje) return 'passado'
    const temLivre = lista.some((s) => s.status === 'livre')
    const todosVendidos = lista.every((s) => s.status === 'vendido' || s.status === 'bloqueado')
    if (todosVendidos) return 'vendido'
    if (temLivre) return 'livre'
    return 'misto'
  }

  // --- diálogo do dia ---
  const slotsDia = diaAberto ? porDia.get(diaAberto) || [] : []
  const [horaUnica, setHoraUnica] = useState('19:00')
  const [faixaInicio, setFaixaInicio] = useState('19:00')
  const [faixaFim, setFaixaFim] = useState('22:00')
  const [copiarAberto, setCopiarAberto] = useState(false)
  const [destinosSelecionados, setDestinosSelecionados] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)

  const futurosDoMes = useMemo(
    () =>
      diasDoMes(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1).filter(
        (d): d is string => !!d && d >= hoje,
      ),
    [mes, hoje],
  )

  async function adicionarUm() {
    if (!diaAberto) return
    setSalvando(true)
    try {
      await createSlot({
        mentorship: mentorship.id,
        mentor: mentorship.mentor || undefined,
        start_at: spParaUtcIso(diaAberto, horaUnica),
        end_at: spParaUtcIso(diaAberto, addMinutos(horaUnica, sessionMinutes)),
      })
      toast({ title: 'Horário adicionado' })
      await carregar()
    } catch (err: any) {
      toast({
        title: 'Erro ao adicionar horário',
        description: err?.message || String(err),
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  async function adicionarVarios() {
    if (!diaAberto) return
    if (faixaFim <= faixaInicio) {
      toast({
        title: 'Faixa inválida',
        description: 'O fim deve ser depois do início.',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      const gerados: { ini: string; fim: string }[] = []
      let cursor = faixaInicio
      while (addMinutos(cursor, sessionMinutes) <= faixaFim) {
        gerados.push({ ini: cursor, fim: addMinutos(cursor, sessionMinutes) })
        cursor = addMinutos(cursor, sessionMinutes)
      }
      if (!gerados.length) {
        toast({
          title: 'Nada para gerar',
          description: `A faixa é menor que a sessão de ${sessionMinutes} min.`,
          variant: 'destructive',
        })
        setSalvando(false)
        return
      }
      for (const g of gerados) {
        await createSlot({
          mentorship: mentorship.id,
          mentor: mentorship.mentor || undefined,
          start_at: spParaUtcIso(diaAberto, g.ini),
          end_at: spParaUtcIso(diaAberto, g.fim),
        })
      }
      toast({ title: `${gerados.length} horário(s) adicionado(s)` })
      await carregar()
    } catch (err: any) {
      toast({
        title: 'Erro ao adicionar horários',
        description: err?.message || String(err),
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  async function remover(slot: MentorshipSlot) {
    try {
      await deleteSlot(slot)
      await carregar()
    } catch (err: any) {
      toast({
        title: 'Não foi possível remover',
        description: err?.message || String(err),
        variant: 'destructive',
      })
    }
  }

  async function copiarPara() {
    if (!diaAberto || destinosSelecionados.length === 0) return
    setSalvando(true)
    try {
      const horarios = slotsDia.filter((s) => s.status === 'livre').map((s) => horaDe(s.start_at))
      if (!horarios.length) {
        toast({ title: 'Nenhum horário livre para copiar neste dia', variant: 'destructive' })
        setSalvando(false)
        return
      }
      const criados = await copySlotsFromDay(
        mentorship.id,
        mentorship.mentor || undefined,
        diaAberto,
        horarios,
        destinosSelecionados,
        sessionMinutes,
      )
      toast({ title: `${criados.length} horário(s) copiado(s)` })
      setCopiarAberto(false)
      setDestinosSelecionados([])
      await carregar()
    } catch (err: any) {
      toast({
        title: 'Erro ao copiar',
        description: err?.message || String(err),
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  function trocarMes(delta: number) {
    const [a, m] = mes.split('-').map(Number)
    const d = new Date(Date.UTC(a, m - 1 + delta, 1))
    setMes(d.toISOString().slice(0, 7))
  }

  const cells = diasDoMes(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1)
  const CORES: Record<DayStatus, string> = {
    livre: 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200',
    vendido: 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200',
    misto: 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200',
    passado: 'bg-muted text-muted-foreground border-border',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Disponibilidade — calendário mensal</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => trocarMes(-1)}>
              ←
            </Button>
            <span className="min-w-[9.5rem] text-center text-sm font-medium">
              {MESES[Number(mes.slice(5, 7)) - 1]} {mes.slice(0, 4)}
            </span>
            <Button variant="outline" size="sm" onClick={() => trocarMes(1)}>
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
              {DIAS_SEMANA.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {cells.map((dia, i) => {
                if (!dia) return <div key={i} />
                const lista = porDia.get(dia) || []
                const st = statusDoDia(dia, lista)
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => {
                      setDiaAberto(dia)
                      setDestinosSelecionados([])
                    }}
                    className={cn(
                      'h-16 rounded-md border p-1 text-left transition-colors',
                      st ? CORES[st] : 'border-border/60 hover:bg-muted/50',
                    )}
                  >
                    <span className="text-xs font-semibold">{Number(dia.slice(8, 10))}</span>
                    {lista.length > 0 && (
                      <span className="mt-0.5 block text-[10px] leading-tight">
                        {lista.length} horário{lista.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded border border-emerald-300 bg-emerald-100" />{' '}
                tem horário livre
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded border border-rose-300 bg-rose-100" />{' '}
                tudo vendido
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded border border-amber-300 bg-amber-100" />{' '}
                misto (reservado)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded border border-border bg-muted" />{' '}
                passado
              </span>
            </div>
          </>
        )}
      </CardContent>

      {/* --- painel do dia --- */}
      <Dialog
        open={!!diaAberto}
        onOpenChange={(o) => !o && (setDiaAberto(null), setCopiarAberto(false))}
      >
        <DialogContent className="sm:max-w-lg">
          {diaAberto && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Horários de {Number(diaAberto.slice(8, 10))}/{Number(diaAberto.slice(5, 7))}/
                  {diaAberto.slice(0, 4)}
                </DialogTitle>
                <DialogDescription>
                  Sessão de {sessionMinutes} min — o fim é calculado automaticamente.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* existentes */}
                <div className="space-y-1.5">
                  {slotsDia.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum horário neste dia.</p>
                  )}
                  {slotsDia
                    .slice()
                    .sort((a, b) => a.start_at.localeCompare(b.start_at))
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                      >
                        <span>
                          {horaDe(s.start_at)} – {horaDe(s.end_at)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              s.status === 'livre'
                                ? 'secondary'
                                : s.status === 'vendido'
                                  ? 'destructive'
                                  : 'outline'
                            }
                          >
                            {s.status}
                          </Badge>
                          {s.status === 'livre' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-destructive"
                              onClick={() => remover(s)}
                            >
                              Remover
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {s.status === 'vendido'
                                ? 'vendido — só cancelando a sessão'
                                : 'não removível'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {diaAberto >= hoje && (
                  <>
                    {/* adicionar 1 */}
                    <div className="rounded-md border p-3 space-y-2">
                      <Label className="text-sm font-medium">Adicionar horário</Label>
                      <div className="flex items-end gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Início</Label>
                          <Input
                            type="time"
                            value={horaUnica}
                            onChange={(ev) => setHoraUnica(ev.target.value)}
                            className="w-28"
                          />
                        </div>
                        <span className="pb-2 text-xs text-muted-foreground">
                          fim {addMinutos(horaUnica, sessionMinutes)}
                        </span>
                        <Button size="sm" disabled={salvando} onClick={adicionarUm}>
                          Adicionar
                        </Button>
                      </div>
                    </div>

                    {/* adicionar vários */}
                    <div className="rounded-md border p-3 space-y-2">
                      <Label className="text-sm font-medium">Adicionar vários</Label>
                      <div className="flex items-end gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Das</Label>
                          <Input
                            type="time"
                            value={faixaInicio}
                            onChange={(ev) => setFaixaInicio(ev.target.value)}
                            className="w-28"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Até</Label>
                          <Input
                            type="time"
                            value={faixaFim}
                            onChange={(ev) => setFaixaFim(ev.target.value)}
                            className="w-28"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={salvando}
                          onClick={adicionarVarios}
                        >
                          Gerar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ex.: das 19:00 às 22:00 com sessão de {sessionMinutes} min gera 19:00, 20:00
                        e 21:00.
                      </p>
                    </div>
                  </>
                )}

                {/* copiar para outras datas */}
                <div className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Copiar horários deste dia para…</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCopiarAberto((v) => !v)}
                      disabled={slotsDia.filter((s) => s.status === 'livre').length === 0}
                    >
                      {copiarAberto ? 'Fechar' : 'Escolher datas'}
                    </Button>
                  </div>
                  {copiarAberto && (
                    <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                      {futurosDoMes.filter((d) => d !== diaAberto).length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Sem datas futuras neste mês.
                        </p>
                      )}
                      {futurosDoMes
                        .filter((d) => d !== diaAberto)
                        .map((d) => (
                          <label key={d} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={destinosSelecionados.includes(d)}
                              onChange={(ev) =>
                                setDestinosSelecionados((prev) =>
                                  ev.target.checked ? [...prev, d] : prev.filter((x) => x !== d),
                                )
                              }
                            />
                            {d}
                          </label>
                        ))}
                    </div>
                  )}
                  {copiarAberto && destinosSelecionados.length > 0 && (
                    <Button size="sm" disabled={salvando} onClick={copiarPara}>
                      Copiar ({destinosSelecionados.length} data
                      {destinosSelecionados.length > 1 ? 's' : ''})
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

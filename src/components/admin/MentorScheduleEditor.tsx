import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  getMentorAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getMentorBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
} from '@/services/mentor-schedule'
import { MentorAvailability, MentorBlockedDate, Mentor } from '@/types'

// ---------------------------------------------------------------------------
// Agenda semanal (mentor_availability) + datas bloqueadas (mentor_blocked_dates)
// de um mentor. Usada dentro do modal de edição do MentorManager.
// ---------------------------------------------------------------------------

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

interface FaixaTemp {
  id?: string
  start_time: string
  end_time: string
}

export function MentorScheduleEditor({ mentor }: { mentor: Mentor }) {
  const [faixas, setFaixas] = useState<Record<number, FaixaTemp[]>>({})
  const [bloqueadas, setBloqueadas] = useState<MentorBlockedDate[]>([])
  const [motivo, setMotivo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([getMentorAvailability(mentor.id), getMentorBlockedDates(mentor.id)])
      .then(([av, bl]) => {
        if (!alive) return
        const map: Record<number, FaixaTemp[]> = {}
        for (let d = 0; d < 7; d++) map[d] = []
        av.forEach((a) => {
          if (!map[a.weekday]) map[a.weekday] = []
          map[a.weekday].push({ id: a.id, start_time: a.start_time, end_time: a.end_time })
        })
        setFaixas(map)
        setBloqueadas(bl)
      })
      .catch(console.error)
    return () => {
      alive = false
    }
  }, [mentor.id])

  const addFaixa = (weekday: number) => {
    setFaixas((prev) => ({
      ...prev,
      [weekday]: [...(prev[weekday] || []), { start_time: '19:00', end_time: '22:00' }],
    }))
  }

  const changeFaixa = (
    weekday: number,
    idx: number,
    campo: 'start_time' | 'end_time',
    valor: string,
  ) => {
    setFaixas((prev) => ({
      ...prev,
      [weekday]: prev[weekday].map((f, i) => (i === idx ? { ...f, [campo]: valor } : f)),
    }))
  }

  const removeFaixa = (weekday: number, idx: number) => {
    setFaixas((prev) => ({
      ...prev,
      [weekday]: prev[weekday].filter((_, i) => i !== idx),
    }))
  }

  const limparDia = (weekday: number) => {
    setFaixas((prev) => ({ ...prev, [weekday]: [] }))
  }

  const salvarAgenda = async () => {
    setSaving(true)
    try {
      // valida antes de gravar
      for (let d = 0; d < 7; d++) {
        for (const f of faixas[d] || []) {
          if (!HHMM.test(f.start_time) || !HHMM.test(f.end_time)) {
            throw new Error(`Horário inválido em ${DIAS[d]} (use HH:MM).`)
          }
          if (f.end_time <= f.start_time) {
            throw new Error(`Faixa de ${DIAS[d]}: o fim deve ser depois do início.`)
          }
        }
      }
      const atuais = await getMentorAvailability(mentor.id)
      const desejadas = new Set<number>()
      const payload: { weekday: number; start_time: string; end_time: string }[] = []
      for (let d = 0; d < 7; d++) {
        for (const f of faixas[d] || []) {
          desejadas.add(d)
          payload.push({ weekday: d, start_time: f.start_time, end_time: f.end_time })
        }
      }
      // remove registros que saíram
      for (const a of atuais) {
        if (!desejadas.has(a.weekday)) {
          await deleteAvailability(a.id)
        }
      }
      // grava os atuais por dia (simples: apaga os do dia e recria)
      const porDia = new Map<number, MentorAvailability[]>()
      atuais.forEach((a) => {
        const list = porDia.get(a.weekday) || []
        list.push(a)
        porDia.set(a.weekday, list)
      })
      for (const p of payload) {
        const existentes = porDia.get(p.weekday) || []
        const igual = existentes.find(
          (a) => a.start_time === p.start_time && a.end_time === p.end_time,
        )
        if (igual) continue
        for (const a of existentes) {
          await deleteAvailability(a.id).catch(() => {})
        }
        porDia.set(p.weekday, [])
        await createAvailability({ mentor: mentor.id, ...p, active: true })
      }
      toast({ title: 'Agenda semanal salva' })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar agenda',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const bloquearData = async (date: Date | undefined) => {
    if (!date) return
    try {
      const dia = format(date, 'yyyy-MM-dd')
      if (bloqueadas.some((b) => String(b.date).slice(0, 10) === dia)) {
        toast({ title: 'Data já bloqueada', variant: 'destructive' })
        return
      }
      await createBlockedDate({ mentor: mentor.id, date: `${dia} 00:00:00`, reason: motivo })
      setMotivo('')
      const atualizadas = await getMentorBlockedDates(mentor.id)
      setBloqueadas(atualizadas)
      toast({ title: 'Data bloqueada' })
    } catch (err: any) {
      toast({
        title: 'Erro ao bloquear data',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const desbloquear = async (id: string) => {
    try {
      await deleteBlockedDate(id)
      setBloqueadas((prev) => prev.filter((b) => b.id !== id))
      toast({ title: 'Data liberada' })
    } catch (err: any) {
      toast({
        title: 'Erro ao liberar data',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Agenda semanal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-secondary">Agenda semanal</p>
          <Button size="sm" onClick={salvarAgenda} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar agenda'}
          </Button>
        </div>
        <div className="space-y-2">
          {DIAS.map((dia, d) => {
            const lista = faixas[d] || []
            const ativo = lista.length > 0
            return (
              <div
                key={dia}
                className={cn(
                  'flex flex-wrap items-center gap-2 rounded-lg border p-2',
                  !ativo && 'opacity-60',
                )}
              >
                <span className="w-24 text-sm font-medium">{dia}</span>
                <Switch checked={ativo} onCheckedChange={(v) => (v ? addFaixa(d) : limparDia(d))} />
                {!ativo && <span className="text-xs text-muted-foreground">Sem atendimento</span>}
                {lista.map((f, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Input
                      type="time"
                      className="h-8 w-24"
                      value={f.start_time}
                      onChange={(e) => changeFaixa(d, i, 'start_time', e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">até</span>
                    <Input
                      type="time"
                      className="h-8 w-24"
                      value={f.end_time}
                      onChange={(e) => changeFaixa(d, i, 'end_time', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600"
                      onClick={() => removeFaixa(d, i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto h-7"
                  onClick={() => addFaixa(d)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Faixa
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Datas bloqueadas */}
      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-bold text-secondary">Datas bloqueadas</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border rounded-xl bg-slate-50 flex justify-center">
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={bloquearData}
              className="rounded-md bg-white"
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bl_motivo">Motivo do bloqueio (férias, feriado...)</Label>
            <Input
              id="bl_motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: Férias"
            />
            {bloqueadas.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma data bloqueada. Escolha uma data no calendário.
              </p>
            ) : (
              <ul className="space-y-1">
                {bloqueadas.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm"
                  >
                    <span>
                      {format(new Date(String(b.date).slice(0, 10) + 'T12:00:00'), 'dd/MM/yyyy')}
                      {b.reason ? ` — ${b.reason}` : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600"
                      onClick={() => desbloquear(b.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

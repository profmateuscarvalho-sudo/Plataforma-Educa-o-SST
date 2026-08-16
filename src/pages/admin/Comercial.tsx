import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  ETAPAS,
  diasParadoNaEtapa,
  getClientes,
  getOportunidades,
  updateOportunidadeEtapa,
} from '@/services/comercial'
import { getAdmins } from '@/services/users'
import { NewClientDialog } from '@/components/admin/comercial/NewClientDialog'
import { OportunidadeDrawer } from '@/components/admin/comercial/OportunidadeDrawer'
import { MOEDA } from '@/components/admin/comercial/types'
import type { ClienteComercial, EtapaOportunidade, OportunidadeComercial, User } from '@/types'

interface DragPayload {
  id: string
  from: EtapaOportunidade
}

export default function AdminComercial() {
  const [oportunidades, setOportunidades] = useState<OportunidadeComercial[]>([])
  const [clientes, setClientes] = useState<ClienteComercial[]>([])
  const [admins, setAdmins] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<EtapaOportunidade | null>(null)
  const [selected, setSelected] = useState<OportunidadeComercial | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)

  const [filtroResp, setFiltroResp] = useState('all')
  const [filtroOrigem, setFiltroOrigem] = useState('all')
  const [filtroPeriodo, setFiltroPeriodo] = useState('all')

  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ops, clis, adm] = await Promise.all([getOportunidades(), getClientes(), getAdmins()])
      setOportunidades(ops)
      setClientes(clis)
      setAdmins(adm)
    } catch (err) {
      toast({
        title: 'Erro ao carregar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const origensUnicas = useMemo(() => {
    const set = new Set<string>()
    clientes.forEach((c) => c.origem && set.add(c.origem))
    return Array.from(set).sort()
  }, [clientes])

  const corte = useMemo(() => {
    if (filtroPeriodo === 'all') return null
    const dias = Number(filtroPeriodo)
    if (!dias) return null
    return Date.now() - dias * 24 * 60 * 60 * 1000
  }, [filtroPeriodo])

  const filtradas = useMemo(() => {
    const clienteById = new Map(clientes.map((c) => [c.id, c]))
    return oportunidades.filter((o) => {
      if (filtroResp !== 'all') {
        if ((o.responsavel || '') !== filtroResp) return false
      }
      const cli = clienteById.get(o.cliente_id)
      if (filtroOrigem !== 'all') {
        if (!cli || cli.origem !== filtroOrigem) return false
      }
      if (corte) {
        if (new Date(o.created).getTime() < corte) return false
      }
      return true
    })
  }, [oportunidades, clientes, filtroResp, filtroOrigem, corte])

  const porEtapa = useMemo(() => {
    const map = new Map<EtapaOportunidade, OportunidadeComercial[]>()
    ETAPAS.forEach((e) => map.set(e, []))
    filtradas.forEach((o) => {
      const arr = map.get(o.etapa)
      if (arr) arr.push(o)
    })
    return map
  }, [filtradas])

  const totalValor = useMemo(
    () => filtradas.reduce((s, o) => s + (o.valor_estimado || 0), 0),
    [filtradas],
  )

  const onDragStart = (e: React.DragEvent, o: OportunidadeComercial) => {
    setDragId(o.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ id: o.id, from: o.etapa } satisfies DragPayload),
    )
  }

  const onDrop = async (e: React.DragEvent, etapa: EtapaOportunidade) => {
    e.preventDefault()
    setDragOver(null)
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) {
      setDragId(null)
      return
    }
    let payload: DragPayload
    try {
      payload = JSON.parse(raw)
    } catch {
      setDragId(null)
      return
    }
    setDragId(null)
    if (payload.from === etapa) return
    try {
      await updateOportunidadeEtapa(payload.id, etapa)
      setOportunidades((prev) => prev.map((o) => (o.id === payload.id ? { ...o, etapa } : o)))
      toast({ title: `Movido para "${etapa}"` })
    } catch (err) {
      toast({
        title: 'Erro ao mover',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  const openCard = (o: OportunidadeComercial) => {
    setSelected(o)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Comercial</h2>
          <p className="text-slate-500 mt-1">
            Kanban de prospecção e vendas — {filtradas.length} oportunidade(s) · {MOEDA(totalValor)}
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo cliente/oportunidade
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 bg-white border rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-slate-500 mr-2">
          <Filter className="w-4 h-4" /> Filtros
        </div>
        <div className="w-48">
          <label className="text-xs text-slate-500">Responsável</label>
          <Select value={filtroResp} onValueChange={setFiltroResp}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {admins.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name || a.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <label className="text-xs text-slate-500">Origem do cliente</label>
          <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {origensUnicas.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <label className="text-xs text-slate-500">Período de criação</label>
          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando oportunidades...
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS.map((etapa) => {
            const lista = porEtapa.get(etapa) || []
            const soma = lista.reduce((s, o) => s + (o.valor_estimado || 0), 0)
            const isOver = dragOver === etapa
            return (
              <div
                key={etapa}
                className="w-72 shrink-0 flex flex-col rounded-lg bg-slate-100/70 border"
                onDragOver={(e) => {
                  e.preventDefault()
                  if (dragOver !== etapa) setDragOver(etapa)
                }}
                onDragLeave={() => setDragOver((cur) => (cur === etapa ? null : cur))}
                onDrop={(e) => onDrop(e, etapa)}
              >
                <div className="px-3 py-2.5 border-b bg-white/60 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-secondary">{etapa}</h3>
                    <Badge variant="secondary" className="font-mono">
                      {lista.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{MOEDA(soma)}</p>
                </div>
                <div
                  className={`flex-1 p-2 space-y-2 min-h-[120px] transition-colors ${
                    isOver ? 'bg-primary/5' : ''
                  }`}
                >
                  {lista.map((o) => {
                    const cli = o.expand?.cliente_id
                    const resp = o.expand?.responsavel
                    const dias = diasParadoNaEtapa(o.updated)
                    const isDrag = dragId === o.id
                    return (
                      <div
                        key={o.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, o)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => openCard(o)}
                        className={`group bg-white rounded-md border p-3 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/40 transition-all ${
                          isDrag ? 'opacity-40' : ''
                        } ${
                          etapa === 'Concluído' && o.resultado === 'Ganho'
                            ? 'border-l-4 border-l-green-500'
                            : etapa === 'Concluído' && o.resultado === 'Perdido'
                              ? 'border-l-4 border-l-red-500'
                              : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm text-secondary line-clamp-1">
                            {cli?.nome_empresa || '—'}
                          </p>
                          {etapa === 'Concluído' && o.resultado && (
                            <Badge
                              variant="outline"
                              className={
                                o.resultado === 'Ganho'
                                  ? 'text-green-700 border-green-500'
                                  : 'text-red-700 border-red-500'
                              }
                            >
                              {o.resultado}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">{o.titulo}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                          <span>{MOEDA(o.valor_estimado)}</span>
                          <span>{resp?.name || resp?.email || 'Sem resp.'}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs">
                          <span className="text-slate-400">
                            {dias} dia{dias === 1 ? '' : 's'} parado
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {lista.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">Vazio</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <NewClientDialog open={newOpen} setOpen={setNewOpen} onSuccess={load} />
      <OportunidadeDrawer
        oportunidade={selected}
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onChanged={load}
      />
    </div>
  )
}

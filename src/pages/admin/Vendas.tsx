// Painel de Gestão de Vendas e Assinaturas (admin) — PARTE A.
// Aba "Vendas": tabela server-side paginada (50/página, mesma paginação de
// Alunos/Leads), cards do topo e painel lateral de detalhe. Estrutura pronta
// para receber a Parte B (aba Assinaturas + exportações + ficha do aluno).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, DollarSign, TrendingUp, Receipt, Clock, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  getVendas,
  type VendaItem,
  type VendasCards,
  type VendasFiltros,
  type VendasPeriodo,
  type VendasTipo,
  type VendasStatus,
  type VendasForma,
} from '@/services/admin-vendas'
import VendaDetailSheet from '@/components/admin/VendaDetailSheet'

const PAGE_SIZE = 50

const TIPO_LABEL: Record<string, string> = {
  subscription: 'Assinatura',
  course: 'Curso',
  magazine: 'Revista',
  mentorship: 'Mentoria',
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Pago', cls: 'bg-emerald-500 text-white border-transparent hover:bg-emerald-600' },
  pending: { label: 'Pendente', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  failed: { label: 'Recusado', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
}

const STATUS_OPTS: { value: VendasStatus; label: string }[] = [
  { value: 'paid', label: 'Pago' },
  { value: 'pending', label: 'Pendente' },
  { value: 'failed', label: 'Recusado' },
]

const TIPO_OPTS: { value: VendasTipo; label: string }[] = [
  { value: 'subscription', label: 'Assinatura' },
  { value: 'course', label: 'Curso' },
  { value: 'magazine', label: 'Revista' },
  { value: 'mentorship', label: 'Mentoria' },
]

const PERIODO_OPTS: { value: VendasPeriodo; label: string }[] = [
  { value: 'este_mes', label: 'Este mês' },
  { value: 'mes_passado', label: 'Mês passado' },
  { value: 'personalizado', label: 'Personalizado' },
]

const FORMA_OPTS: { value: VendasForma; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'cartao', label: 'Cartão' },
]

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Datas (AAAA-MM-DD) no relógio de São Paulo — casam com a janela do hook
// server-side (janelaIso), que converte 00:00 SP ⇒ 03:00 UTC.
function hojeSP(): string {
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10)
}
function inicioMesSP(offsetMeses = 0): string {
  const d = new Date(Date.now() - 3 * 3600 * 1000)
  const y = Number(d.toISOString().slice(0, 4))
  const m = Number(d.toISOString().slice(5, 7)) - 1 + offsetMeses
  const alvo = new Date(Date.UTC(y, m, 1))
  return alvo.toISOString().slice(0, 10)
}

function CardTopo({
  titulo,
  valor,
  icone,
  destaque,
}: {
  titulo: string
  valor: string
  icone: React.ReactNode
  destaque?: boolean
}) {
  return (
    <Card className={destaque ? 'border-primary/30' : ''}>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            destaque ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {icone}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate">{titulo}</p>
          <p className="text-lg font-bold text-secondary truncate">{valor}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminVendas() {
  const { toast } = useToast()

  // ---- filtros ----
  const [periodo, setPeriodo] = useState<VendasPeriodo>('este_mes')
  const [start, setStart] = useState(inicioMesSP())
  const [end, setEnd] = useState(hojeSP())
  const [tipo, setTipo] = useState<VendasTipo | ''>('')
  const [status, setStatus] = useState<VendasStatus | ''>('')
  const [forma, setForma] = useState<VendasForma | ''>('')
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')

  // ---- dados ----
  const [items, setItems] = useState<VendaItem[]>([])
  const [cards, setCards] = useState<VendasCards | null>(null)
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // ---- detalhe ----
  const [detalheAberto, setDetalheAberto] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaItem | null>(null)

  const filtros = useMemo<VendasFiltros>(
    () => ({
      periodo,
      start,
      end,
      tipo,
      status,
      forma,
      search: buscaAplicada,
      page,
      perPage: PAGE_SIZE,
    }),
    [periodo, start, end, tipo, status, forma, buscaAplicada, page],
  )

  const carregar = useCallback(
    (f: VendasFiltros) => {
      setLoading(true)
      getVendas(f)
        .then((res) => {
          setItems(res.items || [])
          setCards(res.cards || null)
          setTotalItems(res.totalItems || 0)
          setTotalPages(Math.max(1, res.totalPages || 1))
        })
        .catch((err) => {
          console.error(err)
          toast({
            title: 'Erro ao carregar vendas',
            description: err instanceof Error ? err.message : 'Tente novamente.',
            variant: 'destructive',
          })
        })
        .finally(() => setLoading(false))
    },
    [toast],
  )

  useEffect(() => {
    carregar(filtros)
  }, [filtros, carregar])

  // Mudança de filtro volta para a página 1
  useEffect(() => {
    setPage(1)
  }, [periodo, start, end, tipo, status, forma, buscaAplicada])

  const aplicarBusca = () => setBuscaAplicada(busca.trim())

  const formatarData = (iso: string) => {
    const ms = Date.parse(iso)
    if (isNaN(ms)) return '—'
    return new Date(ms).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Vendas</h2>
          <p className="text-sm text-slate-500">
            Pagamentos, assinaturas e receita — visão consolidada.
          </p>
        </div>
        {/* Parte B: exportações CSV da aba (padrão admin-export) e ficha do aluno */}
      </div>

      {/* Cards do topo */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <CardTopo
          titulo="Receita do mês"
          valor={brl.format(cards?.receita_mes ?? 0)}
          icone={<DollarSign className="w-5 h-5" />}
          destaque
        />
        <CardTopo
          titulo="Receita total"
          valor={brl.format(cards?.receita_total ?? 0)}
          icone={<TrendingUp className="w-5 h-5" />}
        />
        <CardTopo
          titulo="Vendas no mês"
          valor={String(cards?.vendas_mes ?? 0)}
          icone={<Receipt className="w-5 h-5" />}
        />
        <CardTopo
          titulo="Ticket médio"
          valor={brl.format(cards?.ticket_medio ?? 0)}
          icone={<DollarSign className="w-5 h-5" />}
        />
        <CardTopo
          titulo="Assinantes ativos"
          valor={String(cards?.assinantes_ativos ?? 0)}
          icone={<TrendingUp className="w-5 h-5" />}
        />
        <CardTopo
          titulo="Vencendo em 30 dias"
          valor={String(cards?.vencendo_30_dias ?? 0)}
          icone={<Clock className="w-5 h-5" />}
        />
        <CardTopo
          titulo="Pagamentos pendentes"
          valor={String(cards?.pagamentos_pendentes ?? 0)}
          icone={<AlertCircle className="w-5 h-5" />}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Período</label>
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as VendasPeriodo)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODO_OPTS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {periodo === 'personalizado' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Início</label>
                <Input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Fim</label>
                <Input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-[150px]"
                />
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Tipo de produto</label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as VendasTipo | '')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {TIPO_OPTS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as VendasStatus | '')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {STATUS_OPTS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Forma</label>
            <Select value={forma} onValueChange={(v) => setForma(v as VendasForma | '')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {FORMA_OPTS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-[220px]">
            <label className="text-xs font-medium text-slate-500">Buscar aluno</label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome ou e-mail"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && aplicarBusca()}
              />
              <Button variant="outline" onClick={aplicarBusca}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left">
                  <th className="p-3 font-semibold">Data</th>
                  <th className="p-3 font-semibold">Aluno</th>
                  <th className="p-3 font-semibold">E-mail</th>
                  <th className="p-3 font-semibold">Produto</th>
                  <th className="p-3 font-semibold">Forma</th>
                  <th className="p-3 font-semibold text-right">Valor</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Vencimento</th>
                  <th className="p-3 font-semibold">ID iPag</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((v) => {
                  const st = STATUS_META[v.status] || { label: v.status, cls: '' }
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        setVendaSelecionada(v)
                        setDetalheAberto(true)
                      }}
                    >
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {formatarData(v.created)}
                      </td>
                      <td className="p-3 font-medium">{v.aluno || '—'}</td>
                      <td className="p-3 text-slate-500 max-w-[200px] truncate">
                        {v.email || '—'}
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-slate-400 uppercase mr-1">
                          {v.produto_tipo_label}
                        </span>
                        {v.produto_nome || '—'}
                      </td>
                      <td className="p-3 whitespace-nowrap">{v.forma}</td>
                      <td className="p-3 font-bold text-emerald-600 text-right whitespace-nowrap">
                        {brl.format(v.amount)}
                      </td>
                      <td className="p-3">
                        <Badge className={st.cls}>{st.label}</Badge>
                      </td>
                      <td className="p-3 whitespace-nowrap">{v.vencimento || '—'}</td>
                      <td className="p-3 text-slate-400 text-xs max-w-[120px] truncate">
                        {v.ipag_id || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                {loading ? 'Carregando...' : 'Nenhuma venda encontrada com os filtros atuais.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-slate-500">
          Página {page} de {totalPages} — {totalItems} vendas
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Próxima
          </Button>
        </div>
      </div>

      <VendaDetailSheet
        venda={vendaSelecionada}
        open={detalheAberto}
        onOpenChange={setDetalheAberto}
      />
    </div>
  )
}

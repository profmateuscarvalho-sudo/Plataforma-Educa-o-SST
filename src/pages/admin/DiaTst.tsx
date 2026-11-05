import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Search, ArrowUpDown, FileSpreadsheet, Save } from 'lucide-react'
import {
  getLeadsDiaTst,
  updateLeadDiaTst,
  getRegulamentoConfig,
  updateRegulamentoDiaTst,
} from '@/services/dia_tst'
import { LeadDiaTst } from '@/services/dia_tst'

type Ordem = 'nota' | 'created'

export default function AdminDiaTst() {
  const [leads, setLeads] = useState<LeadDiaTst[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroVerificados, setFiltroVerificados] = useState(false)
  const [filtroComunicacoes, setFiltroComunicacoes] = useState(false)
  const [ordem, setOrdem] = useState<Ordem>('created')
  const [editando, setEditando] = useState<
    Record<string, { story_verificado?: boolean; nota?: number }>
  >({})
  const [salvando, setSalvando] = useState<Record<string, boolean>>({})
  const [regulamento, setRegulamento] = useState('')
  const [regulamentoId, setRegulamentoId] = useState<string | null>(null)
  const [salvandoReg, setSalvandoReg] = useState(false)
  const [regulamentoSalvo, setRegulamentoSalvo] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    try {
      setLeads(await getLeadsDiaTst())
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    getRegulamentoConfig().then((c) => {
      if (c) {
        setRegulamentoId(c.id)
        setRegulamento(c.regulamento || '')
      }
    })
  }, [])

  const filtrados = useMemo(() => {
    let lista = leads
    if (busca.trim()) {
      const q = busca.trim().toLowerCase()
      lista = lista.filter(
        (l) =>
          l.nome.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.instagram.toLowerCase().includes(q),
      )
    }
    if (filtroVerificados) lista = lista.filter((l) => l.story_verificado)
    if (filtroComunicacoes) lista = lista.filter((l) => l.aceita_comunicacoes)
    if (ordem === 'nota') lista = [...lista].sort((a, b) => (b.nota || 0) - (a.nota || 0))
    else lista = [...lista].sort((a, b) => (b.created || '').localeCompare(a.created || ''))
    return lista
  }, [leads, busca, filtroVerificados, filtroComunicacoes, ordem])

  const contadores = useMemo(
    () => ({
      total: leads.length,
      hoje: leads.filter(
        (l) => (l.created || '').slice(0, 10) === new Date().toISOString().slice(0, 10),
      ).length,
      comunicacoes: leads.filter((l) => l.aceita_comunicacoes).length,
      verificados: leads.filter((l) => l.story_verificado).length,
    }),
    [leads],
  )

  const aplicarEdicao = async (id: string) => {
    const ed = editando[id]
    if (!ed) return
    setSalvando((s) => ({ ...s, [id]: true }))
    try {
      const atualizado = await updateLeadDiaTst(id, {
        ...(ed.story_verificado !== undefined ? { story_verificado: ed.story_verificado } : {}),
        ...(ed.nota !== undefined ? { nota: ed.nota } : {}),
      })
      setLeads((ls) => ls.map((l) => (l.id === id ? atualizado : l)))
      setEditando((e) => {
        const novo = { ...e }
        delete novo[id]
        return novo
      })
    } finally {
      setSalvando((s) => ({ ...s, [id]: false }))
    }
  }

  const exportarCsv = () => {
    const colunas = [
      'nome',
      'cidade_uf',
      'email',
      'whatsapp',
      'instagram',
      'frase',
      'aceite_regulamento',
      'aceite_lgpd',
      'aceita_comunicacoes',
      'story_verificado',
      'nota',
      'origem',
      'created',
    ]
    const linhas = filtrados.map((l) =>
      colunas
        .map((c) => {
          const v = (l as unknown as Record<string, unknown>)[c]
          const texto = v === true ? 'sim' : v === false ? 'não' : String(v ?? '')
          return `"${texto.replace(/"/g, '""')}"`
        })
        .join(';'),
    )
    const csv = '\uFEFF' + [colunas.join(';'), ...linhas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'leads-dia-tst.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const exportarBrevo = () => {
    const colunas = ['email', 'nome', 'whatsapp', 'cidade_uf']
    const linhas = filtrados
      .filter((l) => l.aceita_comunicacoes)
      .map((l) =>
        colunas
          .map(
            (c) =>
              `"${String((l as unknown as Record<string, unknown>)[c] ?? '').replace(/"/g, '""')}"`,
          )
          .join(';'),
      )
    const csv = '\uFEFF' + [colunas.join(';'), ...linhas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'brevo-dia-tst.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const salvarRegulamento = async () => {
    if (!regulamentoId) return
    setSalvandoReg(true)
    try {
      await updateRegulamentoDiaTst(regulamentoId, regulamento)
      setRegulamentoSalvo(true)
      setTimeout(() => setRegulamentoSalvo(false), 2500)
    } finally {
      setSalvandoReg(false)
    }
  }

  const hoje = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Campanha Dia do TST</h2>
          <p className="text-slate-500 mt-1">
            Inscritos do concurso cultural "Sou Educação SST" ·{' '}
            <Link to="/dia-do-tst" className="text-laranja hover:underline">
              ver página pública
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportarCsv} variant="outline" disabled={filtrados.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <Button
            onClick={exportarBrevo}
            variant="outline"
            disabled={contadores.comunicacoes === 0}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar para o Brevo
          </Button>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de inscritos', valor: contadores.total },
          { label: 'Inscritos hoje', valor: contadores.hoje },
          { label: 'Aceitaram comunicações', valor: contadores.comunicacoes },
          { label: 'Story verificado', valor: contadores.verificados },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-4">
            <p className="text-3xl font-bold text-verde-escuro">{c.valor}</p>
            <p className="mt-1 text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou Instagram"
            className="pl-9 bg-white"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filtroVerificados}
            onCheckedChange={(v) => setFiltroVerificados(v === true)}
          />
          Story verificado
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filtroComunicacoes}
            onCheckedChange={(v) => setFiltroComunicacoes(v === true)}
          />
          Aceita comunicações
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOrdem(ordem === 'nota' ? 'created' : 'nota')}
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          {ordem === 'nota' ? 'Nota (comissão)' : 'Mais recentes'}
        </Button>
      </div>

      {/* Tabela */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-verde-escuro" />
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-center text-slate-500 py-12">Nenhuma inscrição encontrada.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Nome</th>
                <th className="px-3 py-2 font-semibold">Cidade/UF</th>
                <th className="px-3 py-2 font-semibold">Instagram</th>
                <th className="px-3 py-2 font-semibold">Frase</th>
                <th className="px-3 py-2 font-semibold">Data</th>
                <th className="px-3 py-2 font-semibold text-center">Story verificado</th>
                <th className="px-3 py-2 font-semibold text-center">Nota</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l) => {
                const ed = editando[l.id] || {}
                const alterado = ed.story_verificado !== undefined || ed.nota !== undefined
                return (
                  <tr key={l.id} className="border-t align-top">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{l.nome}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{l.cidade_uf}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{l.instagram}</td>
                    <td className="px-3 py-2 max-w-xs">
                      <p className="line-clamp-2 text-slate-600">{l.frase}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {(l.created || '').slice(0, 10)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Checkbox
                        checked={
                          ed.story_verificado !== undefined
                            ? ed.story_verificado
                            : l.story_verificado
                        }
                        onCheckedChange={(v) =>
                          setEditando((e) => ({
                            ...e,
                            [l.id]: { ...ed, story_verificado: v === true },
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        value={ed.nota !== undefined ? ed.nota : (l.nota ?? 0)}
                        onChange={(e) =>
                          setEditando((e2) => ({
                            ...e2,
                            [l.id]: { ...ed, nota: Number(e.target.value) },
                          }))
                        }
                        className="w-16 text-center bg-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {alterado && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => aplicarEdicao(l.id)}
                          disabled={salvando[l.id]}
                        >
                          {salvando[l.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Regulamento editável */}
      <div className="rounded-xl border bg-white p-5 space-y-3">
        <div>
          <Label htmlFor="regulamento-edit">
            Regulamento completo (exibido no modal da página pública)
          </Label>
          <p className="text-xs text-slate-500 mt-1">
            Cole aqui o texto oficial do regulamento. Salve para atualizar o modal sem mexer no
            código.
          </p>
        </div>
        <textarea
          id="regulamento-edit"
          value={regulamento}
          onChange={(e) => setRegulamento(e.target.value)}
          rows={12}
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="flex items-center gap-3">
          <Button onClick={salvarRegulamento} disabled={!regulamentoId || salvandoReg}>
            {salvandoReg ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar regulamento
          </Button>
          {regulamentoSalvo && <span className="text-sm text-success font-medium">Salvo!</span>}
        </div>
      </div>
    </div>
  )
}

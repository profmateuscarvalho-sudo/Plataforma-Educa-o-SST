import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Save } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ETAPAS, getHistoricoEtapa, updateOportunidade, updateCliente } from '@/services/comercial'
import { getAdmins } from '@/services/users'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'
import { MOEDA } from './types'
import type {
  ClienteComercial,
  EtapaHistorico,
  EtapaOportunidade,
  OportunidadeComercial,
  ResultadoOportunidade,
  User,
} from '@/types'

const SEGMENTOS = ['Indústria', 'Construção', 'Saúde', 'Serviços', 'Comércio', 'Outros']
const ORIGENS = ['Indicação', 'Site', 'Evento', 'Cold call', 'Outros']

interface Props {
  oportunidade: OportunidadeComercial | null
  open: boolean
  setOpen: (v: boolean) => void
  onChanged: () => void
}

export function OportunidadeDrawer({ oportunidade, open, setOpen, onChanged }: Props) {
  const [admins, setAdmins] = useState<User[]>([])
  const [historico, setHistorico] = useState<EtapaHistorico[]>([])
  const [loadingHist, setLoadingHist] = useState(false)
  const [saving, setSaving] = useState(false)

  // edição oportunidade
  const [titulo, setTitulo] = useState('')
  const [etapa, setEtapa] = useState<EtapaOportunidade>('Cadastro')
  const [resultado, setResultado] = useState<ResultadoOportunidade | ''>('')
  const [valor, setValor] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')
  const [notas, setNotas] = useState('')

  // edição cliente
  const [cliente, setCliente] = useState<ClienteComercial | null>(null)
  const [cNomeEmpresa, setCNomeEmpresa] = useState('')
  const [cCnpj, setCCnpj] = useState('')
  const [cNomeContato, setCNomeContato] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cTelefone, setCTelefone] = useState('')
  const [cSegmento, setCSegmento] = useState('')
  const [cOrigem, setCOrigem] = useState('')
  const [cObs, setCObs] = useState('')

  const { toast } = useToast()

  useEffect(() => {
    getAdmins()
      .then(setAdmins)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!oportunidade) return
    setTitulo(oportunidade.titulo || '')
    setEtapa(oportunidade.etapa || 'Cadastro')
    setResultado((oportunidade.resultado as ResultadoOportunidade) || '')
    setValor(
      oportunidade.valor_estimado != null
        ? String(oportunidade.valor_estimado).replace('.', ',')
        : '',
    )
    setResponsavel(oportunidade.responsavel || '')
    setDataPrevista(oportunidade.data_prevista_fechamento?.slice(0, 10) || '')
    setNotas(oportunidade.notas || '')
    const cli = oportunidade.expand?.cliente_id || null
    setCliente(cli)
    if (cli) {
      setCNomeEmpresa(cli.nome_empresa || '')
      setCCnpj(cli.cnpj || '')
      setCNomeContato(cli.nome_contato || '')
      setCEmail(cli.email || '')
      setCTelefone(cli.telefone || '')
      setCSegmento(cli.segmento || '')
      setCOrigem(cli.origem || '')
      setCObs(cli.observacoes || '')
    }
    setLoadingHist(true)
    getHistoricoEtapa(oportunidade.id)
      .then(setHistorico)
      .catch(() => setHistorico([]))
      .finally(() => setLoadingHist(false))
  }, [oportunidade])

  const handleSave = async () => {
    if (!oportunidade) return
    setSaving(true)
    try {
      const valorNum = valor ? Number(valor.replace(',', '.')) : undefined
      await updateOportunidade(oportunidade.id, {
        titulo: titulo.trim(),
        etapa,
        resultado: etapa === 'Concluído' ? resultado || undefined : undefined,
        valor_estimado: valorNum && !Number.isNaN(valorNum) ? valorNum : undefined,
        responsavel: responsavel || undefined,
        data_prevista_fechamento: dataPrevista || undefined,
        notas: notas.trim(),
      })
      if (cliente) {
        await updateCliente(cliente.id, {
          nome_empresa: cNomeEmpresa.trim(),
          cnpj: cCnpj.trim(),
          nome_contato: cNomeContato.trim(),
          email: cEmail.trim(),
          telefone: cTelefone.trim(),
          segmento: cSegmento || undefined,
          origem: cOrigem || undefined,
          observacoes: cObs.trim(),
        })
      }
      toast({ title: 'Alterações salvas!' })
      onChanged()
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (!oportunidade) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-3 border-b">
          <SheetTitle className="font-serif">{oportunidade.titulo}</SheetTitle>
          <SheetDescription>
            {cliente?.nome_empresa} — criada em{' '}
            {new Date(oportunidade.created).toLocaleDateString('pt-BR')}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6 py-5">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Título</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div>
                <Label>Etapa</Label>
                <Select value={etapa} onValueChange={(v) => setEtapa(v as EtapaOportunidade)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ETAPAS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resultado</Label>
                <Select
                  value={resultado}
                  onValueChange={(v) => setResultado(v as ResultadoOportunidade)}
                  disabled={etapa !== 'Concluído'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ganho">Ganho</SelectItem>
                    <SelectItem value="Perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor estimado (R$)</Label>
                <Input
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div>
                <Label>Responsável</Label>
                <Select value={responsavel} onValueChange={setResponsavel}>
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {admins.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name || a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Previsão de fechamento</Label>
                <Input
                  type="date"
                  value={dataPrevista}
                  onChange={(e) => setDataPrevista(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Notas / histórico de conversas</Label>
              <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={5} />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-secondary mb-3">Cliente</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Nome da empresa</Label>
                  <Input value={cNomeEmpresa} onChange={(e) => setCNomeEmpresa(e.target.value)} />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input value={cCnpj} onChange={(e) => setCCnpj(e.target.value)} />
                </div>
                <div>
                  <Label>Nome do contato</Label>
                  <Input value={cNomeContato} onChange={(e) => setCNomeContato(e.target.value)} />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={cTelefone} onChange={(e) => setCTelefone(e.target.value)} />
                </div>
                <div>
                  <Label>Segmento</Label>
                  <Select value={cSegmento} onValueChange={setCSegmento}>
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTOS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Origem</Label>
                  <Select value={cOrigem} onValueChange={setCOrigem}>
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIGENS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={cObs} onChange={(e) => setCObs(e.target.value)} rows={2} />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-secondary mb-3">Histórico de etapas</h4>
              {loadingHist ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : historico.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma mudança registrada.</p>
              ) : (
                <ol className="space-y-2">
                  {historico
                    .slice()
                    .reverse()
                    .map((h) => (
                      <li key={h.id} className="flex items-start gap-3 text-sm">
                        <Badge variant="outline" className="whitespace-nowrap">
                          {h.etapa_nova}
                        </Badge>
                        <span className="text-slate-600">
                          {h.etapa_anterior ? `de ${h.etapa_anterior}` : 'Etapa inicial'} —{' '}
                          {new Date(h.created).toLocaleString('pt-BR')}
                        </span>
                      </li>
                    ))}
                </ol>
              )}
              <p className="mt-3 text-xs text-slate-500">
                Valor estimado atual: {MOEDA(oportunidade.valor_estimado)}
              </p>
            </div>
          </div>
        </ScrollArea>
        <div className="border-t p-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCliente, createOportunidade } from '@/services/comercial'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'

const SEGMENTOS = ['Indústria', 'Construção', 'Saúde', 'Serviços', 'Comércio', 'Outros']
const ORIGENS = ['Indicação', 'Site', 'Evento', 'Cold call', 'Outros']

interface Props {
  open: boolean
  setOpen: (v: boolean) => void
  onSuccess: () => void
}

export function NewClientDialog({ open, setOpen, onSuccess }: Props) {
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [nomeContato, setNomeContato] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [segmento, setSegmento] = useState('')
  const [origem, setOrigem] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [tituloOportunidade, setTituloOportunidade] = useState(
    'Assinatura anual Revista Educação SST',
  )
  const [valorEstimado, setValorEstimado] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setNomeEmpresa('')
      setCnpj('')
      setNomeContato('')
      setEmail('')
      setTelefone('')
      setSegmento('')
      setOrigem('')
      setObservacoes('')
      setTituloOportunidade('Assinatura anual Revista Educação SST')
      setValorEstimado('')
      setError('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!nomeEmpresa.trim() || !nomeContato.trim()) {
      setError('Nome da empresa e nome do contato são obrigatórios.')
      return
    }
    setSaving(true)
    try {
      const cliente = await createCliente({
        nome_empresa: nomeEmpresa.trim(),
        cnpj: cnpj.trim(),
        nome_contato: nomeContato.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        segmento: segmento || undefined,
        origem: origem || undefined,
        observacoes: observacoes.trim(),
      })
      if (tituloOportunidade.trim()) {
        const valorNum = valorEstimado ? Number(valorEstimado.replace(',', '.')) : undefined
        await createOportunidade({
          cliente_id: cliente.id,
          titulo: tituloOportunidade.trim(),
          valor_estimado: valorNum && !Number.isNaN(valorNum) ? valorNum : undefined,
        })
      }
      toast({ title: 'Cliente e oportunidade criados!' })
      onSuccess()
      setOpen(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo cliente / oportunidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-secondary">Cliente</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Nome da empresa *</Label>
                <Input
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
              </div>
              <div>
                <Label>Nome do contato *</Label>
                <Input
                  value={nomeContato}
                  onChange={(e) => setNomeContato(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
              <div>
                <Label>Segmento</Label>
                <Select value={segmento} onValueChange={setSegmento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
                <Select value={origem} onValueChange={setOrigem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h4 className="text-sm font-semibold text-secondary">Primeira oportunidade</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Título da oportunidade</Label>
                <Input
                  value={tituloOportunidade}
                  onChange={(e) => setTituloOportunidade(e.target.value)}
                />
              </div>
              <div>
                <Label>Valor estimado (R$)</Label>
                <Input
                  value={valorEstimado}
                  onChange={(e) => setValorEstimado(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

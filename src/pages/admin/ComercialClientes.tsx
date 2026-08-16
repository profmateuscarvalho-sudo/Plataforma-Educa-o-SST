import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Search, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getClientes, getOportunidades } from '@/services/comercial'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import type { ClienteComercial, OportunidadeComercial } from '@/types'

export default function AdminComercialClientes() {
  const [clientes, setClientes] = useState<ClienteComercial[]>([])
  const [oportunidades, setOportunidades] = useState<OportunidadeComercial[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([getClientes(), getOportunidades()])
      .then(([clis, ops]) => {
        setClientes(clis)
        setOportunidades(ops)
      })
      .catch((err) =>
        toast({
          title: 'Erro ao carregar',
          description: getErrorMessage(err),
          variant: 'destructive',
        }),
      )
      .finally(() => setLoading(false))
  }, [toast])

  const opsPorCliente = useMemo(() => {
    const map = new Map<string, OportunidadeComercial[]>()
    oportunidades.forEach((o) => {
      const arr = map.get(o.cliente_id) || []
      arr.push(o)
      map.set(o.cliente_id, arr)
    })
    return map
  }, [oportunidades])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) => c.nome_empresa?.toLowerCase().includes(q) || c.nome_contato?.toLowerCase().includes(q),
    )
  }, [clientes, busca])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Clientes</h2>
          <p className="text-slate-500 mt-1">{clientes.length} cliente(s) cadastrado(s)</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por empresa ou contato..."
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-slate-500 py-10 text-center">Nenhum cliente encontrado.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-center">Oportunidades</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((c) => {
                const ops = opsPorCliente.get(c.id) || []
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-secondary">
                      {c.nome_empresa}
                      {c.cnpj && (
                        <span className="block text-xs text-slate-400 font-normal">{c.cnpj}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{c.nome_contato}</div>
                      {c.email && <div className="text-xs text-slate-500">{c.email}</div>}
                    </TableCell>
                    <TableCell>{c.segmento || '—'}</TableCell>
                    <TableCell>{c.origem || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{ops.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/admin/comercial">
                          Ver <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

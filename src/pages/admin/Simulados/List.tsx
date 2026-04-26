import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getSimulados, deleteSimulado } from '@/services/simulados'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import type { Simulado } from '@/types'

export default function AdminSimulados() {
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const data = await getSimulados()
      setSimulados(data)
    } catch (error) {
      toast.error('Erro ao carregar simulados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este simulado?')) return
    try {
      await deleteSimulado(id)
      toast.success('Simulado excluído com sucesso')
      loadData()
    } catch (error) {
      toast.error('Erro ao excluir simulado')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Simulados</h2>
          <p className="text-slate-500">Gerencie os simulados e provas da plataforma.</p>
        </div>
        <Button asChild>
          <Link to="/admin/simulados/novo">
            <Plus className="w-4 h-4 mr-2" /> Novo Simulado
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Simulados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">Carregando...</div>
          ) : simulados.length === 0 ? (
            <div className="text-center p-8 text-slate-500">Nenhum simulado cadastrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capa</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulados.map((simulado) => (
                  <TableRow key={simulado.id}>
                    <TableCell>
                      <div className="w-16 h-9 rounded overflow-hidden bg-slate-100">
                        {simulado.banner && (
                          <img
                            src={pb.files.getURL(simulado, simulado.banner, { thumb: '100x50' })}
                            alt={simulado.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{simulado.title}</TableCell>
                    <TableCell>
                      <Badge variant={simulado.active ? 'default' : 'secondary'}>
                        {simulado.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/simulados/${simulado.id}/editar`}>
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(simulado.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

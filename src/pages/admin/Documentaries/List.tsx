import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getDocProjects, deleteDocProject } from '@/services/doc_projects'
import { DocProject } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDocumentaries() {
  const [projects, setProjects] = useState<DocProject[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadData = async () => {
    try {
      const data = await getDocProjects()
      setProjects(data)
    } catch (error) {
      toast.error('Erro ao carregar projetos')
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('doc_projects', loadData)

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return
    try {
      await deleteDocProject(id)
      toast.success('Projeto excluído')
    } catch (error) {
      toast.error('Erro ao excluir projeto')
    }
  }

  const filtered = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Projetos de Documentário</h2>
          <p className="text-muted-foreground">Gerencie todas as produções audiovisuais.</p>
        </div>
        <Button asChild>
          <Link to="/admin/documentarios/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo Projeto
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Planejado">Planejado</SelectItem>
            <SelectItem value="Em Pré-produção">Em Pré-produção</SelectItem>
            <SelectItem value="Produção">Produção</SelectItem>
            <SelectItem value="Pós-produção">Pós-produção</SelectItem>
            <SelectItem value="Finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Criação</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{p.status || 'Novo'}</Badge>
                </TableCell>
                <TableCell>{format(new Date(p.created), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    p.total_budget || 0,
                  )}
                </TableCell>
                <TableCell>{p.expand?.responsible?.name || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/admin/documentarios/${p.id}/editar`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/resumo-investidor/${p.id}`} target="_blank">
                      <FileText className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Nenhum projeto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

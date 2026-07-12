import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getDocProjects, deleteDocProject } from '@/services/doc_projects'
import { DocProject } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'

export default function AdminDocumentaries() {
  const [projects, setProjects] = useState<DocProject[]>([])
  const [search, setSearch] = useState('')

  const loadData = async () => {
    try {
      const data = await getDocProjects()
      setProjects(data)
    } catch {
      toast.error('Erro ao carregar documentários')
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('doc_projects', loadData)

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documentário?')) return
    try {
      await deleteDocProject(id)
      toast.success('Documentário excluído')
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const filtered = projects.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Documentários</h2>
          <p className="text-muted-foreground">Gerencie os conteúdos audiovisuais.</p>
        </div>
        <Button asChild>
          <Link to="/admin/documentarios/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo Documentário
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Capa</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.presentation_photos?.length ? (
                    <img
                      src={pb.files.getUrl(p, p.presentation_photos[0])}
                      alt={p.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-slate-100" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{format(new Date(p.created), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/admin/documentarios/${p.id}/editar`}>
                      <Edit className="h-4 w-4" />
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
                <TableCell colSpan={4} className="text-center py-8">
                  Nenhum documentário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

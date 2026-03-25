import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ListTree, Edit } from 'lucide-react'
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/services/courses'
import { Course } from '@/types'
import { toast } from '@/hooks/use-toast'

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [open, setOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const load = () => getCourses().then(setCourses)
  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    if (!form.get('thumbnail') || (form.get('thumbnail') as File).size === 0) {
      form.delete('thumbnail')
    }

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, form)
        toast({ title: 'Curso atualizado com sucesso' })
      } else {
        await createCourse(form)
        toast({ title: 'Curso criado com sucesso' })
      }
      setOpen(false)
      load()
    } catch (err) {
      toast({ title: 'Erro ao processar', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover este curso?')) {
      await deleteCourse(id)
      load()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Cursos</h2>
          <p className="text-slate-500">Gerencie o catálogo e informações principais.</p>
        </div>
        <Button
          className="bg-primary"
          onClick={() => {
            setEditingCourse(null)
            setOpen(true)
          }}
        >
          <Plus className="mr-2 w-4 h-4" /> Novo Curso
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Editar Curso' : 'Cadastrar Curso'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" key={editingCourse?.id || 'new'}>
            <div>
              <Label>Título</Label>
              <Input name="title" defaultValue={editingCourse?.title} required />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input name="description" defaultValue={editingCourse?.description} required />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                name="category"
                defaultValue={editingCourse?.category || 'Segurança do Trabalho'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medicina do Trabalho">Medicina do Trabalho</SelectItem>
                  <SelectItem value="Segurança do Trabalho">Segurança do Trabalho</SelectItem>
                  <SelectItem value="Gestão de SST">Gestão de SST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID do Panda Video (Vídeo de Apresentação/Principal)</Label>
              <Input name="panda_video_id" defaultValue={editingCourse?.panda_video_id} required />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input
                name="price"
                type="number"
                step="0.01"
                defaultValue={editingCourse?.price}
                required
              />
            </div>
            <div>
              <Label>Capa (Thumbnail)</Label>
              <Input name="thumbnail" type="file" accept="image/*" />
              {editingCourse?.thumbnail && (
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio para manter a capa atual.
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Salvar Curso
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {courses.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50"
              >
                <div className="col-span-6 font-medium text-slate-800">{c.title}</div>
                <div className="col-span-3 text-sm text-slate-500">{c.category}</div>
                <div className="col-span-1 font-bold text-primary">R$ {c.price}</div>
                <div className="col-span-2 flex justify-end gap-1">
                  <Button variant="outline" size="sm" asChild className="text-secondary mr-2">
                    <Link to={`/admin/cursos/${c.id}`}>
                      <ListTree className="w-4 h-4 mr-2" /> Conteúdo
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-500"
                    onClick={() => {
                      setEditingCourse(c)
                      setOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <div className="p-8 text-center text-slate-500">Nenhum curso cadastrado.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

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
import { Plus, Trash2, ListTree } from 'lucide-react'
import { getCourses, createCourse, deleteCourse } from '@/services/courses'
import { Course } from '@/types'
import { toast } from '@/hooks/use-toast'

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [open, setOpen] = useState(false)

  const load = () => getCourses().then(setCourses)
  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      await createCourse(form)
      toast({ title: 'Curso criado com sucesso' })
      setOpen(false)
      load()
    } catch (err) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Remover curso?')) {
      await deleteCourse(id)
      load()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Cursos</h2>
          <p className="text-slate-500">Gerencie o catálogo e vídeos do Panda Video.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 w-4 h-4" /> Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Curso</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input name="title" required />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input name="description" required />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select name="category" defaultValue="Segurança do Trabalho">
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
                <Input name="panda_video_id" required />
              </div>
              <div>
                <Label>Preço (R$)</Label>
                <Input name="price" type="number" step="0.01" required />
              </div>
              <div>
                <Label>Capa (Thumbnail)</Label>
                <Input name="thumbnail" type="file" accept="image/*" />
              </div>
              <Button type="submit" className="w-full">
                Salvar Curso
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {courses.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50"
              >
                <div className="col-span-6 font-medium">{c.title}</div>
                <div className="col-span-3 text-sm text-slate-500">{c.category}</div>
                <div className="col-span-1 font-bold text-primary">R$ {c.price}</div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild className="text-secondary">
                    <Link to={`/admin/cursos/${c.id}`}>
                      <ListTree className="w-4 h-4 mr-2" /> Conteúdo
                    </Link>
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

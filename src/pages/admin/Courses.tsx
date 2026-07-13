import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Edit, BookOpen } from 'lucide-react'
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/services/courses'
import { Course } from '@/types'
import { toast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { InstructorManager } from '@/components/admin/InstructorManager'

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [isFree, setIsFree] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const load = () => getCourses().then(setCourses).catch(console.error)

  useEffect(() => {
    load()
  }, [])

  useRealtime('courses', () => {
    load()
  })

  const handleOpen = (c?: Course) => {
    setEditing(c || null)
    setIsFree(c?.is_free || false)
    setFieldErrors({})
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})
    const fd = new FormData(e.currentTarget)
    fd.set('is_free', String(isFree))
    const thumb = fd.get('thumbnail') as File
    if (!thumb?.size) fd.delete('thumbnail')

    try {
      if (editing) {
        await updateCourse(editing.id, fd)
        toast({ title: 'Curso atualizado com sucesso' })
      } else {
        await createCourse(fd)
        toast({ title: 'Curso criado com sucesso' })
      }
      setOpen(false)
      load()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return
    try {
      await deleteCourse(id)
      toast({ title: 'Curso excluído com sucesso' })
      load()
    } catch (err) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="instructors">Professores</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-serif font-bold text-secondary">Cursos</h2>
              <p className="text-muted-foreground mt-1">Gerencie os cursos e currículos.</p>
            </div>
            <Button onClick={() => handleOpen()}>
              <Plus className="mr-2 w-4 h-4" /> Novo Curso
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {course.thumbnail ? (
                            <img
                              src={pb.files.getUrl(course, course.thumbnail)}
                              alt="Thumbnail"
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          {course.title}
                        </div>
                      </TableCell>
                      <TableCell>{course.category}</TableCell>
                      <TableCell>
                        {course.is_free
                          ? 'Gratuito'
                          : new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(course.price)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/cursos/${course.id}`}>Currículo</Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpen(course)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDelete(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {courses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum curso cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructors">
          <InstructorManager />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input name="title" defaultValue={editing?.title} required />
              {fieldErrors.title && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select name="category" defaultValue={editing?.category || 'Medicina do Trabalho'}>
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
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input name="description" defaultValue={editing?.description} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input name="price" type="number" step="0.01" defaultValue={editing?.price} />
              </div>
              <div className="space-y-2">
                <Label>Vídeo Promocional (Panda ID)</Label>
                <Input name="panda_video_id" defaultValue={editing?.panda_video_id} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Thumbnail (Capa)</Label>
              <Input type="file" name="thumbnail" accept="image/*" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch id="is_free" checked={isFree} onCheckedChange={setIsFree} />
              <Label htmlFor="is_free">Acesso Gratuito</Label>
            </div>
            <Button type="submit" className="w-full">
              {editing ? 'Salvar Alterações' : 'Criar Curso'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

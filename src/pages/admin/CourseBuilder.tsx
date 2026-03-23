import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, ChevronLeft, FileText, PlayCircle } from 'lucide-react'
import { getCourse } from '@/services/courses'
import {
  getCourseModules,
  getCourseLessons,
  getCourseMaterials,
  createModule,
  deleteModule,
  createLesson,
  deleteLesson,
  createMaterial,
  deleteMaterial,
} from '@/services/curriculum'
import { Course, Module, Lesson, Material } from '@/types'
import { toast } from '@/hooks/use-toast'

type DialogState = { type: 'module' } | { type: 'lesson' | 'material'; moduleId: string } | null

export default function CourseBuilder() {
  const { id } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [dialog, setDialog] = useState<DialogState>(null)

  const loadData = async () => {
    if (!id) return
    const [c, m, l, mat] = await Promise.all([
      getCourse(id),
      getCourseModules(id),
      getCourseLessons(id),
      getCourseMaterials(id),
    ])
    setCourse(c)
    setModules(m)
    setLessons(l)
    setMaterials(mat)
  }

  useEffect(() => {
    loadData()
  }, [id])

  const submitModule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await createModule({
        course: id,
        title: new FormData(e.currentTarget).get('title') as string,
      })
      toast({ title: 'Módulo criado' })
      setDialog(null)
      loadData()
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const submitLesson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (dialog?.type !== 'lesson') return
    const fd = new FormData(e.currentTarget)
    try {
      await createLesson({
        module: dialog.moduleId,
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        panda_video_id: fd.get('panda_video_id') as string,
      })
      toast({ title: 'Aula adicionada' })
      setDialog(null)
      loadData()
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const submitMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (dialog?.type !== 'material') return
    const fd = new FormData(e.currentTarget)
    fd.append('module', dialog.moduleId)
    try {
      await createMaterial(fd)
      toast({ title: 'Material enviado' })
      setDialog(null)
      loadData()
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const remove = async (type: 'module' | 'lesson' | 'material', delId: string) => {
    if (!confirm('Excluir item?')) return
    const fn = type === 'module' ? deleteModule : type === 'lesson' ? deleteLesson : deleteMaterial
    await fn(delId)
    loadData()
  }

  if (!course) return <div>Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/cursos">
            <ChevronLeft />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-serif font-bold text-secondary">Construtor de Currículo</h2>
          <p className="text-slate-500 text-sm">Curso: {course.title}</p>
        </div>
        <Button className="ml-auto bg-primary" onClick={() => setDialog({ type: 'module' })}>
          <Plus className="w-4 h-4 mr-2" /> Novo Módulo
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {modules.map((mod) => (
          <AccordionItem
            value={mod.id}
            key={mod.id}
            className="border rounded-lg bg-white overflow-hidden"
          >
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-slate-50 font-bold text-secondary">
              <span className="flex-1 text-left">{mod.title}</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2 bg-slate-50 border-t space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-slate-700">Aulas</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog({ type: 'lesson', moduleId: mod.id })}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {lessons
                    .filter((l) => l.module === mod.id)
                    .map((l) => (
                      <div
                        key={l.id}
                        className="flex justify-between items-center bg-white p-3 rounded border"
                      >
                        <div className="flex items-center gap-3">
                          <PlayCircle className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">{l.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => remove('lesson', l.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  {!lessons.filter((l) => l.module === mod.id).length && (
                    <p className="text-xs text-slate-400">Nenhuma aula.</p>
                  )}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-slate-700">Materiais de Apoio</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog({ type: 'material', moduleId: mod.id })}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {materials
                    .filter((m) => m.module === mod.id)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="flex justify-between items-center bg-white p-3 rounded border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-accent" />
                          <span className="font-medium text-sm">{m.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => remove('material', m.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  {!materials.filter((m) => m.module === mod.id).length && (
                    <p className="text-xs text-slate-400">Nenhum material.</p>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t flex justify-end">
                <Button variant="destructive" size="sm" onClick={() => remove('module', mod.id)}>
                  Excluir Módulo
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          {dialog?.type === 'module' && (
            <form onSubmit={submitModule} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Criar Novo Módulo</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input name="title" required />
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          )}
          {dialog?.type === 'lesson' && (
            <form onSubmit={submitLesson} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Adicionar Aula</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input name="title" required />
              </div>
              <div className="space-y-2">
                <Label>ID do Vídeo (Panda Video)</Label>
                <Input name="panda_video_id" required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea name="description" />
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          )}
          {dialog?.type === 'material' && (
            <form onSubmit={submitMaterial} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Enviar Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Título do Material</Label>
                <Input name="title" required />
              </div>
              <div className="space-y-2">
                <Label>Arquivo</Label>
                <Input name="file" type="file" required />
              </div>
              <Button type="submit" className="w-full">
                Enviar
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { COURSES } from '@/lib/data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function AdminCourses() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Gerenciar Cursos</h2>
          <p className="text-slate-500">Crie, edite ou remova conteúdos educacionais (CMS).</p>
        </div>
        <Button className="bg-primary">
          <Plus className="mr-2 w-4 h-4" /> Novo Curso
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-slate-50 font-bold text-slate-600 text-sm">
          <div className="col-span-5">Curso</div>
          <div className="col-span-3">Categoria</div>
          <div className="col-span-2">Preço</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        <div className="divide-y">
          {COURSES.map((course) => (
            <div
              key={course.id}
              className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-5 flex items-center gap-4">
                <img
                  src={course.image}
                  className="w-16 h-10 object-cover rounded shadow-sm"
                  alt="thumb"
                />
                <span className="font-medium text-secondary truncate">{course.title}</span>
              </div>
              <div className="col-span-3">
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {course.category}
                </span>
              </div>
              <div className="col-span-2 text-primary font-bold text-sm">R$ {course.price}</div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="ghost" size="icon" className="text-blue-600">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

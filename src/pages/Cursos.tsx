import { useState } from 'react'
import { COURSES, CATEGORIES } from '@/lib/data'
import { CourseCard } from '@/components/CourseCard'
import { Input } from '@/components/ui/input'
import { Search, FilterX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Cursos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredCourses = COURSES.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header Section */}
      <section className="bg-primary text-primary-foreground py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/1920/600?q=library&color=green')] opacity-10 object-cover mix-blend-overlay" />
        <div className="container px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Catálogo de Cursos Premium
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              Explore nossos programas de formação, desenhados por especialistas e pensados para o
              seu crescimento contínuo na área de SST.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="container px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Buscar por nome ou palavra-chave..."
              className="pl-10 h-12 bg-slate-50 border-transparent focus-visible:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-12 bg-slate-50 border-transparent focus:ring-primary/20">
                <SelectValue placeholder="Todas as Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || selectedCategory !== 'all') && (
            <Button
              variant="ghost"
              className="h-12 text-slate-500 hover:text-destructive"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
            >
              <FilterX className="w-4 h-4 mr-2" /> Limpar
            </Button>
          )}
        </div>
      </section>

      {/* Courses Grid */}
      <section className="container px-4 pt-16">
        <div className="mb-8">
          <h2 className="text-2xl font-serif font-bold text-slate-800">
            {filteredCourses.length}{' '}
            {filteredCourses.length === 1 ? 'Curso encontrado' : 'Cursos encontrados'}
          </h2>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 border-dashed">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Nenhum curso encontrado</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Não encontramos nenhum curso com os filtros selecionados. Tente buscar por outros
              termos ou limpar os filtros.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
            >
              Limpar todos os filtros
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

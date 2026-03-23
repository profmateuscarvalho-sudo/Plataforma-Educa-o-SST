import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Shield, Menu, GraduationCap, Users, BookOpen, ChevronRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useEffect } from 'react'

export default function Layout() {
  const location = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const navigation = [
    { name: 'Início', href: '/' },
    { name: 'Cursos', href: '/cursos' },
    { name: 'Mentorias', href: '/mentorias' },
    { name: 'Revistas', href: '/revistas' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full glass-header">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg group-hover:bg-primary/90 transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-xl leading-none text-primary tracking-tight">
                Educação SST
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Premium
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.href
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-slate-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="font-medium text-slate-600">
              Área do Aluno
            </Button>
            <Button className="font-medium shadow-sm">Falar com Consultor</Button>
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l-0">
              <SheetHeader className="text-left mb-8">
                <SheetTitle className="font-serif text-2xl text-primary">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6">
                <nav className="flex flex-col gap-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="text-lg font-medium text-slate-700 hover:text-primary transition-colors flex items-center justify-between"
                    >
                      {item.name}
                      <ChevronRight className="w-5 h-5 opacity-50" />
                    </Link>
                  ))}
                </nav>
                <div className="h-px bg-border my-2" />
                <div className="flex flex-col gap-3">
                  <Button variant="outline" className="w-full justify-start text-lg h-12">
                    Área do Aluno
                  </Button>
                  <Button className="w-full justify-start text-lg h-12">Falar com Consultor</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-200 py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-serif font-bold text-xl text-white">Educação SST</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Plataforma premium de educação em Segurança e Saúde no Trabalho. Transformando
              carreiras através da excelência acadêmica.
            </p>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg text-white mb-6">Links Rápidos</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link to="/cursos" className="hover:text-white transition-colors">
                  Todos os Cursos
                </Link>
              </li>
              <li>
                <Link to="/mentorias" className="hover:text-white transition-colors">
                  Corpo Docente
                </Link>
              </li>
              <li>
                <Link to="/revistas" className="hover:text-white transition-colors">
                  Publicações Científicas
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Área do Aluno
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg text-white mb-6">Áreas de Estudo</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Medicina do Trabalho
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> Segurança do Trabalho
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Gestão Estratégica
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Higiene Ocupacional
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg text-white mb-6">Certificações</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-white/5 rounded-md border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400">
                ISO 45001
              </div>
              <div className="h-12 bg-white/5 rounded-md border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400">
                MEC Autorizado
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Educação SST Premium. Todos os direitos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Política de Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

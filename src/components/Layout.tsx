import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Menu,
  GraduationCap,
  Users,
  BookOpen,
  ChevronRight,
  LogOut,
  LayoutDashboard,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useEffect } from 'react'
import { Logo, SquareLogo } from './ui/Logos'
import { useAuth } from '@/hooks/use-auth'
import { LeadForm } from './LeadForm'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const navigation = [
    { name: 'Início', href: '/' },
    { name: 'Cursos', href: '/cursos' },
    { name: 'Mentorias', href: '/mentorias' },
    { name: 'Revistas', href: '/revistas' },
    { name: 'Notícias', href: '/noticias' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full glass-header">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <SquareLogo variant="yellow" className="group-hover:scale-105 transition-transform" />
            <Logo className="hidden lg:flex" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
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
            {user ? (
              <>
                <Button variant="ghost" asChild className="text-primary font-semibold">
                  <Link to={user.role === 'admin' ? '/admin' : '/aluno'}>
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Painel
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    signOut()
                    navigate('/')
                  }}
                >
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="font-medium text-slate-600">
                  <Link to="/login">Área do Aluno</Link>
                </Button>
                <Button asChild className="font-medium shadow-sm">
                  <Link to="/cursos">Ver Cursos</Link>
                </Button>
              </>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l-0">
              <SheetHeader className="text-left mb-8">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6">
                <nav className="flex flex-col gap-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="text-lg font-medium text-slate-700 hover:text-primary flex justify-between"
                    >
                      {item.name} <ChevronRight className="w-5 h-5 opacity-50" />
                    </Link>
                  ))}
                </nav>
                <div className="h-px bg-border my-2" />
                <div className="flex flex-col gap-3">
                  {user ? (
                    <>
                      <Button className="w-full justify-start text-lg h-12" asChild>
                        <Link to={user.role === 'admin' ? '/admin' : '/aluno'}>
                          <LayoutDashboard className="mr-2" /> Painel
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-lg h-12"
                        onClick={() => {
                          signOut()
                          navigate('/')
                        }}
                      >
                        <LogOut className="mr-2" /> Sair
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" className="w-full justify-start text-lg h-12" asChild>
                      <Link to="/login">Área do Aluno</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-secondary text-slate-200 py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <SquareLogo variant="yellow" />
              <Logo className="text-white" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Plataforma de educação e desenvolvimento profissional na área de Segurança e Saúde no
              Trabalho.
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
                  Mentorias
                </Link>
              </li>
              <li>
                <Link to="/revistas" className="hover:text-white transition-colors">
                  Revistas Digitais
                </Link>
              </li>
              <li>
                <Link to="/noticias" className="hover:text-white transition-colors">
                  Notícias do Setor
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg text-white mb-6">Fale Conosco</h4>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <LeadForm variant="dark" />
            </div>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg text-white mb-6">Áreas de Atuação</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-accent" /> Medicina do Trabalho
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" /> Segurança do Trabalho
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" /> Gestão de SST
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

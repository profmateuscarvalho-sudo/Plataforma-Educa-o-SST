import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  FileText,
  Newspaper,
  Presentation,
  GraduationCap,
  Film,
  ClipboardList,
  Settings,
  BadgeCent,
} from 'lucide-react'

export default function AdminLayout() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  if (loading || !user || user.role !== 'admin') return null

  const menu = [
    { label: 'Visão Geral', icon: LayoutDashboard, path: '/admin' },
    { label: 'Cursos', icon: BookOpen, path: '/admin/cursos' },
    { label: 'Alunos', icon: GraduationCap, path: '/admin/alunos' },
    { label: 'Mentorias', icon: Presentation, path: '/admin/mentorias' },
    { label: 'Documentários', icon: Film, path: '/admin/documentarios' },
    { label: 'Simulados', icon: ClipboardList, path: '/admin/simulados' },
    { label: 'Revistas', icon: FileText, path: '/admin/revistas' },
    { label: 'Anúncios Revista', icon: Settings, path: '/admin/configuracoes/anuncio-revista' },
    { label: 'Planos de Assinatura', icon: BadgeCent, path: '/admin/planos' },
    { label: 'Notícias', icon: Newspaper, path: '/admin/noticias' },
    { label: 'Leads', icon: Users, path: '/admin/leads' },
    { label: 'Pagamentos', icon: BookOpen, path: '/admin/pagamentos' },
    { label: 'Aulas ao Vivo', icon: Presentation, path: '/admin/lives' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-secondary text-white flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/10 gap-3">
          <span className="font-bold text-accent tracking-tighter">SST ADMIN</span>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {menu.map((m) => (
            <Link
              key={m.path}
              to={m.path}
              className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <m.icon className="w-5 h-5 text-accent" /> {m.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              signOut()
              navigate('/')
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-md hover:bg-white/10 transition-colors text-sm text-red-400"
          >
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center justify-between px-8 flex-shrink-0">
          <h1 className="font-serif font-bold text-2xl text-secondary">Área Administrativa</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{user.name || 'Admin'}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              AD
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

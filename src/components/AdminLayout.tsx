import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
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
  Megaphone,
  UserCog,
  MessagesSquare,
  FlaskConical,
  ScrollText,
  Tag,
  ImageIcon,
  Brain,
  ChevronDown,
  BarChart3,
  Handshake,
} from 'lucide-react'

type MenuItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
}

type MenuSection = {
  title: string
  items: MenuItem[]
}

const sections: MenuSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Visão Geral', icon: LayoutDashboard, path: '/admin' },
      { label: 'Dashboard de Acessos', icon: BarChart3, path: '/admin/acessos' },
    ],
  },
  {
    title: 'Conteúdo',
    items: [
      { label: 'Cursos', icon: BookOpen, path: '/admin/cursos' },
      { label: 'Mentorias', icon: Presentation, path: '/admin/mentorias' },
      { label: 'Documentários', icon: Film, path: '/admin/documentarios' },
      { label: 'Simulados', icon: ClipboardList, path: '/admin/simulados' },
      { label: 'Revistas', icon: FileText, path: '/admin/revistas' },
      { label: 'Notícias', icon: Newspaper, path: '/admin/noticias' },
      { label: 'Aulas ao Vivo', icon: Presentation, path: '/admin/lives' },
    ],
  },
  {
    title: 'Alunos & Assinaturas',
    items: [
      { label: 'Alunos', icon: GraduationCap, path: '/admin/alunos' },
      { label: 'Planos de Assinatura', icon: BadgeCent, path: '/admin/planos' },
      { label: 'Pagamentos', icon: BookOpen, path: '/admin/pagamentos' },
      { label: 'Leads', icon: Users, path: '/admin/leads' },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { label: 'Kanban', icon: Handshake, path: '/admin/comercial' },
      { label: 'Clientes', icon: Users, path: '/admin/comercial/clientes' },
    ],
  },
  {
    title: 'Comunidade',
    items: [
      { label: 'Quadro de Avisos', icon: Megaphone, path: '/admin/avisos' },
      { label: 'Mentores', icon: UserCog, path: '/admin/mentores' },
      { label: 'Tags Profissionais', icon: Tag, path: '/admin/tags' },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { label: 'Base de Conhecimento', icon: Brain, path: '/admin/base-conhecimento' },
      { label: 'Banners de Patrocínio', icon: ImageIcon, path: '/admin/banners' },
      { label: 'Anúncios Revista', icon: Settings, path: '/admin/configuracoes/anuncio-revista' },
      { label: 'Testes iPag', icon: FlaskConical, path: '/admin/testes' },
      { label: 'Log de E-mails', icon: ScrollText, path: '/admin/email-log' },
    ],
  },
]

function isPathActive(pathname: string, itemPath: string) {
  if (itemPath === '/admin') return pathname === '/admin'
  return pathname === itemPath || pathname.startsWith(itemPath + '/')
}

export default function AdminLayout() {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  if (loading || !user || user.role !== 'admin') return null

  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-secondary text-white flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/10 gap-3">
          <span className="font-bold text-accent tracking-tighter">SST ADMIN</span>
        </div>
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-4">
          {sections.map((section) => {
            const isCollapsed = collapsed[section.title]
            return (
              <div key={section.title}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
                >
                  {section.title}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                </button>
                {!isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {section.items.map((m) => {
                      const active = isPathActive(location.pathname, m.path)
                      return (
                        <Link
                          key={m.path}
                          to={m.path}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
                            active
                              ? 'bg-white/15 text-white'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <m.icon
                            className={`w-5 h-5 ${active ? 'text-accent' : 'text-accent/80'}`}
                          />{' '}
                          {m.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
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

import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Film,
  User,
  LogOut,
  Menu,
  ArrowLeft,
  BookOpen,
  FileCheck,
  ExternalLink,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Logo } from '@/components/ui/Logos'

export default function StudentLayout() {
  const { user, signOut, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (loading || !user) return null

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/plataforma' },
    { label: 'Documentários', icon: Film, path: '/plataforma/documentarios' },
    { label: 'Simulados', icon: FileCheck, path: '/simulados', external: true },
    { label: 'Meu Perfil', icon: User, path: '/plataforma/perfil' },
  ]

  const isActive = (path: string) => {
    if (path === '/plataforma') return location.pathname === '/plataforma'
    return location.pathname.startsWith(path)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="h-20 flex items-center px-6 border-b border-white/10 gap-3">
        <Logo className="text-white" />
      </div>
      <nav className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          if (item.external) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium text-slate-300"
              >
                <Icon className="w-5 h-5 text-yellow-400" />
                {item.label}
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
            )
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive(item.path)
                  ? 'bg-yellow-400/10 text-yellow-400 border-l-2 border-yellow-400'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10 space-y-3">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-slate-400"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao site
        </Link>
        <div className="flex items-center gap-3 px-4 py-2">
          {user.avatar ? (
            <img
              src={pb.files.getUrl(user, user.avatar)}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-sm">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            signOut()
            navigate('/')
          }}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg hover:bg-white/10 transition-colors text-sm text-red-400"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 flex flex-col fixed inset-y-0 left-0 z-40 hidden md:flex">
        <SidebarContent />
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="md:hidden h-16 bg-slate-900 flex items-center justify-between px-4 sticky top-0 z-30">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Logo className="text-white" />
          <div className="w-10" />
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

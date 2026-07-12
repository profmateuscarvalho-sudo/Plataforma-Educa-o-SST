import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LayoutDashboard, Film, User, LogOut, Menu, BookOpen } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Logo } from '@/components/ui/Logos'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'

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
    { label: 'Caderno Virtual', icon: BookOpen, path: '/plataforma/caderno' },
    { label: 'Meu Perfil', icon: User, path: '/plataforma/perfil' },
  ]

  const isActive = (path: string) => {
    if (path === '/plataforma') return location.pathname === '/plataforma'
    return location.pathname.startsWith(path)
  }

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 bg-slate-900 sticky top-0 z-40 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Logo className="text-white" />
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-yellow-400/10 text-yellow-400'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-slate-300 max-w-[120px] truncate">{user.name}</span>
            {user.avatar ? (
              <img
                src={pb.files.getUrl(user, user.avatar)}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-xs">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white md:hidden">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0 bg-slate-900 border-0">
              <div className="flex flex-col h-full">
                <div className="h-16 flex items-center px-4 border-b border-white/10">
                  <Logo className="text-white" />
                </div>
                <nav className="flex-1 py-4 px-2 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive(item.path)
                            ? 'bg-yellow-400/10 text-yellow-400'
                            : 'text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
                <div className="p-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center gap-3 px-2 py-2">
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
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2 w-full rounded-lg hover:bg-white/10 transition-colors text-sm text-red-400"
                  >
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <WhatsAppFloat />
    </div>
  )
}

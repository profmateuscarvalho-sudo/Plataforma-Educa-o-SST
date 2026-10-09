import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useStudentAccess } from '@/hooks/use-student-access'
import { LogOut } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Logo, SquareLogo } from '@/components/ui/Logos'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'
import { AgentChatWidget } from '@/components/AgentChatWidget'

export default function StudentLayout() {
  const { user, signOut, loading } = useAuth()
  const access = useStudentAccess()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
      return
    }
    if (
      !loading &&
      !access.loading &&
      user &&
      user.role !== 'admin' &&
      !access.hasSubscriptionAccess
    ) {
      navigate('/subscription-pending', { replace: true })
    }
  }, [user?.id, user?.role, loading, access.loading, access.hasSubscriptionAccess, navigate])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (loading || !user) return null
  if (user.role !== 'admin' && access.loading)
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground font-medium text-sm">Verificando assinatura...</p>
      </div>
    )

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 bg-card sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 border-b border-border shadow-[0_2px_8px_rgba(28,27,24,0.03)]">
        <Link
          to="/plataforma"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          <SquareLogo variant="yellow" className="w-8 h-8" />
          <Logo className="text-foreground" />
        </Link>
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img
              src={pb.files.getUrl(user, user.avatar)}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/20 text-foreground font-bold text-xs flex items-center justify-center border border-border">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-danger p-2 rounded-full hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <WhatsAppFloat />
      <AgentChatWidget />
    </div>
  )
}

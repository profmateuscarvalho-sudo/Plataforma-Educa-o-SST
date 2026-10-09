import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useStudentAccess } from '@/hooks/use-student-access'
import { LogOut } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Logo } from '@/components/ui/Logos'
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Verificando assinatura...</p>
      </div>
    )

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-14 bg-slate-900 sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 border-b border-white/10">
        <Link to="/plataforma" className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="Educação SST" className="w-8 h-8 object-contain" />
          <Logo className="text-white" />
        </Link>
        <div className="flex items-center gap-3">
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
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <WhatsAppFloat />
      <AgentChatWidget />
    </div>
  )
}

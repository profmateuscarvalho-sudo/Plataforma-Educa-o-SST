import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useStudentAccess } from '@/hooks/use-student-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SquareLogo } from '@/components/ui/Logos'
import { MailCheck, LogOut, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react'

export default function SubscriptionPending() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const access = useStudentAccess()
  const [checking, setChecking] = useState(false)

  const email = user?.email || (location.state as { email?: string })?.email || ''

  useEffect(() => {
    if (user && !access.loading && access.hasSubscriptionAccess) {
      navigate('/plataforma')
    }
  }, [user, access.loading, access.hasSubscriptionAccess, navigate])

  useRealtime(
    'subscriptions',
    () => {
      if (user) navigate('/plataforma')
    },
    !!user,
  )

  const handleCheckStatus = () => {
    setChecking(true)
    if (user) {
      navigate('/plataforma')
    } else {
      navigate('/login')
    }
  }

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 text-center items-center pb-8">
          <SquareLogo variant="yellow" className="w-16 h-16 mb-2" />
          <div>
            <CardTitle className="font-serif text-3xl text-secondary">Ativação Pendente</CardTitle>
            <CardDescription className="text-base mt-2">
              {user ? 'Sua assinatura ainda não está ativa' : 'Quase lá! Verifique seu e-mail'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 py-4 animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
              <MailCheck className="w-10 h-10 text-amber-500" />
            </div>

            {email && (
              <p className="text-sm text-slate-500 text-center">
                Enviamos um link de ativação para:
                <br />
                <span className="font-semibold text-slate-700">{email}</span>
              </p>
            )}

            <p className="text-slate-600 text-center text-sm leading-relaxed">
              Clique no link de ativação enviado para o seu e-mail para liberar seu acesso à
              plataforma. O link pode levar alguns minutos para chegar. Verifique também sua caixa
              de spam.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Verificação manual</p>
              <p className="text-xs text-amber-700 mt-1">
                Se você já clicou no link de ativação e ainda não tem acesso, aguarde alguns minutos
                e tente novamente. Em caso de problemas persistentes, entre em contato com o
                suporte.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCheckStatus}
              className="w-full h-12 text-lg font-bold"
              disabled={checking}
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Já ativei, verificar status
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {user ? (
              <Button onClick={handleSignOut} variant="outline" className="w-full h-11">
                <LogOut className="w-4 h-4 mr-2" />
                Sair da conta
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full h-11">
                <Link to="/login">Ir para o login</Link>
              </Button>
            )}

            <Button asChild variant="ghost" className="w-full h-11">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

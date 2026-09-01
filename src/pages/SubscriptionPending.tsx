import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useStudentAccess } from '@/hooks/use-student-access'
import { getPendingStatus, type PendingStatus } from '@/services/subscriptions'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SquareLogo } from '@/components/ui/Logos'
import { MailCheck, LogOut, RefreshCw, ArrowRight, AlertCircle, MailX, Headset } from 'lucide-react'

export default function SubscriptionPending() {
  const navigate = useNavigate()
  const { user, signOut, refreshUser } = useAuth()
  const access = useStudentAccess()
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('planId') || ''
  const [status, setStatus] = useState<PendingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const hasRefreshedRef = useRef(false)
  const refreshUserRef = useRef(refreshUser)
  refreshUserRef.current = refreshUser

  const fetchStatus = useCallback(async () => {
    try {
      await refreshUserRef.current()
      const s = await getPendingStatus()
      setStatus(s)

      const currentUser = pb.authStore.record as {
        email_verificado?: boolean
        verified?: boolean
        role?: string
        plan_tier?: string
      } | null
      const isEmailVerified = Boolean(currentUser?.email_verificado || currentUser?.verified)
      const isSubActive = s?.subscription?.status === 'active'

      if ((isSubActive || isEmailVerified) && !hasRefreshedRef.current) {
        hasRefreshedRef.current = true
      }

      if (
        currentUser?.role === 'admin' ||
        (isEmailVerified && (isSubActive || currentUser?.plan_tier))
      ) {
        navigate('/plataforma', { replace: true })
        return
      }

      if (planId && !isSubActive && s?.state !== 'manual_verification') {
        if (isEmailVerified) {
          navigate(`/planos?planId=${planId}&checkout=1`)
          return
        }
      }
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }, [planId, navigate])

  useEffect(() => {
    if (user) fetchStatus()
    else setLoading(false)
  }, [user, fetchStatus])

  useEffect(() => {
    if (!user) return
    const isEmailVerified = Boolean(user.email_verificado || (user as any).verified)
    const isSubActive =
      status?.subscription?.status === 'active' ||
      access.subscriptions.some((s) => s.status === 'active')
    const hasActiveStatus = access.hasSubscriptionAccess || isSubActive || Boolean(user.plan_tier)

    if (
      user.role === 'admin' ||
      (!access.loading && access.hasSubscriptionAccess) ||
      (isEmailVerified && hasActiveStatus)
    ) {
      navigate('/plataforma', { replace: true })
    }
  }, [
    user,
    access.loading,
    access.hasSubscriptionAccess,
    access.subscriptions,
    status?.subscription?.status,
    navigate,
  ])

  useRealtime(
    'subscriptions',
    () => {
      fetchStatus()
    },
    !!user,
  )

  useEffect(() => {
    if (!user || access.hasSubscriptionAccess) return
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [user, fetchStatus, access.hasSubscriptionAccess])

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-slate-500 text-sm">Verificando status da assinatura...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isManual = status?.state === 'manual_verification'

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none animate-fade-in-up">
        <CardHeader className="space-y-4 text-center items-center pb-6">
          <SquareLogo variant="yellow" className="w-16 h-16 mb-2" />
          <div>
            <CardTitle className="font-serif text-3xl text-secondary">
              {isManual ? 'Verificação Manual Necessária' : 'Aguardando ativação'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isManual
                ? 'Nossa equipe foi notificada e realizará a verificação manual em breve'
                : 'Confirme sua conta para acessar a plataforma'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isManual ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-orange-500" />
                </div>
                <p className="text-slate-600 text-center text-sm font-medium leading-relaxed">
                  Não conseguimos identificar seu plano automaticamente. Nossa equipe foi notificada
                  e realizará a verificação manual em breve.
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
                <MailX className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Nenhum e-mail foi enviado</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Devido a um problema técnico na identificação do plano, não enviamos o link de
                    ativação. Você não precisa verificar sua caixa de entrada neste momento.
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-3">
                <Headset className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Equipe notificada</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Nossa equipe de suporte já foi notificada. Assim que seu plano for identificado,
                    enviaremos o e-mail de ativação automaticamente.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                  <MailCheck className="w-10 h-10 text-amber-500" />
                </div>
                {user?.email && (
                  <p className="text-sm text-slate-500 text-center">
                    Enviamos um link de ativação para:
                    <br />
                    <span className="font-semibold text-slate-700">{user.email}</span>
                  </p>
                )}
                <p className="text-slate-600 text-center text-sm font-medium leading-relaxed">
                  Verifique seu e-mail (incluindo a caixa de spam) para confirmar sua conta clicando
                  no link enviado.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Não recebeu o e-mail?</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Aguarde alguns minutos e tente novamente. Se o problema persistir, entre em
                    contato com o suporte.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={async () => {
                setChecking(true)
                await fetchStatus()
                const currentUser = pb.authStore.record as {
                  email_verificado?: boolean
                  verified?: boolean
                  role?: string
                  plan_tier?: string
                } | null
                const isEmailVerified = Boolean(
                  currentUser?.email_verificado || currentUser?.verified,
                )
                if (
                  currentUser?.role === 'admin' ||
                  access.hasSubscriptionAccess ||
                  (isEmailVerified &&
                    (status?.subscription?.status === 'active' || currentUser?.plan_tier))
                ) {
                  navigate('/plataforma', { replace: true })
                }
              }}
              className="w-full h-12 text-base font-bold"
              disabled={checking}
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Verificar status novamente
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

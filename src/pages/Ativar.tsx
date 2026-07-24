import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { activateSubscription } from '@/services/subscriptions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SquareLogo } from '@/components/ui/Logos'
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function Ativar() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('Token não encontrado na URL.')
      return
    }

    activateSubscription(token)
      .then(async (result) => {
        if (result.token && result.record) {
          pb.authStore.save(result.token, result.record as any)
        }
        await refreshUser()
        setStatus('success')
      })
      .catch((err: unknown) => {
        setStatus('error')
        const errAny = err as { response?: { error?: string }; message?: string }
        const message = errAny?.response?.error || errAny?.message || 'Token inválido ou expirado.'
        setErrorMessage(message)
        toast.error('Falha na ativação', { description: message })
      })
  }, [token, refreshUser])

  const handleGoToDashboard = useCallback(() => {
    if (pb.authStore.isValid) {
      navigate('/plataforma')
    } else {
      navigate('/login?redirect=/plataforma')
    }
  }, [navigate])

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 text-center items-center pb-8">
          <SquareLogo variant="yellow" className="w-16 h-16 mb-2" />
          <div>
            <CardTitle className="font-serif text-3xl text-secondary">
              Ativação de Assinatura
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {status === 'loading' && 'Validando seu token...'}
              {status === 'success' && 'Sua assinatura está ativa!'}
              {status === 'error' && 'Não foi possível ativar'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-slate-500 text-sm">Aguarde enquanto ativamos sua assinatura...</p>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8 animate-fade-in-up">
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              <p className="text-slate-600 text-center">
                Sua assinatura foi ativada com sucesso! Você já pode acessar a plataforma.
              </p>
              <Button onClick={handleGoToDashboard} className="w-full h-12 text-lg font-bold">
                Ir para o Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8 animate-fade-in-up">
              <XCircle className="w-16 h-16 text-red-500" />
              <p className="text-slate-600 text-center">{errorMessage}</p>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full h-12">
                Voltar ao início
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SquareLogo } from '@/components/ui/Logos'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { ArrowLeft, CheckCircle2, KeyRound, AlertTriangle } from 'lucide-react'
import { PasswordStrengthChecker } from '@/components/PasswordStrengthChecker'

export default function ResetPassword() {
  const navigate = useNavigate()
  const params = useParams<{ token?: string }>()
  const [searchParams] = useSearchParams()

  const token = params.token || searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!token) {
      setErrorMessage('Token de recuperação não encontrado ou inválido.')
      return
    }

    if (password !== passwordConfirm) {
      setErrorMessage('As senhas não coincidem.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      setSuccess(true)
      toast({
        title: 'Senha redefinida com sucesso!',
        description: 'Você já pode fazer login com a sua nova senha.',
      })
      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'Não foi possível redefinir a senha. O link pode ter expirado ou já foi utilizado.'
      setErrorMessage(msg)
      toast({
        title: 'Erro ao redefinir senha',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 text-center items-center pb-8">
          <SquareLogo variant="yellow" className="w-16 h-16 mb-2" />
          <div>
            <CardTitle className="font-serif text-3xl text-secondary">Redefinir Senha</CardTitle>
            <CardDescription className="text-base mt-2">
              Digite e confirme a sua nova senha de acesso
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!token && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <AlertTriangle className="w-16 h-16 text-amber-500" />
              </div>
              <p className="text-slate-600">
                Nenhum token de redefinição de senha foi encontrado. Por favor, solicite um novo
                link de recuperação.
              </p>
              <Button asChild className="w-full h-12">
                <Link to="/forgot-password">Solicitar novo link</Link>
              </Button>
            </div>
          )}

          {token && success && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <p className="text-slate-600">
                Sua senha foi alterada com sucesso! Redirecionando para o login...
              </p>
              <Button asChild className="w-full h-12">
                <Link to="/login">
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Ir para o Login
                </Link>
              </Button>
            </div>
          )}

          {token && !success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-slate-50 pl-10"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                {password && <PasswordStrengthChecker password={password} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirmar Nova Senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="passwordConfirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    className="h-12 bg-slate-50 pl-10"
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                {loading ? 'Redefinindo...' : 'Salvar Nova Senha'}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-slate-500 hover:text-primary inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

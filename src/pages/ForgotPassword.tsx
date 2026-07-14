import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SquareLogo } from '@/components/ui/Logos'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await pb.collection('users').requestPasswordReset(email)
      setSent(true)
      toast({ title: 'E-mail enviado!', description: 'Verifique sua caixa de entrada.' })
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o e-mail. Tente novamente.',
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
          <SquareLogo variant="black" className="w-16 h-16 text-5xl mb-2" />
          <div>
            <CardTitle className="font-serif text-3xl text-secondary">Recuperar Senha</CardTitle>
            <CardDescription className="text-base mt-2">
              Digite seu e-mail para receber o link de recuperação
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <p className="text-slate-600">
                Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa
                de entrada e siga as instruções para redefinir sua senha.
              </p>
              <Button asChild className="w-full h-12">
                <Link to="/login">
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Voltar para o login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-slate-50 pl-10"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
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

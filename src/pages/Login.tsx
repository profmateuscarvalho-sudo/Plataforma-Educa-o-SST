import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SquareLogo } from '@/components/ui/Logos'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('carvalhomateus@icloud.com')
  const [pass, setPass] = useState('securepassword123')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, pass)
    setLoading(false)
    if (error) {
      const isNetworkError =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        (error as any).status === 0
      toast({
        title: t('auth.login.errorTitle'),
        description: isNetworkError ? t('auth.login.errorNetwork') : t('auth.login.errorInvalid'),
        variant: 'destructive',
      })
    } else {
      toast({ title: t('auth.login.welcome') })
      const redirectTo = searchParams.get('redirect')
      if (redirectTo) {
        navigate(redirectTo)
      } else {
        const record = pb.authStore.record as { role?: string } | null
        if (record?.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/plataforma')
        }
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 text-center items-center pb-8">
          <SquareLogo variant="black" className="w-16 h-16 text-5xl mb-2" />
          <div>
            <CardTitle className="font-serif text-3xl text-secondary">
              {t('auth.login.title')}
            </CardTitle>
            <CardDescription className="text-base mt-2">{t('auth.login.subtitle')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.login.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.login.password')}</Label>
              <Input
                id="password"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                className="h-12 bg-slate-50"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
              {loading ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary font-medium hover:underline"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                {t('auth.login.noAccount')}{' '}
                <Link to="/register" className="text-primary font-bold hover:underline">
                  {t('auth.login.createNow')}
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

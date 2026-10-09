import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SquareLogo } from '@/components/ui/Logos'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Loader2 } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
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
    <div className="min-h-[calc(100vh-80px)] bg-[#FAF8F3] flex items-center justify-center p-4 sm:p-6">
      {/* Formulário em cartão branco centralizado, raio 28px */}
      <div className="w-full max-w-md bg-white rounded-[28px] border border-[#E4DED1] shadow-[0_16px_36px_rgba(28,27,24,0.06)] p-8 sm:p-10">
        <div className="space-y-3 text-center flex flex-col items-center pb-6">
          <SquareLogo variant="yellow" className="w-16 h-16 mb-1" />
          <div>
            <h1 className="font-serif text-3xl font-semibold text-[#1C1B18]">
              {t('auth.login.title')}
            </h1>
            <p className="text-sm text-[#5F5A4F] mt-1.5">{t('auth.login.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]"
            >
              {t('auth.login.email')}
            </Label>
            <Input
              id="email"
              name="user-identifier"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
              className="h-12 bg-[#FAF8F3] border-[#E4DED1] rounded-xl text-[#1C1B18] focus:border-[#1C1B18]"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]"
            >
              {t('auth.login.password')}
            </Label>
            <Input
              id="password"
              name="access-key"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="off"
              required
              className="h-12 bg-[#FAF8F3] border-[#E4DED1] rounded-xl text-[#1C1B18] focus:border-[#1C1B18]"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full text-base font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>

          <div className="text-center pt-1">
            <Link
              to="/forgot-password"
              className="text-xs text-[#7F7869] font-medium hover:text-[#1C1B18] transition-colors"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

          <div className="text-center pt-3 border-t border-[#E4DED1]">
            <p className="text-sm text-[#5F5A4F]">
              {t('auth.login.noAccount')}{' '}
              <Link to="/register" className="text-[#1C1B18] font-bold hover:underline">
                {t('auth.login.createNow')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SquareLogo } from '@/components/ui/Logos'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await pb.collection('users').requestPasswordReset(email)
      setSent(true)
      toast({
        title: t('auth.forgotPassword.successTitle'),
        description: t('auth.forgotPassword.successDesc'),
      })
    } catch {
      toast({
        title: t('auth.forgotPassword.errorTitle'),
        description: t('auth.forgotPassword.errorDesc'),
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
            <CardTitle className="font-serif text-3xl text-secondary">
              {t('auth.forgotPassword.title')}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {t('auth.forgotPassword.subtitle')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <p
                className="text-slate-600"
                dangerouslySetInnerHTML={{
                  __html: t('auth.forgotPassword.successBody', { email }),
                }}
              />
              <Button asChild className="w-full h-12">
                <Link to="/login">
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  {t('auth.forgotPassword.backToLogin')}
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.forgotPassword.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-slate-50 pl-10"
                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                {loading ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit')}
              </Button>
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-slate-500 hover:text-primary inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('auth.forgotPassword.backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

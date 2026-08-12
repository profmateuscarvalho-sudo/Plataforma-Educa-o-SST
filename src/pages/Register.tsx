import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SquareLogo } from '@/components/ui/Logos'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { LocationSelect } from '@/components/LocationSelect'
import { PasswordStrengthChecker } from '@/components/PasswordStrengthChecker'
import { useProfessionalTags } from '@/hooks/use-professional-tags'

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('planId') || undefined
  const { tags: availableTags } = useProfessionalTags()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [pass, setPass] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [passError, setPassError] = useState('')
  const [tagsError, setTagsError] = useState('')

  const toggleTag = (tag: string) => {
    setTagsError('')
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError('')
    setTagsError('')

    if (selectedTags.length === 0) {
      setTagsError(t('auth.register.errorTags'))
      return
    }

    if (pass !== passConfirm) {
      setPassError(t('auth.register.errorPasswordMatch'))
      return
    }

    if (pass.length < 8) {
      setPassError(t('auth.register.errorPasswordLength'))
      return
    }

    if (!/[A-Z]/.test(pass)) {
      setPassError(t('auth.register.errorPasswordUpper'))
      return
    }

    if (!/[0-9]/.test(pass)) {
      setPassError(t('auth.register.errorPasswordNumber'))
      return
    }

    setLoading(true)
    const { error } = await signUp(name, email, pass, phone, selectedTags, city, state, planId)
    setLoading(false)

    if (error) {
      toast({
        title: t('auth.register.errorTitle'),
        description: t('auth.register.errorDesc'),
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('auth.register.successTitle'),
        description: t('auth.register.successDesc'),
      })
      if (planId) {
        navigate(`/subscription-pending?planId=${planId}`)
      } else {
        navigate('/subscription-pending')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl border border-slate-200 shadow-sm">
        <CardHeader className="space-y-3 text-center items-center pb-6 border-b border-slate-100">
          <SquareLogo variant="yellow" className="w-14 h-14 text-4xl mb-1" />
          <div>
            <CardTitle className="font-serif text-2xl text-secondary">
              {t('auth.register.title')}
            </CardTitle>
            <CardDescription className="text-sm mt-1.5">
              {t('auth.register.subtitle')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.register.fullName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.register.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-white border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.register.phone')}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder={t('auth.register.phonePlaceholder')}
                  required
                  className="h-11 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-0">
                <LocationSelect
                  state={state}
                  city={city}
                  onStateChange={setState}
                  onCityChange={setCity}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('auth.register.professionalProfile')}</Label>
              <p className="text-xs text-slate-400">{t('auth.register.selectOneOrMore')}</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5',
                      selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    {selectedTags.includes(tag) && <Check className="w-3.5 h-3.5" />}
                    {tag}
                  </button>
                ))}
              </div>
              {tagsError && (
                <p className="text-sm font-medium text-destructive mt-1">{tagsError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.register.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  className="h-11 bg-white border-slate-200"
                />
                {pass && <PasswordStrengthChecker password={pass} />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">{t('auth.register.confirmPassword')}</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passConfirm}
                  onChange={(e) => setPassConfirm(e.target.value)}
                  required
                  className="h-11 bg-white border-slate-200"
                />
                {passError && (
                  <p className="text-sm font-medium text-destructive mt-1">{passError}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold mt-2"
              disabled={loading}
            >
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </Button>
            <div className="text-center">
              <p className="text-sm text-slate-500">
                {t('auth.register.hasAccount')}{' '}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  {t('auth.register.login')}
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

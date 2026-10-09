import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SquareLogo } from '@/components/ui/Logos'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Check, Sparkles, Award, Crown, Loader2 } from 'lucide-react'
import { LocationSelect } from '@/components/LocationSelect'
import { PasswordStrengthChecker } from '@/components/PasswordStrengthChecker'
import { useProfessionalTags } from '@/hooks/use-professional-tags'
import { getSubscriptionPlans } from '@/services/subscription-plans'
import { SubscriptionPlan } from '@/types'
import { SubscriptionCheckoutModal } from '@/components/SubscriptionCheckoutModal'

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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlanTier, setSelectedPlanTier] = useState<'free' | 'prata' | 'ouro'>('free')
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null)

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

  useEffect(() => {
    getSubscriptionPlans()
      .then((loadedPlans) => {
        setPlans(loadedPlans)
        if (planId) {
          const match = loadedPlans.find((p) => p.id === planId)
          if (match) {
            const lower = match.name.toLowerCase()
            if (lower.includes('ouro')) setSelectedPlanTier('ouro')
            else if (lower.includes('prata')) setSelectedPlanTier('prata')
            else setSelectedPlanTier('free')
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load subscription plans:', err)
      })
  }, [planId])

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

    // Acha o ID do plano selecionado
    let chosenPlan: SubscriptionPlan | undefined
    if (selectedPlanTier === 'ouro') {
      chosenPlan = plans.find((p) => p.name.toLowerCase().includes('ouro') && p.price > 0)
    } else if (selectedPlanTier === 'prata') {
      chosenPlan = plans.find((p) => p.name.toLowerCase().includes('prata') && p.price > 0)
    } else {
      chosenPlan = plans.find((p) => p.name.toLowerCase().includes('free') || p.price === 0)
    }

    const effectivePlanId = chosenPlan?.id || planId

    setLoading(true)
    const { error } = await signUp(
      name,
      email,
      pass,
      phone,
      selectedTags,
      city,
      state,
      effectivePlanId,
    )
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

      // Se plano pago foi escolhido, abrir checkout modal diretamente sem passar pelo Free
      if (selectedPlanTier !== 'free' && chosenPlan) {
        setCheckoutPlan(chosenPlan)
        setCheckoutModalOpen(true)
      } else if (effectivePlanId && selectedPlanTier !== 'free') {
        navigate(`/planos?planId=${effectivePlanId}&checkout=1`)
      } else {
        // Fluxo Free: acesso imediato ao Dashboard
        navigate('/plataforma')
      }
    }
  }

  const handleCheckoutModalClose = (open: boolean) => {
    setCheckoutModalOpen(open)
    if (!open) {
      navigate('/plataforma')
    }
  }

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const prataPlan = plans.find((p) => p.name.toLowerCase().includes('prata') && p.price > 0)
  const ouroPlan = plans.find((p) => p.name.toLowerCase().includes('ouro') && p.price > 0)

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FAF8F3] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Formulário em cartão branco centralizado, raio 28px */}
      <div className="w-full max-w-2xl bg-white rounded-[28px] border border-[#E4DED1] shadow-[0_16px_36px_rgba(28,27,24,0.06)] p-6 sm:p-10">
        <div className="space-y-3 text-center flex flex-col items-center pb-6 border-b border-[#E4DED1]">
          <SquareLogo variant="yellow" className="w-14 h-14 mb-1" />
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1B18]">
              {t('auth.register.title')}
            </h1>
            <p className="text-sm text-[#5F5A4F] mt-1.5">{t('auth.register.subtitle')}</p>
          </div>
        </div>

        <div className="pt-6">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Escolha do Plano */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]">
                Escolha o seu plano de acesso
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlanTier('free')}
                  className={cn(
                    'p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative',
                    selectedPlanTier === 'free'
                      ? 'border-[#1C1B18] ring-2 ring-[#FDBE2D] bg-[#FAF8F3]'
                      : 'border-[#E4DED1] bg-white hover:border-[#1C1B18]',
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm flex items-center gap-1.5 text-[#1C1B18]">
                      <Sparkles className="w-4 h-4 text-[#FDBE2D]" />
                      Free
                    </span>
                    {selectedPlanTier === 'free' && (
                      <span className="w-4 h-4 rounded-full bg-[#1C1B18] text-[#FAF8F3] flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-extrabold text-[#1C1B18]">Grátis</span>
                  <span className="text-[11px] text-[#5F5A4F] mt-1">Acesso essencial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlanTier('prata')}
                  className={cn(
                    'p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative',
                    selectedPlanTier === 'prata'
                      ? 'border-[#173F33] ring-2 ring-[#173F33]/20 bg-[#FAF8F3]'
                      : 'border-[#E4DED1] bg-white hover:border-[#1C1B18]',
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm flex items-center gap-1.5 text-[#173F33]">
                      <Award className="w-4 h-4 text-[#173F33]" />
                      Prata
                    </span>
                    {selectedPlanTier === 'prata' && (
                      <span className="w-4 h-4 rounded-full bg-[#173F33] text-[#F4F1E8] flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-extrabold text-[#173F33]">
                    {prataPlan ? formatPrice(prataPlan.price) : 'R$ 49,90'}
                    <span className="text-xs font-normal text-[#5F5A4F]">/mês</span>
                  </span>
                  <span className="text-[11px] text-[#5F5A4F] mt-1">Todos os cursos + ao vivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlanTier('ouro')}
                  className={cn(
                    'p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative',
                    selectedPlanTier === 'ouro'
                      ? 'border-[#1C1B18] ring-2 ring-[#FDBE2D] bg-[#FAF8F3]'
                      : 'border-[#E4DED1] bg-white hover:border-[#1C1B18]',
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm flex items-center gap-1.5 text-[#1C1B18]">
                      <Crown className="w-4 h-4 text-[#FDBE2D]" />
                      Ouro
                    </span>
                    {selectedPlanTier === 'ouro' && (
                      <span className="w-4 h-4 rounded-full bg-[#1C1B18] text-[#FDBE2D] flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-extrabold text-[#1C1B18]">
                    {ouroPlan ? formatPrice(ouroPlan.price) : 'R$ 89,90'}
                    <span className="text-xs font-normal text-[#5F5A4F]">/mês</span>
                  </span>
                  <span className="text-[11px] text-[#5F5A4F] mt-1">Completo + Revista física</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]"
                >
                  {t('auth.register.fullName')}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 bg-[#FAF8F3] border-[#E4DED1] rounded-xl text-[#1C1B18] focus:border-[#1C1B18]"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]"
                >
                  {t('auth.register.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-[#FAF8F3] border-[#E4DED1] rounded-xl text-[#1C1B18] focus:border-[#1C1B18]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]"
                >
                  {t('auth.register.phone')}
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder={t('auth.register.phonePlaceholder')}
                  required
                  className="h-11 bg-[#FAF8F3] border-[#E4DED1] rounded-xl text-[#1C1B18] focus:border-[#1C1B18]"
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
              <Label className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]">
                {t('auth.register.professionalProfile')}
              </Label>
              <p className="text-xs text-[#7F7869]">{t('auth.register.selectOneOrMore')}</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-all flex items-center gap-1.5',
                      selectedTags.includes(tag)
                        ? 'bg-[#1C1B18] text-[#FAF8F3] border-[#1C1B18]'
                        : 'bg-[#FAF8F3] text-[#1C1B18] border-[#E4DED1] hover:border-[#1C1B18]',
                    )}
                  >
                    {selectedTags.includes(tag) && <Check className="w-3.5 h-3.5 text-[#FDBE2D]" />}
                    {tag}
                  </button>
                ))}
              </div>
              {tagsError && <p className="text-xs font-medium text-[#B4472E] mt-1">{tagsError}</p>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]"
                >
                  {t('auth.register.password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  className="h-11 bg-[#FAF8F3] border-[#E4DED1] rounded-xl text-[#1C1B18] focus:border-[#1C1B18]"
                />
                {pass && <PasswordStrengthChecker password={pass} />}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="passwordConfirm"
                  className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]"
                >
                  {t('auth.register.confirmPassword')}
                </Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passConfirm}
                  onChange={(e) => setPassConfirm(e.target.value)}
                  required
                  className="h-11 bg-[#FAF8F3] border-[#E4DED1] rounded-xl text-[#1C1B18] focus:border-[#1C1B18]"
                />
                {passError && (
                  <p className="text-xs font-medium text-[#B4472E] mt-1">{passError}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full text-base font-bold mt-2 bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </Button>

            <div className="text-center pt-2 border-t border-[#E4DED1]">
              <p className="text-sm text-[#5F5A4F]">
                {t('auth.register.hasAccount')}{' '}
                <Link to="/login" className="text-[#1C1B18] font-bold hover:underline">
                  {t('auth.register.login')}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <SubscriptionCheckoutModal
        isOpen={checkoutModalOpen}
        setIsOpen={handleCheckoutModalClose}
        plan={checkoutPlan}
      />
    </div>
  )
}

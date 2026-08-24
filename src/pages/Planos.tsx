import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, AlertCircle, Crown, Award, Sparkles, Clock } from 'lucide-react'
import { getSubscriptionPlans } from '@/services/subscription-plans'
import { useAuth } from '@/hooks/use-auth'
import { SubscriptionCheckoutModal } from '@/components/SubscriptionCheckoutModal'
import { SubscriptionPlan } from '@/types'
import { cn } from '@/lib/utils'
import { getPlanButtonState } from '@/lib/plan-utils'

const DEFAULT_PLANS = [
  {
    name: 'Free',
    icon: Sparkles,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Hub do aluno',
      'Revista Educação SST digital',
      'Cursos selecionados',
      'Aulas ao vivo (toda quarta feira)',
      'Caderno de Estudos Digital',
      'Ágora de Debates Técnicos',
    ],
    accent: 'border-slate-200',
    iconColor: 'text-slate-400',
    cta: 'Assine Gratuitamente',
    isComingSoon: false,
  },
  {
    name: 'Prata',
    icon: Award,
    monthlyPrice: 49.9,
    yearlyPrice: 499.9,
    features: [
      'Hub do aluno',
      'Revista Educação SST digital',
      'Todos os cursos da plataforma',
      'Aulas ao vivo (toda quarta feira) + Gravações',
      'Caderno de Estudos Digital',
      'Ágora de Debates Técnicos',
      'Documentários',
      'Desconto exclusivo em mentorias',
    ],
    accent: 'border-blue-300 ring-2 ring-blue-200',
    iconColor: 'text-blue-500',
    highlighted: true,
    cta: 'Assine',
    isComingSoon: true,
  },
  {
    name: 'Ouro',
    icon: Crown,
    monthlyPrice: 89.9,
    yearlyPrice: 899.9,
    shipping: true,
    features: [
      'Todos os benefícios do Prata',
      'Box+ com edição física/impressa da Revista Educação SST',
    ],
    accent: 'border-amber-300',
    iconColor: 'text-amber-500',
    cta: 'Assine',
    isComingSoon: true,
  },
]

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function Planos() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isExpired = searchParams.get('expired') === '1'
  const checkoutPlanId = searchParams.get('planId')
  const isCheckout = searchParams.get('checkout') === '1'

  useEffect(() => {
    getSubscriptionPlans().then(setPlans).catch(console.error)
  }, [])

  useEffect(() => {
    if (isCheckout && checkoutPlanId && user && plans.length > 0) {
      const plan = plans.find((p) => p.id === checkoutPlanId)
      if (plan) {
        setSelectedPlan(plan)
        setIsCheckoutOpen(true)
      }
    }
  }, [isCheckout, checkoutPlanId, user, plans])

  const handleSelectPlan = (plan: SubscriptionPlan | undefined) => {
    if (!user) {
      navigate('/register')
      return
    }
    if (!plan || plan.price === 0) return
    setSelectedPlan(plan)
    setIsCheckoutOpen(true)
  }

  const findPlan = (names: string[]) => plans.find((p) => names.includes(p.name))

  const displayPlans = DEFAULT_PLANS.map((def) => {
    const matchNames =
      def.name === 'Free'
        ? ['Free']
        : def.name === 'Prata'
          ? ['Prata Mensal', 'Prata']
          : def.name === 'Ouro'
            ? ['Ouro Mensal', 'Ouro']
            : []

    const dbPlan = findPlan(matchNames)

    const yearlyFallback =
      def.name === 'Prata'
        ? findPlan(['Prata Anual'])?.price
        : def.name === 'Ouro'
          ? findPlan(['Ouro Anual'])?.price
          : undefined

    return {
      ...def,
      dbPlan,
      monthlyPrice: dbPlan?.price ?? def.monthlyPrice,
      yearlyPrice: dbPlan?.price_yearly ?? yearlyFallback ?? def.yearlyPrice,
      isComingSoon: dbPlan?.is_coming_soon ?? def.isComingSoon,
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <section className="bg-secondary text-white py-20 relative overflow-hidden">
        <div className="container px-4 relative z-10 text-center">
          <Badge className="bg-accent text-secondary mb-4">Planos de Assinatura</Badge>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Escolha seu plano de acesso
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Tenha acesso ilimitado a todos os cursos, materiais e certificados da plataforma.
          </p>
        </div>
      </section>

      {isExpired && (
        <div className="container px-4 mt-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Sua assinatura expirou. Escolha um plano abaixo para renovar seu acesso.
            </p>
          </div>
        </div>
      )}

      <section className="container px-4 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {displayPlans.map((plan) => {
            const yearlyPerMonth = plan.yearlyPrice > 0 ? plan.yearlyPrice / 12 : 0
            const savings =
              plan.monthlyPrice > 0 && yearlyPerMonth > 0
                ? Math.round((1 - yearlyPerMonth / plan.monthlyPrice) * 100)
                : 0

            return (
              <Card
                key={plan.name}
                className={cn('relative overflow-hidden flex flex-col', plan.accent)}
              >
                {plan.isComingSoon ? (
                  <div className="absolute top-0 left-0 z-10 w-full bg-amber-500 text-white text-xs font-bold py-1.5 text-center">
                    Em breve
                  </div>
                ) : plan.highlighted ? (
                  <div className="absolute top-0 left-0 z-10 w-full bg-blue-600 text-white text-xs font-bold py-1.5 text-center">
                    MAIS POPULAR
                  </div>
                ) : null}

                <CardHeader
                  className={cn(
                    'relative z-0 pb-4',
                    plan.highlighted || plan.isComingSoon ? 'pt-8' : 'pt-6',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <plan.icon className={cn('w-6 h-6', plan.iconColor)} />
                    <CardTitle className="text-2xl font-serif">{plan.name}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col relative z-0">
                  <div className="mb-2 space-y-1.5">
                    {plan.monthlyPrice === 0 ? (
                      <span className="text-4xl font-bold text-slate-900">Grátis</span>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-emerald-500">
                            {fmt(plan.monthlyPrice)}
                          </span>
                          <span className="text-slate-500 text-sm">/mês</span>
                        </div>
                        {plan.yearlyPrice > 0 && (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-medium text-slate-500">
                                {fmt(plan.yearlyPrice)}
                              </span>
                              <span className="text-slate-400 text-xs">/ano</span>
                            </div>
                            {savings > 0 && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full inline-block w-fit font-medium">
                                Economize {savings}%
                              </span>
                            )}
                          </div>
                        )}
                        {plan.shipping && (
                          <p className="text-xs text-slate-400 mt-1">+ custos de frete</p>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1 mt-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {(() => {
                    const btn = getPlanButtonState(plan.name, user, plan.isComingSoon)
                    return (
                      <Button
                        size="lg"
                        className={cn(
                          'w-full',
                          btn.variant === 'default' && !plan.isComingSoon
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : '',
                          plan.isComingSoon
                            ? 'bg-[#7ce2a6] hover:bg-[#7ce2a6] text-white cursor-not-allowed opacity-80'
                            : '',
                        )}
                        variant={btn.variant}
                        disabled={btn.disabled}
                        onClick={() => {
                          if (btn.disabled) return
                          if (!user) {
                            navigate(
                              plan.dbPlan ? `/register?planId=${plan.dbPlan.id}` : '/register',
                            )
                            return
                          }
                          if (plan.monthlyPrice === 0 || btn.label === 'Fazer Downgrade') {
                            navigate('/plataforma')
                            return
                          }
                          handleSelectPlan(plan.dbPlan)
                        }}
                      >
                        {plan.isComingSoon && <Clock className="mr-2 w-4 h-4" />}
                        {btn.label}
                      </Button>
                    )
                  })()}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {!user && (
          <p className="text-center mt-12 text-sm text-slate-500">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Faça login
            </Link>{' '}
            ou{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              cadastre-se
            </Link>
          </p>
        )}
      </section>

      <SubscriptionCheckoutModal
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        plan={selectedPlan}
      />
    </div>
  )
}

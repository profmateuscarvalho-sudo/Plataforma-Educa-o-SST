import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, AlertCircle, Crown, Award, Sparkles } from 'lucide-react'
import { getSubscriptionPlans } from '@/services/subscription-plans'
import { useAuth } from '@/hooks/use-auth'
import { SubscriptionCheckoutModal } from '@/components/SubscriptionCheckoutModal'
import { SubscriptionPlan } from '@/types'
import { cn } from '@/lib/utils'

const tierRank: Record<string, number> = { free: 1, prata: 2, ouro: 3 }

export default function Planos() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const isExpired = searchParams.get('expired') === '1'

  useEffect(() => {
    getSubscriptionPlans().then(setPlans).catch(console.error)
  }, [])

  const freePlan = plans.find((p) => p.name.toLowerCase().includes('free'))
  const prataPlan = plans.find(
    (p) => p.name.toLowerCase().includes('prata') && p.interval === billing,
  )
  const ouroPlan = plans.find(
    (p) => p.name.toLowerCase().includes('ouro') && p.interval === billing,
  )

  const userTier = user?.plan_tier || 'free'
  const isActive = user?.contract_end_date && new Date(user.contract_end_date) >= new Date()
  const activeTier = user?.role === 'admin' ? 'ouro' : isActive ? userTier : 'free'

  const handleSelectPlan = (plan: SubscriptionPlan | undefined) => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    if (!plan || plan.price === 0) return
    setSelectedPlan(plan)
    setIsCheckoutOpen(true)
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const tiers = [
    {
      name: 'Free',
      tier: 'free',
      icon: Sparkles,
      plan: freePlan,
      monthlyPrice: 0,
      features: freePlan?.features || [],
      accent: 'border-slate-200',
      iconColor: 'text-slate-400',
    },
    {
      name: 'Prata',
      tier: 'prata',
      icon: Award,
      plan: prataPlan,
      monthlyPrice: billing === 'monthly' ? 49.9 : 29.9,
      totalPrice: prataPlan?.price,
      features: prataPlan?.features || [],
      accent: 'border-blue-300 ring-2 ring-blue-200',
      iconColor: 'text-blue-500',
      highlighted: true,
    },
    {
      name: 'Ouro',
      tier: 'ouro',
      icon: Crown,
      plan: ouroPlan,
      monthlyPrice: billing === 'monthly' ? 89.9 : 69.9,
      totalPrice: ouroPlan?.price,
      features: ouroPlan?.features || [],
      accent: 'border-amber-300',
      iconColor: 'text-amber-500',
    },
  ]

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
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-xl border bg-white p-1 shadow-sm">
            <button
              onClick={() => setBilling('monthly')}
              className={cn(
                'px-6 py-2.5 rounded-lg text-sm font-medium transition-colors',
                billing === 'monthly' ? 'bg-secondary text-white' : 'text-slate-500',
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={cn(
                'px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                billing === 'yearly' ? 'bg-secondary text-white' : 'text-slate-500',
              )}
            >
              Anual
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Economize 40%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((t) => {
            const isCurrent = activeTier === t.tier
            const hasHigher = tierRank[activeTier] >= tierRank[t.tier]
            return (
              <Card key={t.tier} className={cn('relative overflow-hidden flex flex-col', t.accent)}>
                {t.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold py-1.5 text-center">
                    MAIS POPULAR
                  </div>
                )}
                <CardHeader className={cn('pb-4', t.highlighted && 'pt-8')}>
                  <div className="flex items-center gap-2 mb-1">
                    <t.icon className={cn('w-6 h-6', t.iconColor)} />
                    <CardTitle className="text-2xl font-serif">{t.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-2">
                    {t.monthlyPrice === 0 ? (
                      <span className="text-4xl font-bold text-secondary">Grátis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-primary">
                          {fmt(t.monthlyPrice)}
                        </span>
                        <span className="text-slate-500 ml-1 text-sm">/mês</span>
                        {billing === 'yearly' && t.totalPrice && (
                          <p className="text-xs text-slate-400 mt-1">
                            Cobrado {fmt(t.totalPrice)} por ano
                            {t.tier === 'ouro' && ' + frete'}
                          </p>
                        )}
                        {billing === 'monthly' && t.tier === 'ouro' && (
                          <p className="text-xs text-slate-400 mt-1">+ custos de frete</p>
                        )}
                      </>
                    )}
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1 mt-4">
                    {(t.features || []).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    className="w-full"
                    variant={isCurrent ? 'outline' : hasHigher ? 'outline' : 'default'}
                    disabled={isCurrent || hasHigher}
                    onClick={() => handleSelectPlan(t.plan)}
                  >
                    {isCurrent
                      ? 'Plano Atual'
                      : hasHigher
                        ? 'Incluso no seu plano'
                        : t.monthlyPrice === 0
                          ? 'Começar Grátis'
                          : tierRank[activeTier] >= tierRank[t.tier]
                            ? 'Plano Atual'
                            : tierRank[activeTier] > 0 && tierRank[activeTier] < tierRank[t.tier]
                              ? 'Fazer Upgrade'
                              : 'Assinar Agora'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {!user && (
          <p className="text-center mt-8 text-sm text-slate-500">
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

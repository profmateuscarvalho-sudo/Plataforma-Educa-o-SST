import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Sparkles, Award, Crown, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSubscriptionPlans } from '@/services/subscription-plans'
import { SubscriptionPlan } from '@/types'

interface PlanDef {
  name: string
  icon: typeof Sparkles
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  accent: string
  iconColor: string
  highlighted?: boolean
  shipping?: boolean
  cta: string
  ctaLink: string
  isComingSoon: boolean
}

const DEFAULT_PLANS: PlanDef[] = [
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
      'Feed de Cases',
    ],
    accent: 'border-slate-200',
    iconColor: 'text-slate-400',
    cta: 'Assine Gratuitamente',
    ctaLink: '/register',
    isComingSoon: false,
  },
  {
    name: 'Prata',
    icon: Award,
    monthlyPrice: 49.9,
    yearlyPrice: 358.8,
    features: [
      'Hub do aluno',
      'Revista Educação SST digital',
      'Todos os cursos da plataforma',
      'Aulas ao vivo (toda quarta feira) + Gravações',
      'Caderno de Estudos Digital',
      'Feed de Cases',
      'Documentários',
      'Desconto exclusivo em mentorias',
    ],
    accent: 'border-blue-300 ring-2 ring-blue-200',
    iconColor: 'text-blue-500',
    highlighted: true,
    cta: 'Assine',
    ctaLink: '/planos',
    isComingSoon: false,
  },
  {
    name: 'Ouro',
    icon: Crown,
    monthlyPrice: 89.9,
    yearlyPrice: 838.8,
    shipping: true,
    features: [
      'Todos os benefícios do Prata',
      'Box+ com edição física/impressa da Revista Educação SST',
    ],
    accent: 'border-amber-300',
    iconColor: 'text-amber-500',
    cta: 'Assine',
    ctaLink: '/planos',
    isComingSoon: false,
  },
]

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function PricingSection() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])

  useEffect(() => {
    getSubscriptionPlans()
      .then(setPlans)
      .catch(() => {})
  }, [])

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

    if (!dbPlan) return def

    const yearlyFallback =
      def.name === 'Prata'
        ? findPlan(['Prata Anual'])?.price
        : def.name === 'Ouro'
          ? findPlan(['Ouro Anual'])?.price
          : undefined

    return {
      ...def,
      monthlyPrice: dbPlan.price ?? def.monthlyPrice,
      yearlyPrice: dbPlan.price_yearly ?? yearlyFallback ?? def.yearlyPrice,
      isComingSoon: dbPlan.is_coming_soon ?? false,
    }
  })

  return (
    <section id="planos" className="py-24 bg-white scroll-mt-16 relative z-20">
      <div className="container px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-secondary mb-4">Escolha seu plano</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Tenha acesso ilimitado a todos os cursos, materiais e certificados da plataforma.
          </p>
        </div>

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
                  <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-xs font-bold py-1.5 text-center">
                    Em breve
                  </div>
                ) : plan.highlighted ? (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold py-1.5 text-center">
                    MAIS POPULAR
                  </div>
                ) : null}

                <CardHeader
                  className={cn('pb-4', (plan.highlighted || plan.isComingSoon) && 'pt-8')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <plan.icon className={cn('w-6 h-6', plan.iconColor)} />
                    <CardTitle className="text-2xl font-serif">{plan.name}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-2 space-y-1.5">
                    {plan.monthlyPrice === 0 ? (
                      <span className="text-4xl font-bold text-secondary">Grátis</span>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-primary">
                            {fmt(plan.monthlyPrice)}
                          </span>
                          <span className="text-slate-500 text-sm">/mês</span>
                        </div>
                        {plan.yearlyPrice > 0 && (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-semibold text-slate-600">
                                {fmt(plan.yearlyPrice)}
                              </span>
                              <span className="text-slate-400 text-xs">/ano</span>
                            </div>
                            {savings > 0 && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full inline-block w-fit">
                                Economize {savings}%
                              </span>
                            )}
                          </div>
                        )}
                        {plan.shipping && (
                          <p className="text-xs text-slate-400 mt-0.5">+ custos de frete</p>
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

                  {plan.isComingSoon ? (
                    <Button size="lg" className="w-full" disabled>
                      <Clock className="mr-2 w-4 h-4" />
                      Indisponível
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full" asChild>
                      {plan.ctaLink.startsWith('#') ? (
                        <a href={plan.ctaLink}>{plan.cta}</a>
                      ) : (
                        <Link to={plan.ctaLink}>{plan.cta}</Link>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

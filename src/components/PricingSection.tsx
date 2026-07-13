import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Sparkles, Award, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

const PLANS: PlanDef[] = [
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
    ctaLink: '#hero',
  },
  {
    name: 'Prata',
    icon: Award,
    monthlyPrice: 49.9,
    yearlyPrice: 29.9,
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
  },
  {
    name: 'Ouro',
    icon: Crown,
    monthlyPrice: 89.9,
    yearlyPrice: 69.9,
    shipping: true,
    features: [
      'Todos os benefícios do Prata',
      'Box+ com edição física/impressa da Revista Educação SST',
    ],
    accent: 'border-amber-300',
    iconColor: 'text-amber-500',
    cta: 'Assine',
    ctaLink: '/planos',
  },
]

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')

  return (
    <section id="planos" className="py-24 bg-white scroll-mt-16 relative z-20">
      <div className="container px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-secondary mb-4">Escolha seu plano</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Tenha acesso ilimitado a todos os cursos, materiais e certificados da plataforma.
          </p>
        </div>

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
          {PLANS.map((plan) => {
            const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
            return (
              <Card
                key={plan.name}
                className={cn('relative overflow-hidden flex flex-col', plan.accent)}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold py-1.5 text-center">
                    MAIS POPULAR
                  </div>
                )}
                <CardHeader className={cn('pb-4', plan.highlighted && 'pt-8')}>
                  <div className="flex items-center gap-2 mb-1">
                    <plan.icon className={cn('w-6 h-6', plan.iconColor)} />
                    <CardTitle className="text-2xl font-serif">{plan.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-2">
                    {price === 0 ? (
                      <span className="text-4xl font-bold text-secondary">Grátis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-primary">{fmt(price)}</span>
                        <span className="text-slate-500 ml-1 text-sm">/mês</span>
                        {billing === 'yearly' && (
                          <p className="text-xs text-slate-400 mt-1">
                            Cobrado anualmente{plan.shipping ? ' + frete' : ''}
                          </p>
                        )}
                        {billing === 'monthly' && plan.shipping && (
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
                  <Button size="lg" className="w-full" asChild>
                    {plan.ctaLink.startsWith('#') ? (
                      <a href={plan.ctaLink}>{plan.cta}</a>
                    ) : (
                      <Link to={plan.ctaLink}>{plan.cta}</Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

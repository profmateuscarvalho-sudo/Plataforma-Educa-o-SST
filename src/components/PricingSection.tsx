import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Sparkles, Award, Crown, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useSubscriptionPlans } from '@/hooks/use-subscription-plans'
import { getPlanButtonState } from '@/lib/plan-utils'
import { SubscriptionPlan } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

const parseFeatures = (features: any): string[] => {
  if (!features) return []
  if (Array.isArray(features)) return features
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features)
      return Array.isArray(parsed) ? parsed : [features]
    } catch {
      return [features]
    }
  }
  return []
}

const cleanPlanDisplayName = (rawName: string) => {
  const trimmed = (rawName || '').trim()
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('free')) return 'Free'
  if (lower.startsWith('prata')) return 'Prata'
  if (lower.startsWith('ouro')) return 'Ouro'
  return trimmed
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function PricingSection() {
  const { plans, loading, error, refetch } = useSubscriptionPlans()
  const { user } = useAuth()

  const orderedTiers = ['Free', 'Prata', 'Ouro']
  const displayPlans = plans
    .slice()
    .sort((a, b) => {
      const tierIndexA = orderedTiers.indexOf(cleanPlanDisplayName(a.name))
      const tierIndexB = orderedTiers.indexOf(cleanPlanDisplayName(b.name))
      if (tierIndexA !== -1 && tierIndexB !== -1) return tierIndexA - tierIndexB
      if (tierIndexA !== -1) return -1
      if (tierIndexB !== -1) return 1
      return (a.price || 0) - (b.price || 0)
    })
    .map((dbPlan) => {
      const displayName = cleanPlanDisplayName(dbPlan.name)
      const isFree = displayName === 'Free'
      const isPrata = displayName === 'Prata'
      const isOuro = displayName === 'Ouro'
      const icon = isOuro ? Crown : isPrata ? Award : Sparkles
      const iconColor = isOuro ? 'text-amber-500' : isPrata ? 'text-blue-500' : 'text-slate-400'
      const accent = isPrata
        ? 'border-blue-300 ring-2 ring-blue-200'
        : isOuro
          ? 'border-amber-300'
          : 'border-slate-200'

      return {
        name: displayName,
        icon,
        iconColor,
        accent,
        highlighted: isPrata,
        monthlyPrice: dbPlan.price,
        yearlyPrice: dbPlan.price_yearly || 0,
        shipping: isOuro,
        features: parseFeatures(dbPlan.features),
        isComingSoon: !!dbPlan.is_coming_soon,
        dbPlan,
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

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="relative overflow-hidden flex flex-col border-slate-200 min-h-[460px] p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="w-6 h-6 rounded-md bg-slate-200" />
                  <Skeleton className="w-24 h-6 rounded bg-slate-200" />
                </div>
                <Skeleton className="w-32 h-10 rounded bg-slate-200 mb-6" />
                <div className="space-y-2 mb-6 flex-1">
                  <Skeleton className="w-full h-4 rounded bg-slate-100" />
                  <Skeleton className="w-5/6 h-4 rounded bg-slate-100" />
                  <Skeleton className="w-4/6 h-4 rounded bg-slate-100" />
                  <Skeleton className="w-3/4 h-4 rounded bg-slate-100" />
                </div>
                <Skeleton className="w-full h-11 rounded-md bg-slate-200" />
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="max-w-md mx-auto text-center p-8 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <p className="text-slate-700 text-sm font-medium">
              Não foi possível carregar os planos. Tente novamente.
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        )}

        {!loading && !error && (
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
                      if (btn.disabled) {
                        return (
                          <Button
                            size="lg"
                            className={cn(
                              'w-full',
                              plan.isComingSoon
                                ? 'bg-[#7ce2a6] hover:bg-[#7ce2a6] text-white cursor-not-allowed opacity-80'
                                : '',
                            )}
                            variant={btn.variant}
                            disabled
                          >
                            {plan.isComingSoon && <Clock className="mr-2 w-4 h-4" />}
                            {btn.label}
                          </Button>
                        )
                      }
                      const linkTo = !user
                        ? plan.dbPlan
                          ? `/register?planId=${plan.dbPlan.id}`
                          : '/register'
                        : plan.monthlyPrice === 0
                          ? '/plataforma'
                          : '/planos'
                      return (
                        <Button
                          size="lg"
                          className={cn(
                            'w-full',
                            btn.variant === 'default'
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              : '',
                          )}
                          variant={btn.variant}
                          asChild
                        >
                          <Link to={linkTo}>{btn.label}</Link>
                        </Button>
                      )
                    })()}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

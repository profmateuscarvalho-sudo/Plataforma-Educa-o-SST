import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Crown, Award, Sparkles } from 'lucide-react'
import { SubscriptionCheckoutModal } from '@/components/SubscriptionCheckoutModal'
import { useAuth } from '@/hooks/use-auth'
import { SubscriptionPlan } from '@/types'
import { cn } from '@/lib/utils'
import { getPlanButtonState } from '@/lib/plan-utils'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export function PlanSection({
  plans,
  billing = 'yearly',
}: {
  plans: SubscriptionPlan[]
  billing?: 'monthly' | 'yearly'
}) {
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const freePlan = plans.find((p) => p.name.toLowerCase().includes('free'))
  const prataPlan = plans.find(
    (p) => p.name.toLowerCase().includes('prata') && p.interval === billing,
  )
  const ouroPlan = plans.find(
    (p) => p.name.toLowerCase().includes('ouro') && p.interval === billing,
  )

  const tiers = [
    {
      name: 'Free',
      tier: 'free',
      icon: Sparkles,
      plan: freePlan,
      monthlyPrice: 0,
      features: freePlan?.features || [],
      iconColor: 'text-slate-400',
    },
    {
      name: 'Prata',
      tier: 'prata',
      icon: Award,
      plan: prataPlan,
      monthlyPrice: billing === 'monthly' ? 49.9 : 29.9,
      features: prataPlan?.features || [],
      iconColor: 'text-blue-500',
      highlighted: true,
    },
    {
      name: 'Ouro',
      tier: 'ouro',
      icon: Crown,
      plan: ouroPlan,
      monthlyPrice: billing === 'monthly' ? 89.9 : 69.9,
      features: ouroPlan?.features || [],
      iconColor: 'text-amber-500',
    },
  ]

  const handleSelect = (plan: SubscriptionPlan | undefined) => {
    if (!plan || plan.price === 0) return
    setSelected(plan)
    setOpen(true)
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-serif font-bold text-secondary">Planos de Assinatura</h3>
        <p className="text-slate-500 text-sm mt-1">
          Faça upgrade para acessar todos os recursos da plataforma.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t) => {
          return (
            <Card
              key={t.tier}
              className={cn(
                'relative overflow-hidden flex flex-col',
                t.highlighted && 'ring-2 ring-blue-200 border-blue-300',
              )}
            >
              {t.highlighted && (
                <Badge className="absolute top-0 right-0 bg-blue-600 text-white text-xs rounded-bl-lg">
                  Popular
                </Badge>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <t.icon className={cn('w-5 h-5', t.iconColor)} />
                  <CardTitle className="text-xl font-serif">{t.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-3">
                  {t.monthlyPrice === 0 ? (
                    <span className="text-2xl font-bold text-secondary">Grátis</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-primary">{fmt(t.monthlyPrice)}</span>
                      <span className="text-slate-500 ml-1 text-xs">/mês</span>
                    </>
                  )}
                </div>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {(t.features || []).slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {(() => {
                  const btn = getPlanButtonState(t.name, user, t.plan?.is_coming_soon)
                  return (
                    <Button
                      className="w-full"
                      variant={btn.variant}
                      disabled={btn.disabled}
                      onClick={() => {
                        if (btn.disabled) return
                        if (btn.label === 'Fazer Downgrade') return
                        handleSelect(t.plan)
                      }}
                    >
                      {btn.label}
                    </Button>
                  )
                })()}
              </CardContent>
            </Card>
          )
        })}
      </div>
      <SubscriptionCheckoutModal isOpen={open} setIsOpen={setOpen} plan={selected} />
    </div>
  )
}

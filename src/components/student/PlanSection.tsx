import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { SubscriptionCheckoutModal } from '@/components/SubscriptionCheckoutModal'
import { SubscriptionPlan } from '@/types'

export function PlanSection({ plans }: { plans: SubscriptionPlan[] }) {
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null)
  const [open, setOpen] = useState(false)

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-serif font-bold text-secondary">Planos de Assinatura</h3>
        <p className="text-slate-500 text-sm mt-1">
          Tenha acesso ilimitado a todos os cursos, materiais e certificados da plataforma.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden flex flex-col">
            {plan.interval === 'yearly' && (
              <Badge className="absolute top-0 right-0 bg-accent text-secondary text-xs font-bold px-3 py-1 rounded-bl-lg">
                MAIS VANTAJOSO
              </Badge>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-serif">{plan.name}</CardTitle>
              <p className="text-sm text-slate-500">{plan.description}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-3xl font-bold text-primary">{fmt(plan.price)}</span>
                <span className="text-slate-500 ml-1 text-sm">
                  /{plan.interval === 'monthly' ? 'mês' : 'ano'}
                </span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {(plan.features || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                onClick={() => {
                  setSelected(plan)
                  setOpen(true)
                }}
              >
                Assinar Agora
              </Button>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && (
          <p className="text-slate-500 text-center py-8 col-span-full">
            Nenhum plano disponível no momento.
          </p>
        )}
      </div>
      <SubscriptionCheckoutModal isOpen={open} setIsOpen={setOpen} plan={selected} />
    </div>
  )
}

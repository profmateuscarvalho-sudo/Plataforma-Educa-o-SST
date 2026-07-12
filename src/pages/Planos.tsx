import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, AlertCircle } from 'lucide-react'
import { getSubscriptionPlans } from '@/services/subscription-plans'
import { useAuth } from '@/hooks/use-auth'
import { SubscriptionCheckoutModal } from '@/components/SubscriptionCheckoutModal'
import { SubscriptionPlan } from '@/types'

export default function Planos() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const isExpired = searchParams.get('expired') === '1'

  useEffect(() => {
    getSubscriptionPlans().then(setPlans).catch(console.error)
  }, [])

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    setSelectedPlan(plan)
    setIsCheckoutOpen(true)
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative overflow-hidden flex flex-col">
              {plan.interval === 'yearly' && (
                <div className="absolute top-0 right-0 bg-accent text-secondary text-xs font-bold px-4 py-1 rounded-bl-lg">
                  MAIS VANTAJOSO
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-serif">{plan.name}</CardTitle>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(plan.price)}
                  </span>
                  <span className="text-slate-500 ml-2">
                    /{plan.interval === 'monthly' ? 'mes' : 'ano'}
                  </span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {(plan.features || []).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full" onClick={() => handleSelectPlan(plan)}>
                  Assinar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!user && (
          <p className="text-center mt-8 text-sm text-slate-500">
            Ja tem conta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Faca login
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

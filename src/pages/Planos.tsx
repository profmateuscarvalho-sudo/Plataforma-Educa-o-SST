import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSubscriptionPlans } from '@/hooks/use-subscription-plans'
import { SubscriptionCheckoutModal } from '@/components/SubscriptionCheckoutModal'
import { SubscriptionPlan } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { HomePlansSection } from '@/components/HomePlansSection'

export default function Planos() {
  const { plans } = useSubscriptionPlans()
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const isExpired = searchParams.get('expired') === '1'
  const checkoutPlanId = searchParams.get('planId')
  const isCheckout = searchParams.get('checkout') === '1'

  useEffect(() => {
    if (isCheckout && checkoutPlanId && user && plans.length > 0) {
      const plan = plans.find((p) => p.id === checkoutPlanId)
      if (plan) {
        setSelectedPlan(plan)
        setIsCheckoutOpen(true)
      }
    }
  }, [isCheckout, checkoutPlanId, user, plans])

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C1B18] pb-24">
      {/* Cabeçalho interno padronizado */}
      <PageHeader
        badge="Planos de Assinatura"
        title="Escolha seu plano de acesso"
        description="Revista, cursos, aulas ao vivo e simulados reunidos em um itinerário prático. Comece grátis e avance quando fizer sentido."
      />

      {isExpired && (
        <div className="max-w-[1200px] mx-auto px-6 mt-8">
          <div className="bg-amber-50 border border-amber-200 rounded-[28px] p-5 flex items-center gap-3 text-amber-900">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-700" />
            <p className="text-sm font-medium">
              Sua assinatura expirou. Escolha um plano abaixo para renovar seu acesso.
            </p>
          </div>
        </div>
      )}

      {/* Mesmos cartões da home (selos Disponível agora/Em breve, botão Avise-me quando abrir gravando em lista_espera, checks em --success, preços dinâmicos, cartões 28px) */}
      <HomePlansSection />

      {/* Rodapé auxiliar de login/cadastro se deslogado */}
      {!user && (
        <div className="max-w-[1200px] mx-auto px-6 text-center -mt-6">
          <p className="text-sm text-[#7F7869]">
            Já tem conta?{' '}
            <Link to="/login" className="text-[#1C1B18] font-bold underline hover:text-[#173F33]">
              Faça login
            </Link>{' '}
            ou{' '}
            <Link
              to="/register"
              className="text-[#1C1B18] font-bold underline hover:text-[#173F33]"
            >
              cadastre-se
            </Link>
          </p>
        </div>
      )}

      {/* Modal de checkout caso acionado via URL direta com checkout=1 */}
      <SubscriptionCheckoutModal
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        plan={selectedPlan}
      />
    </div>
  )
}

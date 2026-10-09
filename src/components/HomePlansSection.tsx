import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Check, CheckCircle2, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSubscriptionPlans } from '@/services/subscription-plans'
import { useAuth } from '@/hooks/use-auth'
import { SubscriptionPlan } from '@/types'
import { cadastrarListaEspera } from '@/services/lista_espera'

const DEFAULT_PLANS_CONFIG = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    isAvailable: true,
    isComingSoon: false,
    exclusiveFeatures: [
      'Hub do aluno',
      'Revista Educação SST digital',
      'Cursos selecionados',
      'Aulas ao vivo (toda quarta feira)',
      'Caderno de Estudos Digital',
      'Ágora de Debates Técnicos',
    ],
  },
  {
    name: 'Prata',
    monthlyPrice: 49.9,
    yearlyPrice: 499.9,
    isAvailable: false,
    isComingSoon: true,
    exclusiveFeatures: [
      'Todos os cursos da plataforma',
      'Gravações de aulas ao vivo anteriores',
      'Documentários exclusivos',
      'Descontos exclusivos em mentorias',
    ],
  },
  {
    name: 'Ouro',
    monthlyPrice: 89.9,
    yearlyPrice: 899.9,
    isAvailable: false,
    isComingSoon: true,
    shippingNotice: true,
    exclusiveFeatures: [
      'Box+ com edição física/impressa da Revista Educação SST',
      'Frete incluso para todo o Brasil',
    ],
  },
]

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function HomePlansSection() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const { user } = useAuth()
  const navigate = useNavigate()

  // Modal lista de espera
  const [waitlistPlan, setWaitlistPlan] = useState<string | null>(null)
  const [waitlistName, setWaitlistName] = useState('')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [waitlistSuccess, setWaitlistSuccess] = useState(false)
  const [waitlistError, setWaitlistError] = useState<string | null>(null)

  useEffect(() => {
    getSubscriptionPlans()
      .then(setPlans)
      .catch(() => {})
  }, [])

  const findPlan = (names: string[]) => plans.find((p) => names.includes(p.name))

  const displayPlans = DEFAULT_PLANS_CONFIG.map((def) => {
    const matchNames =
      def.name === 'Free'
        ? ['Free']
        : def.name === 'Prata'
          ? ['Prata Mensal', 'Prata']
          : def.name === 'Ouro'
            ? ['Ouro Mensal', 'Ouro']
            : []

    const dbPlan = findPlan(matchNames)
    const isComingSoon = dbPlan ? !!dbPlan.is_coming_soon : def.isComingSoon
    const isAvailable = !isComingSoon && (def.name === 'Free' || (dbPlan && !dbPlan.is_coming_soon))

    return {
      ...def,
      dbPlan,
      monthlyPrice: dbPlan?.price ?? def.monthlyPrice,
      yearlyPrice: dbPlan?.price_yearly ?? def.yearlyPrice,
      isComingSoon,
      isAvailable,
    }
  })

  const openWaitlist = (planName: string) => {
    setWaitlistPlan(planName)
    setWaitlistName(user?.name || '')
    setWaitlistEmail(user?.email || '')
    setWaitlistSuccess(false)
    setWaitlistError(null)
  }

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!waitlistName.trim() || !waitlistEmail.trim() || !waitlistPlan) return

    setWaitlistLoading(true)
    setWaitlistError(null)
    try {
      await cadastrarListaEspera({
        nome: waitlistName,
        email: waitlistEmail,
        plano: waitlistPlan,
      })
      setWaitlistSuccess(true)
    } catch (err: any) {
      console.error('Erro na lista de espera:', err)
      setWaitlistError('Não foi possível registrar seu interesse agora. Tente novamente.')
    } finally {
      setWaitlistLoading(false)
    }
  }

  return (
    <section id="planos" className="py-[72px] lg:py-[112px] bg-[#F2EEE4] scroll-mt-16 relative">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Cabeçalho */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="label-overline">PLANOS</span>
          <h2 className="title-h2-fluid text-[#1C1B18] mt-3">
            Comece grátis. <em>Avance quando fizer sentido.</em>
          </h2>
        </div>

        {/* 3 Cartões de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {displayPlans.map((plan) => {
            const isFree = plan.isAvailable

            return (
              <div
                key={plan.name}
                className={cn(
                  'rounded-[28px] p-8 flex flex-col justify-between transition-all relative',
                  isFree
                    ? 'bg-white border-2 border-[#1C1B18] shadow-[0_16px_36px_rgba(28,27,24,0.08)]'
                    : 'bg-[#FAF8F3] border border-[#E4DED1]',
                )}
              >
                <div>
                  {/* Selo */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B18]">
                      {plan.name}
                    </span>
                    {isFree ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FDBE2D] text-[#1C1B18] shadow-sm">
                        Disponível agora
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#7F7869] border border-[#E4DED1]">
                        Em breve
                      </span>
                    )}
                  </div>

                  {/* Preço */}
                  <div className="mb-6 pt-2">
                    {plan.monthlyPrice === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-[#1C1B18]">Grátis</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-bold text-[#1C1B18]">
                            {fmt(plan.monthlyPrice)}
                          </span>
                          <span className="text-sm text-[#7F7869]">/mês</span>
                        </div>
                        {plan.shippingNotice && (
                          <p className="text-xs text-[#7F7869]">+ custos de frete</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Divisor */}
                  <div className="h-[1px] bg-[#E4DED1] my-5" />

                  {/* Lista de Benefícios */}
                  <div className="space-y-3 mb-8">
                    {!isFree && (
                      <p className="text-xs sm:text-sm font-semibold text-[#1C1B18] mb-2">
                        {plan.name === 'Prata' ? 'Tudo do Free, e mais:' : 'Tudo do Prata, e mais:'}
                      </p>
                    )}
                    <ul className="space-y-2.5 text-xs sm:text-sm text-[#5F5A4F]">
                      {plan.exclusiveFeatures.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[#1F6B4A] shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Botão de Ação */}
                <div className="pt-4">
                  {isFree ? (
                    <Button
                      size="lg"
                      className="w-full h-12 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none"
                      onClick={() => {
                        if (!user) {
                          navigate('/register')
                        } else {
                          navigate('/plataforma')
                        }
                      }}
                    >
                      Começar grátis
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full h-12 rounded-full font-bold border-[#1C1B18] text-[#1C1B18] hover:bg-[#1C1B18] hover:text-[#FAF8F3] transition-colors"
                      onClick={() => openWaitlist(plan.name)}
                    >
                      Avise-me quando abrir
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal simples de Lista de Espera */}
      {waitlistPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            if (!waitlistLoading) setWaitlistPlan(null)
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-[28px] p-6 sm:p-8 shadow-2xl border border-[#E4DED1] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setWaitlistPlan(null)}
              disabled={waitlistLoading}
              className="absolute top-5 right-5 p-2 rounded-full text-[#7F7869] hover:bg-[#FAF8F3] hover:text-[#1C1B18] transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {waitlistSuccess ? (
              <div className="text-center py-6 animate-fade-in space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#E3F1E9] flex items-center justify-center text-[#1F6B4A]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#1C1B18]">
                  Interesse registrado!
                </h3>
                <p className="text-sm text-[#5F5A4F] leading-relaxed">
                  Obrigado, <strong>{waitlistName}</strong>. Vamos te avisar em primeira mão por
                  e-mail assim que o plano <strong>{waitlistPlan}</strong> for liberado.
                </p>
                <div className="pt-2">
                  <Button
                    className="rounded-full px-6 bg-[#1C1B18] text-[#FAF8F3] hover:bg-[#1C1B18]/90 font-bold"
                    onClick={() => setWaitlistPlan(null)}
                  >
                    Entendido
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <span className="label-overline">LISTA DE ESPERA</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B18] mt-1 mb-2">
                  Plano {waitlistPlan}
                </h3>
                <p className="text-sm text-[#5F5A4F] mb-6">
                  Preencha seus dados para receber o aviso antecipado e condições especiais de
                  lançamento.
                </p>

                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1B18] mb-1.5">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      required
                      value={waitlistName}
                      onChange={(e) => setWaitlistName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full h-11 px-4 rounded-xl border border-[#E4DED1] bg-[#FAF8F3] text-sm text-[#1C1B18] focus:outline-none focus:border-[#1C1B18]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1B18] mb-1.5">
                      E-mail profissional
                    </label>
                    <input
                      type="email"
                      required
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="w-full h-11 px-4 rounded-xl border border-[#E4DED1] bg-[#FAF8F3] text-sm text-[#1C1B18] focus:outline-none focus:border-[#1C1B18]"
                    />
                  </div>

                  {waitlistError && (
                    <p className="text-xs text-[#B4472E] font-medium">{waitlistError}</p>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={waitlistLoading}
                      className="w-full h-12 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none flex items-center justify-center gap-2"
                    >
                      {waitlistLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Quero ser avisado
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

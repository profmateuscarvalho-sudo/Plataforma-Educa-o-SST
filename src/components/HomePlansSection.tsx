import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Check, CheckCircle2, Loader2, X, RefreshCw, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useSubscriptionPlans } from '@/hooks/use-subscription-plans'
import { SubscriptionPlan } from '@/types'
import { cadastrarListaEspera } from '@/services/lista_espera'

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

export function HomePlansSection() {
  const { plans, loading, error, refetch } = useSubscriptionPlans()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Modal lista de espera
  const [waitlistPlan, setWaitlistPlan] = useState<string | null>(null)
  const [waitlistName, setWaitlistName] = useState('')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [waitlistSuccess, setWaitlistSuccess] = useState(false)
  const [waitlistError, setWaitlistError] = useState<string | null>(null)

  // Identifica e agrupa planos a partir dos dados do PocketBase (sem fallbacks hardcoded)
  const orderedTiers = ['Free', 'Prata', 'Ouro']
  const displayPlans = plans
    // Ordena priorizando Free -> Prata -> Ouro e depois por preço
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
      const isComingSoon = !!dbPlan.is_coming_soon
      const isFree =
        (dbPlan.price === 0 || dbPlan.name.toLowerCase().startsWith('free')) && !isComingSoon
      const displayName = cleanPlanDisplayName(dbPlan.name)
      const features = parseFeatures(dbPlan.features)
      const isOuro = displayName.toLowerCase() === 'ouro'

      return {
        id: dbPlan.id,
        name: displayName,
        rawName: dbPlan.name,
        monthlyPrice: dbPlan.price,
        yearlyPrice: dbPlan.price_yearly,
        isComingSoon,
        isAvailable: isFree,
        shippingNotice: isOuro,
        exclusiveFeatures: features,
        dbPlan,
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

        {/* Estado 1: Carregamento com Skeletons (mesma altura dos cartões finais para não pular) */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="rounded-[28px] p-8 flex flex-col justify-between bg-white border border-[#E4DED1] min-h-[520px] shadow-[0_8px_20px_rgba(28,27,24,0.04)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-8 w-28 rounded-md bg-[#E4DED1]/70" />
                    <Skeleton className="h-6 w-24 rounded-full bg-[#E4DED1]/70" />
                  </div>
                  <div className="mb-6 pt-2">
                    <Skeleton className="h-10 w-36 rounded-md bg-[#E4DED1]/70" />
                  </div>
                  <div className="h-[1px] bg-[#E4DED1] my-5" />
                  <div className="space-y-3 mb-8">
                    <Skeleton className="h-4 w-40 rounded bg-[#E4DED1]/70 mb-2" />
                    <Skeleton className="h-4 w-full rounded bg-[#E4DED1]/70" />
                    <Skeleton className="h-4 w-5/6 rounded bg-[#E4DED1]/70" />
                    <Skeleton className="h-4 w-4/6 rounded bg-[#E4DED1]/70" />
                    <Skeleton className="h-4 w-3/4 rounded bg-[#E4DED1]/70" />
                  </div>
                </div>
                <div className="pt-4">
                  <Skeleton className="h-12 w-full rounded-full bg-[#E4DED1]/70" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado 2: Erro com mensagem curta e botão retry */}
        {!loading && error && (
          <div className="max-w-md mx-auto bg-white border border-[#E4DED1] rounded-[28px] p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF8F3] border border-[#E4DED1] flex items-center justify-center text-[#B4472E]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-base font-medium text-[#1C1B18]">
              Não foi possível carregar os planos. Tente novamente.
            </p>
            <Button
              onClick={() => refetch()}
              className="rounded-full px-6 font-bold bg-[#1C1B18] text-[#FAF8F3] hover:bg-[#1C1B18]/90 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Estado 3: Cartões com dados dinâmicos do PocketBase */}
        {!loading && !error && displayPlans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {displayPlans.map((plan) => {
              const isFree = plan.isAvailable

              return (
                <div
                  key={plan.id}
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

                    {/* Lista de Benefícios da coleção */}
                    <div className="space-y-3 mb-8">
                      {!isFree && (
                        <p className="text-xs sm:text-sm font-semibold text-[#1C1B18] mb-2">
                          {plan.name === 'Prata'
                            ? 'Tudo do Free, e mais:'
                            : 'Tudo do Prata, e mais:'}
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
        )}
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

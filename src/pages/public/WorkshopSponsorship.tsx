import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowRight,
  CheckCircle,
  TrendingUp,
  ShieldCheck,
  HeartHandshake,
  User,
  Sparkles,
} from 'lucide-react'
import { PlatformEvent } from '@/types'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'

export default function WorkshopSponsorship() {
  const { id } = useParams()
  const [event, setEvent] = useState<PlatformEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const record = await pb.collection('events').getOne<PlatformEvent>(id!)
        setEvent(record)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchEvent()
  }, [id])

  if (loading)
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  if (!event)
    return (
      <div className="min-h-screen flex items-center justify-center">Evento não encontrado.</div>
    )

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-amber-500 selection:text-white pb-20">
      {/* Header */}
      <header className="bg-slate-950 text-white py-24 px-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-[url('https://img.usecurling.com/p/800/800?q=handshake%20corporate&color=black')] bg-cover bg-center" />
        <div className="max-w-5xl mx-auto relative z-10 space-y-6">
          <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0 px-4 py-1.5 uppercase tracking-widest text-xs">
            <Sparkles className="w-3 h-3 mr-2 inline" /> Proposta Estratégica
          </Badge>
          <h1 className="text-4xl md:text-6xl font-serif font-bold max-w-3xl leading-tight">
            Seja parceiro do{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
              {event.title}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl font-light leading-relaxed">
            Associe a sua marca à vanguarda da Saúde, Segurança do Trabalho e Bem-estar
            Organizacional (HWAW).
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
        {/* The "Why" Section */}
        <section className="grid lg:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
              O Impacto Organizacional
            </h2>
            <div className="w-16 h-1 bg-amber-500 rounded-full" />
            <div className="prose prose-slate text-slate-600 leading-relaxed max-w-none text-lg font-light">
              {event.importance ? (
                <div dangerouslySetInnerHTML={{ __html: event.importance }} />
              ) : (
                <p>
                  Os Fatores Psicossociais são hoje determinantes críticos para a saúde
                  organizacional. Investir na saúde e no bem-estar não é mais uma opção, é um
                  requisito estratégico para atração de talentos e produtividade sustentável.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6 pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <span className="block font-semibold text-slate-900">Produtividade</span>
                  <span className="text-sm text-slate-500">Engajamento sustentável</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <span className="block font-semibold text-slate-900">Conformidade</span>
                  <span className="text-sm text-slate-500">Alinhamento ESG</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-square">
            <img
              src="https://img.usecurling.com/p/800/1000?q=corporate%20meeting&color=gray"
              alt="Corporate Meeting"
              className="object-cover w-full h-full"
            />
          </div>
        </section>

        {/* Objectives */}
        {event.objectives && event.objectives.length > 0 && (
          <section className="bg-white rounded-3xl p-10 md:p-16 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
                Objetivos do Encontro
              </h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto mt-6 rounded-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {event.objectives.map((obj, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
                >
                  <CheckCircle className="w-6 h-6 text-amber-500 shrink-0" />
                  <p className="text-slate-700 font-medium leading-relaxed">{obj}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Speakers */}
        {event.speakers && event.speakers.length > 0 && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
                Palestrantes
              </h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {event.speakers.map((spk, i) => (
                <Card
                  key={i}
                  className="hover:shadow-lg transition-all duration-300 border-0 bg-white"
                >
                  <CardContent className="p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                    <div className="w-24 h-24 shrink-0 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-12 h-12 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-xl text-slate-900">{spk.name}</h4>
                      <p className="text-amber-600 font-medium">{spk.topic}</p>
                      {spk.bio && (
                        <p className="text-slate-500 text-sm leading-relaxed">{spk.bio}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Sponsorship Quotas */}
        <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
              Cotas de Patrocínio
            </h2>
            <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />
            <p className="text-slate-500 max-w-2xl mx-auto mt-6">
              Exclusividade e destaque para a sua marca perante líderes e tomadores de decisão em um
              ambiente de alto nível.
            </p>
          </div>

          <div
            className={`grid gap-8 ${event.sponsorship_tiers && event.sponsorship_tiers.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'max-w-2xl mx-auto'}`}
          >
            {event.sponsorship_tiers && event.sponsorship_tiers.length > 0 ? (
              event.sponsorship_tiers.map((tier, i) => (
                <Card
                  key={i}
                  className="relative border-2 border-slate-100 hover:border-amber-500/50 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden flex flex-col"
                >
                  {i === 0 && <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />}
                  <CardHeader className="text-center pb-6 pt-10 border-b border-slate-50">
                    <CardTitle className="text-2xl text-slate-900 font-bold">{tier.name}</CardTitle>
                    <div className="text-4xl font-black text-amber-600 mt-6">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0,
                      }).format(tier.price)}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-8">
                    <ul className="space-y-4 flex-1">
                      {tier.benefits.map((benefit, j) => (
                        <li key={j} className="flex items-start gap-3 text-slate-600">
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg mt-10 bg-slate-900 hover:bg-slate-800 text-white"
                      onClick={() =>
                        (window.location.href = `https://wa.me/5511999999999?text=Olá, tenho interesse na cota de patrocínio ${tier.name} do ${event.title}`)
                      }
                    >
                      Reservar Cota <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="relative border-2 border-amber-500/20 shadow-2xl bg-white overflow-hidden flex flex-col max-w-2xl mx-auto w-full">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-amber-600" />
                <CardHeader className="text-center pb-2 pt-12">
                  <CardTitle className="text-3xl text-slate-900 font-bold">
                    Cota Única de Patrocínio
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-10 space-y-10">
                  <div className="text-6xl font-black text-amber-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                    }).format(event.sponsorship_value || 10000)}
                  </div>

                  <div className="w-full space-y-4">
                    <ul className="space-y-4 text-left">
                      {[
                        'Logomarca em todos os materiais de divulgação digitais e impressos',
                        'Espaço privilegiado para banner promocional no evento',
                        'Menção nominal na abertura e encerramento',
                        'Acesso à lista completa de empresas participantes (networking VIP)',
                      ].map((benefit, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-4 text-slate-600 bg-slate-50 p-4 rounded-xl"
                        >
                          <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="font-medium">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-16 text-lg mt-4 bg-slate-900 hover:bg-slate-800 text-white shadow-xl"
                    onClick={() =>
                      (window.location.href = `https://wa.me/5511999999999?text=Olá, tenho interesse na cota de patrocínio do ${event.title}`)
                    }
                  >
                    Demonstrar Interesse <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

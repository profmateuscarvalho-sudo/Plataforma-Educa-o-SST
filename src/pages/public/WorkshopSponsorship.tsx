import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, CheckCircle, TrendingUp, ShieldCheck, HeartHandshake } from 'lucide-react'
import { PlatformEvent } from '@/types'
import pb from '@/lib/pocketbase/client'

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
    <div className="min-h-screen bg-slate-50 selection:bg-primary selection:text-primary-foreground pb-20">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground py-20 px-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-[url('https://img.usecurling.com/p/800/800?q=handshake&color=white')] bg-cover bg-center" />
        <div className="max-w-5xl mx-auto relative z-10">
          <span className="inline-block px-4 py-1 bg-primary/20 text-primary-foreground rounded-full text-sm font-medium mb-6">
            Proposta de Patrocínio
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 max-w-3xl leading-tight">
            Torne-se um parceiro do {event.title}
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl font-light">
            Associe sua marca à vanguarda da Saúde, Segurança do Trabalho e Bem-estar Corporativo
            (HWAW).
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-20">
        {/* The "Why" Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="space-y-6">
            <h2 className="text-3xl font-serif font-bold text-secondary">
              O Impacto da HWAW nas Organizações
            </h2>
            <div className="prose prose-slate text-muted-foreground leading-relaxed max-w-none">
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
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-slate-700">Aumento de Produtividade</span>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0" />
                <span className="text-sm font-medium text-slate-700">Conformidade Normativa</span>
              </div>
              <div className="flex items-start gap-3">
                <HeartHandshake className="w-6 h-6 text-rose-500 shrink-0" />
                <span className="text-sm font-medium text-slate-700">Retenção de Talentos</span>
              </div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-square">
            <img
              src="https://img.usecurling.com/p/800/800?q=corporate%20meeting&color=blue"
              alt="Corporate Meeting"
              className="object-cover w-full h-full"
            />
          </div>
        </section>

        {/* Objectives */}
        {event.objectives && event.objectives.length > 0 && (
          <section className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif font-bold text-secondary">
                Objetivos do Workshop
              </h2>
              <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {event.objectives.map((obj, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <CheckCircle className="w-6 h-6 text-primary shrink-0" />
                  <p className="text-slate-700 font-medium">{obj}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sponsorship Quota */}
        <section className="relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-b from-white to-slate-50 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
            <CardHeader className="text-center pb-2 pt-10">
              <CardTitle className="text-2xl text-secondary">Cota Única de Patrocínio</CardTitle>
              <p className="text-muted-foreground mt-2">
                Exclusividade e destaque para sua marca perante líderes e tomadores de decisão.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-10 space-y-8">
              <div className="text-5xl font-bold tracking-tight text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  event.sponsorship_value || 10000,
                )}
              </div>

              <div className="w-full max-w-md space-y-4">
                <ul className="space-y-3">
                  {[
                    'Logomarca em todos os materiais de divulgação',
                    'Espaço para banner promocional no evento',
                    'Menção nominal na abertura e encerramento',
                    'Acesso à lista de empresas participantes',
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                size="lg"
                className="w-full max-w-md h-14 text-lg mt-8"
                onClick={() =>
                  (window.location.href = `https://wa.me/5511999999999?text=Olá, tenho interesse na cota de patrocínio do ${event.title}`)
                }
              >
                Demonstrar Interesse via WhatsApp <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

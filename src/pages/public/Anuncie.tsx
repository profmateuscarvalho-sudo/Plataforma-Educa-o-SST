import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Users, MessageSquare, TrendingUp, Target, Award } from 'lucide-react'
import { getMagazineLandingPage } from '@/services/magazine_management'
import type { MagazineLandingPage } from '@/types'
import { PageHeader } from '@/components/PageHeader'

export default function Anuncie() {
  const [data, setData] = useState<MagazineLandingPage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMagazineLandingPage().then((res) => {
      if (res) setData(res as unknown as MagazineLandingPage)
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 space-y-8 flex flex-col items-center pt-24">
        <Skeleton className="w-[300px] h-8" />
        <Skeleton className="w-full max-w-4xl h-24" />
        <Skeleton className="w-full max-w-2xl h-16" />
      </div>
    )
  }

  const whatsappNumber = data.whatsapp_number.replace(/\D/g, '')
  const whatsappMessage = encodeURIComponent(
    `Olá! Tenho interesse em anunciar na Revista Educação SST.`,
  )
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Padronizado */}
      <PageHeader
        badge="Mídia Kit Educação SST"
        title={data.hero_title}
        description={data.hero_description}
      >
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button size="lg" className="h-12 px-8 text-base font-bold shadow-none" asChild>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="w-5 h-5 mr-2" /> {data.cta_text}
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base font-bold"
            onClick={() => {
              document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Ver Planos
          </Button>
        </div>
      </PageHeader>

      {/* Social Proof */}
      <section className="border-b border-border bg-card py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-16 max-w-2xl">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-full text-foreground">
                <Users className="w-6 h-6 text-foreground" />
              </div>
              <div className="text-left">
                <p className="text-3xl font-black text-foreground leading-none mb-1">
                  {data.readers_count}
                </p>
                <p className="label-overline">Leitores Ativos</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-full text-foreground">
                <Target className="w-6 h-6 text-foreground" />
              </div>
              <div className="text-left">
                <p className="text-3xl font-black text-foreground leading-none mb-1">Alto</p>
                <p className="label-overline">Engajamento</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study / Example Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground font-medium text-sm">
                <TrendingUp className="w-4 h-4" /> Formatos de Alto Impacto
              </div>
              <h2 className="text-4xl font-serif font-bold text-secondary">
                Sua marca em destaque ao lado de grandes nomes
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Nossos anunciantes recebem posicionamento premium em nossas edições digitais. Com
                design responsivo e interativo, seu anúncio não é apenas visto, mas explorado por
                profissionais altamente qualificados.
              </p>

              <ul className="space-y-4">
                {[
                  'Anúncios de página inteira (1/1 Página)',
                  'Links clicáveis direto para seu site ou WhatsApp',
                  'Posicionamento estratégico entre artigos de destaque',
                  'Design profissional e integrado à estética da revista',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="bg-primary/10 p-1 rounded-full mt-1">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 border-8 border-white/50">
                <div className="absolute top-0 right-0 bg-secondary text-white px-4 py-2 font-bold z-10 rounded-bl-xl shadow-md">
                  Exemplo de Anúncio
                </div>
                <div className="flex bg-slate-100 p-2 md:p-4 rounded-xl shadow-inner">
                  {/* Left page (content mock) */}
                  <div className="flex-1 bg-white aspect-[3/4] border-r border-slate-200 shadow-sm rounded-l-md relative overflow-hidden flex flex-col p-4">
                    <div className="w-full h-8 bg-slate-100 rounded mb-4"></div>
                    <div className="w-3/4 h-4 bg-slate-100 rounded mb-2"></div>
                    <div className="w-full h-4 bg-slate-100 rounded mb-2"></div>
                    <div className="w-5/6 h-4 bg-slate-100 rounded mb-8"></div>
                    <div className="flex-1 bg-slate-50 rounded border border-slate-100 flex items-center justify-center">
                      <span className="text-slate-300 font-medium">Artigo Especializado</span>
                    </div>
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/5 pointer-events-none"></div>
                  </div>

                  {/* Right page (ad mock) */}
                  <div className="flex-1 bg-white aspect-[3/4] shadow-sm rounded-r-md relative flex flex-col items-center justify-center p-6 border-l border-white">
                    <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none"></div>

                    <div className="w-20 h-20 border-4 border-slate-200 rounded-full mb-6 flex items-center justify-center bg-slate-50 relative z-10">
                      <span className="font-bold text-3xl text-slate-300">?</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-serif font-bold mb-3 text-slate-400 uppercase tracking-widest text-center leading-tight relative z-10">
                      Sua Marca
                      <br />
                      Aqui
                    </h2>
                    <p className="text-sm md:text-base font-medium text-slate-400 text-center relative z-10">
                      Página Inteira
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section id="planos" className="py-24 bg-slate-50 relative">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-secondary mb-4">
              Planos de Investimento
            </h2>
            <p className="text-lg text-slate-600">
              Escolha o plano ideal para a sua estratégia de marketing B2B.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {data.plans?.map((plan, idx) => (
              <Card
                key={idx}
                className={`shadow-lg flex flex-col border-slate-200 hover:shadow-xl transition-all hover:-translate-y-2`}
              >
                <CardContent className="p-8 flex-1 flex flex-col">
                  <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{plan.title}</h3>
                    <div className="text-primary font-bold bg-primary/10 inline-block px-3 py-1 rounded-full text-sm mb-4">
                      {plan.insertions}
                    </div>
                    <div className="text-4xl font-black text-slate-900 mb-2">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(plan.price || 0)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <ul className="space-y-3 mb-8">
                      {plan.features?.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-green-500 shrink-0" /> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className={`w-full hover:bg-primary hover:text-primary-foreground transition-colors`}
                    variant="outline"
                    asChild
                  >
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      Selecionar Plano
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-sm text-slate-500 text-center mt-8 italic">
            * A produção da arte é de responsabilidade da contratante. Valores referentes a anúncios
            de 1/1 página (página inteira).
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para destacar sua marca?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto text-lg">
            Fale conosco diretamente pelo WhatsApp para garantir o seu espaço na próxima edição da
            Revista Educação SST.
          </p>
          <Button
            size="lg"
            className="h-14 px-8 text-lg font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl"
            asChild
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="w-5 h-5 mr-2" /> Falar com Consultor
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}

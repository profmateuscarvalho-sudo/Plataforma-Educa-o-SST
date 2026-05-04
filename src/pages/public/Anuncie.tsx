import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Users, MessageSquare, TrendingUp, Target, Award } from 'lucide-react'

export default function Anuncie() {
  const whatsappNumber = '5518997190486'
  const whatsappMessage = encodeURIComponent(
    'Olá! Tenho interesse em anunciar na Revista Educação SST.',
  )
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-secondary overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.usecurling.com/p/1920/1080?q=factory&color=black"
            alt="Background"
            className="w-full h-full object-cover opacity-20 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/80 to-secondary" />
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm py-1.5 px-4 mb-8 font-medium">
            Mídia Kit Educação SST
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl tracking-tight">
            Alcance a Elite da SST: Sua Marca na{' '}
            <span className="text-accent">Revista Educação SST</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mb-12 font-light leading-relaxed">
            Conecte seus produtos e serviços diretamente aos principais profissionais, gestores e
            tomadores de decisão em Segurança e Saúde no Trabalho do Brasil.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 text-white"
              asChild
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="w-5 h-5 mr-2" /> Tenho interesse em anunciar
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-bold border-accent text-accent hover:bg-accent hover:text-secondary"
              onClick={() => {
                document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Ver Planos
            </Button>
          </div>

          {/* Social Proof */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 md:gap-16 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="bg-accent/20 p-4 rounded-full">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-4xl font-black text-white leading-none mb-1">+2.000</p>
                <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">
                  Leitores Ativos
                </p>
              </div>
            </div>
            <div className="hidden md:block w-px h-16 bg-white/20" />
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-4 rounded-full">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-4xl font-black text-white leading-none mb-1">Top #1</p>
                <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">
                  Conteúdo Especializado
                </p>
              </div>
            </div>
            <div className="hidden md:block w-px h-16 bg-white/20" />
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-4 rounded-full">
                <Target className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-4xl font-black text-white leading-none mb-1">Alto</p>
                <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">
                  Engajamento
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study / Example Section */}
      <section className="py-24 bg-white">
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
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-100 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-4 py-2 font-bold z-10 rounded-bl-xl shadow-md">
                  Exemplo de Anúncio
                </div>
                <div className="aspect-[4/3] bg-slate-900 relative">
                  <img
                    src="https://img.usecurling.com/p/800/600?q=magazine%20advertisement&color=black"
                    alt="Magazine Mockup"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="w-full h-full border-2 border-white/20 rounded flex">
                      <div className="w-1/2 border-r-2 border-white/20 bg-white/95 p-6 flex flex-col justify-between">
                        <div>
                          <div className="w-20 h-20 bg-yellow-400 rounded-lg mb-4 flex items-center justify-center font-bold text-2xl text-slate-900">
                            ESS
                          </div>
                          <h3 className="font-bold text-xl mb-2 text-slate-800">
                            Engenharia, Saúde & Segurança
                          </h3>
                          <p className="text-xs text-slate-600 font-medium">
                            Apreciação de riscos • Adequação de máquinas • Ergonomia
                          </p>
                        </div>
                        <div className="bg-slate-100 p-2 rounded text-center text-xs font-bold">
                          11 4227-2180
                        </div>
                      </div>
                      <div className="w-1/2 bg-green-700 p-6 flex flex-col items-center justify-center text-white text-center">
                        <h2 className="text-3xl font-black italic mb-4">
                          SAFETY
                          <br />
                          SUMMIT
                          <br />
                          2026
                        </h2>
                        <p className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
                          Clique e conheça os palestrantes
                        </p>
                      </div>
                    </div>
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
            {/* Plan 1 */}
            <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="mb-6 text-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Trimestral</h3>
                  <div className="text-primary font-bold bg-primary/10 inline-block px-3 py-1 rounded-full text-sm mb-4">
                    3 Inserções
                  </div>
                  <div className="text-4xl font-black text-secondary">
                    R$ 1.200<span className="text-lg text-slate-500 font-medium">,00</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">R$ 400 por inserção</p>
                </div>
                <div className="flex-1">
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" /> 1/1 Página nas próximas 3 edições
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" /> Links interativos
                    </li>
                  </ul>
                </div>
                <Button className="w-full" variant="outline" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    Selecionar Plano
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Plan 2 */}
            <Card className="border-primary shadow-2xl relative flex flex-col transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full font-bold text-sm whitespace-nowrap shadow-lg">
                Melhor Custo-Benefício
              </div>
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="mb-6 text-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Semestral</h3>
                  <div className="text-primary font-bold bg-primary/10 inline-block px-3 py-1 rounded-full text-sm mb-4">
                    6 Inserções
                  </div>
                  <div className="text-4xl font-black text-secondary">
                    R$ 2.000<span className="text-lg text-slate-500 font-medium">,00</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">R$ 333 por inserção</p>
                </div>
                <div className="flex-1">
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" /> 1/1 Página nas próximas 6 edições
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" /> Links interativos
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Check className="w-4 h-4 text-green-500" /> Posicionamento Premium
                    </li>
                  </ul>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-lg h-12" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    Selecionar Plano
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Plan 3 */}
            <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="mb-6 text-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Anual</h3>
                  <div className="text-primary font-bold bg-primary/10 inline-block px-3 py-1 rounded-full text-sm mb-4">
                    12 Inserções
                  </div>
                  <div className="text-4xl font-black text-secondary">
                    R$ 3.600<span className="text-lg text-slate-500 font-medium">,00</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">R$ 300 por inserção</p>
                </div>
                <div className="flex-1">
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" /> 1/1 Página por 12 meses
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" /> Links interativos
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" /> Posicionamento Premium
                    </li>
                  </ul>
                </div>
                <Button className="w-full" variant="outline" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    Selecionar Plano
                  </a>
                </Button>
              </CardContent>
            </Card>
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

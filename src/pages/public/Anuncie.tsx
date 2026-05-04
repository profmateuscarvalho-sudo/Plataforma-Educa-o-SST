import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Users, MessageSquare } from 'lucide-react'

export default function Anuncie() {
  const whatsappNumber = '5518997190486'
  const whatsappMessage = encodeURIComponent(
    'Olá! Tenho interesse em anunciar na Revista Educação SST.',
  )
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-primary text-primary-foreground py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center mb-8">
            <span className="text-3xl md:text-5xl font-black tracking-tighter uppercase border-4 border-primary-foreground p-3 rounded-lg">
              Educação SST
            </span>
          </div>
          <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm md:text-base py-1 px-4 mb-4">
            Mídia Kit
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Anuncie na Revista</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Conecte sua marca aos principais profissionais de Saúde e Segurança do Trabalho do
            Brasil.
          </p>

          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="bg-white/10 p-4 rounded-xl flex items-center gap-4 border border-white/20">
              <div className="bg-accent p-3 rounded-full text-accent-foreground">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-left">
                <p className="text-3xl font-black leading-none">2.000</p>
                <p className="text-sm font-medium text-primary-foreground/80 uppercase tracking-widest">
                  Leitores
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Nossas Colunas</h2>
            <div className="space-y-4">
              {[
                'Conexão Profissional',
                'Fatores Humanos',
                'Nova Visão na prática',
                'Gestão de Risco',
                'Liderança em SSMA',
                'Entre o dado e o cuidado',
                'Simulado',
              ].map((col, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="bg-primary/10 p-1.5 rounded-full text-primary">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-medium text-slate-700">{col}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center md:text-left">
            Planos (1/1 Página)
          </h2>
          <Card className="border-2 border-primary/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-4 py-1 rounded-bl-lg font-bold text-sm">
              Mais popular
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-xl font-medium text-slate-600">3 Inserções</span>
                  <span className="text-2xl font-bold text-slate-900">R$ 1.200,00</span>
                </div>
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-xl font-medium text-slate-600">6 Inserções</span>
                  <span className="text-2xl font-bold text-slate-900">R$ 2.000,00</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-medium text-slate-600">12 Inserções</span>
                  <span className="text-2xl font-bold text-primary">R$ 3.600,00</span>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  size="lg"
                  className="w-full text-lg h-14 bg-green-600 hover:bg-green-700"
                  asChild
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="w-5 h-5 mr-2" /> Tenho interesse em anunciar
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
          <p className="text-sm text-slate-500 text-center md:text-left italic">
            *A produção da arte é de responsabilidade da contratante.
          </p>
        </div>
      </section>
    </div>
  )
}

import { MENTORS } from '@/lib/data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { LeadForm } from '@/components/LeadForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CheckCircle2, Star, Target, TrendingUp } from 'lucide-react'
import { useState } from 'react'

export default function Mentorias() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const benefits = [
    {
      icon: Target,
      title: 'Foco no seu objetivo',
      desc: 'Sessões personalizadas para o seu momento de carreira.',
    },
    {
      icon: Star,
      title: 'Mentores de Elite',
      desc: 'Aprenda com quem já chegou onde você quer chegar.',
    },
    {
      icon: TrendingUp,
      title: 'Aceleração Profissional',
      desc: 'Atalhos e estratégias validadas pelo mercado.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/1920/800?q=meeting&color=black')] opacity-40 mix-blend-luminosity" />
        <div className="container px-4 relative z-10 text-center max-w-4xl mx-auto">
          <span className="text-accent font-bold tracking-widest uppercase text-sm mb-4 block">
            Acompanhamento Exclusivo
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight">
            Mentoria One-to-One
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed font-light mb-10">
            Acelere sua trajetória profissional com o direcionamento direto dos profissionais mais
            respeitados da área de SST no Brasil.
          </p>
          <Button
            size="lg"
            className="h-14 px-8 text-lg bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Agendar Avaliação de Perfil
          </Button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {benefits.map((b, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-primary">
                  <b.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">{b.title}</h3>
                <p className="text-slate-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentors Team */}
      <section className="py-24 bg-slate-50">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-primary mb-4">Corpo de Mentores</h2>
            <p className="text-slate-600 text-lg">
              Profissionais com vasta experiência acadêmica e prática.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MENTORS.map((mentor) => (
              <Card
                key={mentor.id}
                className="border-none shadow-lg overflow-hidden group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={mentor.image}
                    alt={mentor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                  />
                </div>
                <CardContent className="p-6 text-center">
                  <h3 className="font-serif font-bold text-2xl text-primary mb-1">{mentor.name}</h3>
                  <p className="text-sm font-semibold text-accent mb-4">{mentor.role}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{mentor.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Scheduling Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2 space-y-8">
              <h2 className="text-4xl font-serif font-bold text-primary">
                Como funciona o processo seletivo?
              </h2>
              <ul className="space-y-6">
                {[
                  'Agendamento de uma sessão de alinhamento gratuita (30 min).',
                  'Análise do seu currículo e momento profissional pelo comitê.',
                  'Match com o mentor ideal para seus objetivos.',
                  'Início da jornada de aceleração (3 a 6 meses).',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                    <span className="text-lg text-slate-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:w-1/2 w-full bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Selecione uma data para avaliação
                </h3>
                <p className="text-sm text-slate-500">
                  Nossa equipe entrará em contato para confirmar o horário.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-center mb-6">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                  disabled={(date) =>
                    date < new Date() || date.getDay() === 0 || date.getDay() === 6
                  }
                />
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-14 text-lg shadow-md" disabled={!date}>
                    Continuar Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl text-primary">
                      Confirmar Agendamento
                    </DialogTitle>
                    <DialogDescription>
                      Para a data selecionada: {date?.toLocaleDateString('pt-BR')}. Preencha seus
                      dados para que um consultor confirme o horário.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <LeadForm />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

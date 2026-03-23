import { MENTORS } from '@/lib/data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CheckCircle2, Target } from 'lucide-react'
import { useState } from 'react'
import { CheckoutModal } from '@/components/CheckoutModal'

export default function Mentorias() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-secondary text-white py-24 relative overflow-hidden">
        <div className="container px-4 relative z-10 text-center max-w-4xl mx-auto">
          <span className="text-accent font-bold tracking-widest uppercase text-sm mb-4 block">
            Acompanhamento Exclusivo
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">Mentoria em SST</h1>
          <p className="text-xl text-slate-300 font-light mb-10">
            Acelere sua trajetória com o direcionamento dos profissionais mais respeitados do
            Brasil.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2 space-y-8">
              <h2 className="text-4xl font-serif font-bold text-secondary">Como funciona?</h2>
              <ul className="space-y-6">
                {[
                  'Escolha a data e horário ideal para a primeira sessão.',
                  'Realize o pagamento seguro via plataforma.',
                  'Acesse o link da videochamada na sua Área do Aluno.',
                  'Receba direcionamento focado na sua carreira.',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <span className="text-lg text-slate-700">{step}</span>
                  </li>
                ))}
              </ul>
              <div className="p-6 bg-slate-50 rounded-xl border">
                <p className="text-sm text-slate-500 mb-1">Valor por Sessão (1h)</p>
                <p className="text-3xl font-bold text-primary">R$ 497,00</p>
              </div>
            </div>

            <div className="lg:w-1/2 w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <h3 className="text-xl font-bold text-secondary mb-6 text-center">Agendar Sessão</h3>
              <div className="flex justify-center mb-6">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow-sm"
                  disabled={(date) =>
                    date < new Date() || date.getDay() === 0 || date.getDay() === 6
                  }
                />
              </div>
              <Button
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                disabled={!date}
                onClick={() => setIsCheckoutOpen(true)}
              >
                Confirmar e Pagar Sessão
              </Button>
            </div>
          </div>
        </div>
      </section>
      <CheckoutModal
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        itemTitle="Sessão de Mentoria (1h)"
        price={497}
      />
    </div>
  )
}

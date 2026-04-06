import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { CheckCircle2, Clock, CalendarDays } from 'lucide-react'
import { CheckoutModal } from '@/components/CheckoutModal'
import { getMentorships } from '@/services/mentorships'
import { Mentorship } from '@/types'
import { cn } from '@/lib/utils'

export default function Mentorias() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [selectedMentorship, setSelectedMentorship] = useState<Mentorship | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string>('')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  useEffect(() => {
    getMentorships()
      .then((res) => {
        setMentorships(res)
        if (res.length > 0) setSelectedMentorship(res[0])
      })
      .catch(console.error)
  }, [])

  const availableTimes = ['09:00', '10:30', '14:00', '15:30', '17:00']

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <section className="bg-secondary text-white py-24 relative overflow-hidden">
        <div className="container px-4 relative z-10 text-center max-w-4xl mx-auto">
          <span className="text-accent font-bold tracking-widest uppercase text-sm mb-4 block">
            Acompanhamento Exclusivo
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">Agende sua Mentoria</h1>
          <p className="text-xl text-slate-300 font-light mb-10">
            Acelere sua trajetória com o direcionamento de grande profissionais da Área.&nbsp;
          </p>
        </div>
      </section>

      <section className="container px-4 mt-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="w-full lg:w-1/3 space-y-6">
            <h2 className="text-2xl font-serif font-bold text-secondary mb-4">
              Escolha seu Mentor
            </h2>
            {mentorships.map((m) => (
              <Card
                key={m.id}
                className={cn(
                  'cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg border-2',
                  selectedMentorship?.id === m.id
                    ? 'border-primary shadow-lg'
                    : 'border-transparent',
                )}
                onClick={() => {
                  setSelectedMentorship(m)
                  setTime('')
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-serif text-secondary">{m.title}</CardTitle>
                  <p className="text-sm font-medium text-primary mt-1">Com {m.mentor_name}</p>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-slate-600 line-clamp-2">{m.description}</p>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center text-sm font-bold text-slate-800 border-t border-slate-50 pt-4">
                  <span>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      m.price,
                    )}
                  </span>
                  <Button
                    variant={selectedMentorship?.id === m.id ? 'default' : 'outline'}
                    size="sm"
                  >
                    Selecionar
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {mentorships.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                Nenhuma mentoria disponível no momento.
              </div>
            )}
          </div>

          <div className="flex-1 w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 lg:sticky lg:top-28">
            {selectedMentorship ? (
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-serif font-bold text-secondary">
                    Agendar: {selectedMentorship.title}
                  </h3>
                  <p className="text-slate-600 mt-4 text-lg leading-relaxed">
                    {selectedMentorship.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-secondary flex items-center gap-2 mb-4">
                      <CalendarDays className="w-5 h-5 text-primary" /> Selecione a Data
                    </h4>
                    <div className="p-4 border rounded-xl bg-slate-50 flex justify-center">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                          setDate(d)
                          setTime('')
                        }}
                        className="rounded-md bg-white"
                        disabled={(d) =>
                          d < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          d.getDay() === 0 ||
                          d.getDay() === 6
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-secondary flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-primary" /> Horários Disponíveis
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {availableTimes.map((t) => (
                        <Button
                          key={t}
                          variant={time === t ? 'default' : 'outline'}
                          className={cn(
                            'w-full',
                            time === t && 'ring-2 ring-primary ring-offset-2',
                          )}
                          onClick={() => setTime(t)}
                          disabled={!date}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                    {selectedMentorship.available_dates && (
                      <div className="mt-6 p-4 bg-slate-50 text-sm text-slate-600 rounded-lg border border-slate-100">
                        <strong>Nota do Mentor:</strong>
                        <br />
                        {selectedMentorship.available_dates}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Valor do Investimento</p>
                      <p className="text-3xl font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(selectedMentorship.price)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600 font-medium">
                      {date && time ? (
                        <p className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Data Selecionada
                        </p>
                      ) : (
                        <p className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                          Selecione data e horário
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    className="w-full h-14 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    disabled={!date || !time}
                    onClick={() => setIsCheckoutOpen(true)}
                  >
                    Confirmar e Ir para Pagamento
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex items-center justify-center text-slate-400">
                Selecione uma mentoria na lista ao lado.
              </div>
            )}
          </div>
        </div>
      </section>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        itemTitle={selectedMentorship?.title || 'Mentoria'}
        price={selectedMentorship?.price || 0}
      />
    </div>
  )
}

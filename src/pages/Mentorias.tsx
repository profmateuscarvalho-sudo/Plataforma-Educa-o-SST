import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { CheckoutModal } from '@/components/CheckoutModal'
import { getMentorships } from '@/services/mentorships'
import { Mentorship } from '@/types'
import { Calendar, Video, GraduationCap, ArrowRight, Star } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml } from '@/lib/utils'
import { getMentors } from '@/services/mentors'
import { Mentor } from '@/types'

export default function Mentorias() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedMentorship, setSelectedMentorship] = useState<Mentorship | null>(null)

  useEffect(() => {
    getMentorships().then(setMentorships).catch(console.error)
    getMentors().then(setMentors).catch(console.error)
  }, [])

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <section className="bg-secondary text-white py-24 relative overflow-hidden">
        <div className="container px-4 relative z-10 text-center max-w-4xl mx-auto">
          <span className="text-accent font-bold tracking-widest uppercase text-sm mb-4 block">
            Acompanhamento Exclusivo
          </span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">Mentorias</h1>
          <p className="text-xl text-slate-300 font-light mb-10">
            Acelere sua trajetória profissional com o direcionamento de especialistas da área de
            Segurança e Saúde no Trabalho.
          </p>
        </div>
      </section>

      <section className="container px-4 mt-16 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <h2 className="text-3xl font-serif font-bold text-secondary mb-6">O que é Mentoria?</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Mentoria é um processo de desenvolvimento profissional onde um especialista experiente
            compartilha conhecimentos, experiências e orientações para ajudar você a crescer na
            carreira. Na área de SST, ter um mentor pode fazer a diferença entre estagnar e alcançar
            novos patamares profissionais.
          </p>
        </div>
      </section>

      <section className="container px-4 mt-12 max-w-5xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-secondary mb-8 text-center">
          Como Funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-secondary mb-2">1. Escolha o Mentor</h3>
            <p className="text-sm text-slate-500">
              Selecione o mentor que mais se alinha com seus objetivos profissionais.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-secondary mb-2">2. Confirme o Pagamento</h3>
            <p className="text-sm text-slate-500">
              Após a confirmação do pagamento, você receberá o link de agendamento.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Video className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-secondary mb-2">3. Participe da Sessão</h3>
            <p className="text-sm text-slate-500">
              Acesse a sessão online no horário agendado e tire suas dúvidas.
            </p>
          </div>
        </div>
      </section>

      <section className="container px-4 mt-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-secondary mb-8 text-center">
          Nossos Mentores
        </h2>
        {mentorships.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            Nenhuma mentoria disponível no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mentorships.map((m) => (
              <Card
                key={m.id}
                className="overflow-hidden flex flex-col hover:shadow-xl transition-shadow group"
              >
                {m.mentor_photo && (
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={pb.files.getUrl(m, m.mentor_photo)}
                      alt={m.mentor_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-secondary">{m.title}</CardTitle>
                  <p className="text-sm font-medium text-primary">Com {m.mentor_name}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <p className="text-sm text-slate-600 line-clamp-3">{m.description}</p>
                  {m.mentor_bio && (
                    <p className="text-xs text-slate-400 line-clamp-3">{stripHtml(m.mentor_bio)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {mentors.length > 0 && (
        <section className="container px-4 mt-16 max-w-6xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-secondary mb-2 text-center">
            Nossos Mentores
          </h2>
          <p className="text-slate-500 text-center mb-8">
            Conheca os profissionais que irao guiar sua jornada em SST
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mentors.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {m.photo && (
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={pb.files.getUrl(m, m.photo)}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-accent fill-current" />
                    <h3 className="text-xl font-serif font-bold text-secondary">{m.name}</h3>
                  </div>
                  <p className="text-sm text-primary font-medium mb-3">{m.topics}</p>
                  <div
                    className="text-sm text-slate-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: m.mini_cv }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        itemTitle={selectedMentorship?.title || 'Mentoria'}
        price={selectedMentorship?.price || 0}
      />
    </div>
  )
}

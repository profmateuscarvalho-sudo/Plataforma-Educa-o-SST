import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckoutModal } from '@/components/CheckoutModal'
import { PageHeader } from '@/components/PageHeader'
import { WaitlistModal } from '@/components/WaitlistModal'
import { getMentorships } from '@/services/mentorships'
import { getMentors } from '@/services/mentors'
import { Mentorship, Mentor } from '@/types'
import { Star, AlertCircle, Users, ArrowRight } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { stripHtml } from '@/lib/utils'

const safeFileUrl = (record: any, filename?: string): string => {
  if (!filename || !record) return ''
  try {
    return pb.files.getUrl(record, filename)
  } catch {
    return ''
  }
}

export default function Mentorias() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedMentorship, setSelectedMentorship] = useState<Mentorship | null>(null)
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [msRes, mtsRes] = await Promise.allSettled([getMentorships(), getMentors()])
        if (msRes.status === 'fulfilled') setMentorships(msRes.value)
        if (mtsRes.status === 'fulfilled') setMentors(mtsRes.value)
        if (msRes.status === 'rejected' && mtsRes.status === 'rejected')
          setError('Não foi possível carregar as mentorias. Tente novamente mais tarde.')
      } catch {
        setError('Não foi possível carregar as mentorias. Tente novamente mais tarde.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading)
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1C1B18]/20 border-t-[#FDBE2D] rounded-full animate-spin" />
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white rounded-[28px] p-8 border border-[#E4DED1] shadow-sm">
          <AlertCircle className="w-12 h-12 text-[#B4472E] mx-auto mb-4" />
          <p className="text-[#5F5A4F] mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="rounded-full bg-[#1C1B18] text-[#FAF8F3] hover:bg-[#1C1B18]/90 font-bold px-6"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    )

  const hasMentorsOrMentorships = mentorships.length > 0 || mentors.length > 0

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C1B18] pb-24">
      <PageHeader
        badge="Acompanhamento Exclusivo"
        title="Mentorias"
        description="Acelere sua trajetória profissional com o direcionamento de especialistas da área de Segurança e Saúde no Trabalho."
      />

      <div className="max-w-[1200px] mx-auto px-6">
        {/* Bloco 1: O que é Mentoria? (Cartão 28px) */}
        <section className="mt-12 sm:mt-16">
          <div className="bg-white rounded-[28px] border border-[#E4DED1] p-8 sm:p-12 shadow-[0_8px_24px_rgba(28,27,24,0.04)]">
            <span className="label-overline">DESENVOLVIMENTO PROFISSIONAL</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-[#1C1B18] mt-2 mb-6">
              O que é Mentoria?
            </h2>
            <p className="text-base sm:text-lg text-[#5F5A4F] leading-relaxed max-w-3xl font-normal">
              Mentoria é um processo de desenvolvimento profissional onde um especialista experiente
              compartilha conhecimentos, experiências e orientações para ajudar você a crescer na
              carreira. Na área de SST, ter um mentor pode fazer a diferença entre estagnar e
              alcançar novos patamares profissionais.
            </p>
          </div>
        </section>

        {/* Bloco 2: Como Funciona (Três cartões numerados 01, 02, 03 em Playfair itálico) */}
        <section className="mt-12 sm:mt-16">
          <div className="text-center mb-10 sm:mb-12">
            <span className="label-overline">PASSO A PASSO</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-[#1C1B18] mt-2">
              Como Funciona
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                num: '01',
                title: 'Escolha o Mentor',
                desc: 'Selecione o especialista que mais se alinha com seus desafios e objetivos profissionais.',
              },
              {
                num: '02',
                title: 'Confirme o Agendamento',
                desc: 'Após a confirmação, você recebe o acesso ao calendário exclusivo com os horários disponíveis.',
              },
              {
                num: '03',
                title: 'Participe da Sessão',
                desc: 'Encontro individual e prático para sanar dúvidas, revisar processos e traçar planos de ação.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-[28px] p-8 border border-[#E4DED1] shadow-[0_8px_24px_rgba(28,27,24,0.04)] flex flex-col justify-between"
              >
                <div>
                  <div className="font-serif italic text-4xl sm:text-5xl font-semibold text-[#173F33] mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1C1B18] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#5F5A4F] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bloco 3: Nossos Mentores / Estado Vazio com Lista de Espera */}
        <section className="mt-16 sm:mt-20">
          <div className="text-center mb-10 sm:mb-12">
            <span className="label-overline">CORPO DOCENTE & ESPECIALISTAS</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-[#1C1B18] mt-2">
              Nossos Mentores
            </h2>
          </div>

          {!hasMentorsOrMentorships ? (
            /* Sem mentores cadastrados: Bloco com texto verbatim do usuário e botão pílula */
            <div className="max-w-2xl mx-auto bg-white rounded-[28px] p-8 sm:p-14 text-center border border-[#E4DED1] shadow-[0_16px_36px_rgba(28,27,24,0.06)] animate-fade-in-up">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F3] border border-[#E4DED1] flex items-center justify-center text-[#173F33] mb-6">
                <Users className="w-8 h-8" />
              </div>

              <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1B18] mb-4">
                Os mentores serão anunciados em breve.
              </h3>

              <p className="text-base sm:text-lg text-[#5F5A4F] leading-relaxed mb-8 max-w-lg mx-auto font-normal">
                Estamos selecionando os profissionais mais referenciados do mercado de Segurança e
                Saúde no Trabalho para compor o time de mentoria.
              </p>

              <Button
                size="lg"
                className="h-12 px-8 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none text-base"
                onClick={() => setWaitlistOpen(true)}
              >
                Avise-me quando abrir
              </Button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Mentorias com vagas abertas */}
              {mentorships.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {mentorships.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white rounded-[28px] overflow-hidden border border-[#E4DED1] shadow-[0_8px_24px_rgba(28,27,24,0.04)] flex flex-col hover:shadow-lg transition-all duration-300 group"
                    >
                      {m.mentor_photo ? (
                        <div className="aspect-[4/3] overflow-hidden bg-[#FAF8F3]">
                          <img
                            src={safeFileUrl(m, m.mentor_photo)}
                            alt={m.mentor_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-[#173F33] flex items-center justify-center text-[#FAF8F3]">
                          <Users className="w-12 h-12 text-[#FDBE2D]" />
                        </div>
                      )}

                      <div className="p-6 sm:p-7 flex flex-col flex-grow justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="text-xs uppercase tracking-wider text-[#7F7869] font-bold block">
                            Com {m.mentor_name}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-serif font-semibold text-[#1C1B18] leading-tight group-hover:text-[#173F33] transition-colors">
                            {m.title}
                          </h3>
                          <p className="text-sm text-[#5F5A4F] line-clamp-3 leading-relaxed">
                            {m.description}
                          </p>
                          {m.mentor_bio && (
                            <p className="text-xs text-[#7F7869] line-clamp-2 pt-1">
                              {stripHtml(m.mentor_bio)}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-[#E4DED1] flex items-center justify-between">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-[#7F7869] block font-bold">
                              Investimento
                            </span>
                            <span className="font-bold text-lg sm:text-xl text-[#1C1B18]">
                              {m.price === 0
                                ? 'Gratuito'
                                : new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(m.price || 0)}
                            </span>
                          </div>

                          <Button
                            size="default"
                            className="rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none h-11 px-5"
                            onClick={() => {
                              setSelectedMentorship(m)
                              setIsCheckoutOpen(true)
                            }}
                          >
                            <span>Agendar</span>
                            <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mentores listados */}
              {mentors.length > 0 && (
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif font-semibold text-[#1C1B18] mb-6">
                    Mentores Cadastrados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mentors.map((m) => (
                      <div
                        key={m.id}
                        className="bg-white rounded-[28px] overflow-hidden border border-[#E4DED1] shadow-[0_8px_24px_rgba(28,27,24,0.04)] hover:shadow-lg transition-all"
                      >
                        {m.photo ? (
                          <div className="aspect-[4/3] overflow-hidden bg-[#FAF8F3]">
                            <img
                              src={safeFileUrl(m, m.photo)}
                              alt={m.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] bg-[#FAF8F3] flex items-center justify-center text-[#7F7869]">
                            <Users className="w-12 h-12" />
                          </div>
                        )}
                        <div className="p-6 sm:p-7">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-[#FDBE2D] fill-[#FDBE2D]" />
                            <h4 className="text-xl font-serif font-semibold text-[#1C1B18]">
                              {m.name}
                            </h4>
                          </div>
                          {m.topics && (
                            <p className="text-xs uppercase tracking-wider text-[#173F33] font-bold mb-3">
                              {m.topics}
                            </p>
                          )}
                          <div
                            className="text-sm text-[#5F5A4F] leading-relaxed line-clamp-4"
                            dangerouslySetInnerHTML={{ __html: m.mini_cv }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        plano="mentorias"
        title="Mentorias Educação SST"
        description="Cadastre-se para receber o comunicado exclusivo com os mentores selecionados, datas de abertura e vagas limitadas."
        successMessage="Interesse em mentorias registrado! Você receberá o convite com prioridade assim que a banca de mentores for liberada."
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        itemTitle={selectedMentorship?.title || 'Mentoria'}
        price={selectedMentorship?.price || 0}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, ChevronRight, Share2, LayoutDashboard, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSimulados } from '@/services/simulados'
import { PageHeader } from '@/components/PageHeader'
import pb from '@/lib/pocketbase/client'
import type { Simulado } from '@/types'
import { useAuth } from '@/hooks/use-auth'

export default function PublicSimulados() {
  const { user } = useAuth()
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSimulados(true)
      .then(setSimulados)
      .finally(() => setLoading(false))
  }, [])

  const firstSimulado = simulados.length > 0 ? simulados[0] : null
  const remainingSimulados = simulados.length > 1 ? simulados.slice(1) : []

  const getSimuladoImageUrl = (sim: Simulado) => {
    if (sim.banner) {
      try {
        return pb.files.getUrl(sim, sim.banner)
      } catch {
        return 'https://img.usecurling.com/p/800/500?q=safety+exam'
      }
    }
    return 'https://img.usecurling.com/p/800/500?q=safety+exam'
  }

  const handleShare = (sim: Simulado) => {
    const shareUrl = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/share/simulados/${sim.id}`
    window.open(`https://wa.me/?text=${encodeURIComponent(sim.title + ' ' + shareUrl)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1C1B18] pb-24">
      <PageHeader
        badge="Teste seus conhecimentos"
        title="Simulados SST"
        description="Acesse simulados interativos criados por especialistas. Pratique para concursos, certificações e aprimore sua base teórica."
      >
        {user && (
          <Link
            to="/plataforma"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-[#1C1B18] text-[#FAF8F3] text-sm font-bold hover:bg-[#1C1B18]/90 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Voltar ao Hub
          </Link>
        )}
      </PageHeader>

      <div className="max-w-[1200px] mx-auto px-6 py-12 sm:py-16">
        {loading ? (
          <div className="space-y-8">
            <div className="h-72 bg-white rounded-[28px] border border-[#E4DED1] animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-80 bg-white rounded-[28px] border border-[#E4DED1] animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : simulados.length === 0 ? (
          <div className="max-w-2xl mx-auto my-12 bg-white rounded-[28px] p-8 sm:p-14 text-center border border-[#E4DED1] shadow-[0_16px_36px_rgba(28,27,24,0.06)]">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F3] border border-[#E4DED1] flex items-center justify-center text-[#173F33] mb-6">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-3xl font-semibold text-[#1C1B18] mb-2">
              Nenhum simulado disponível
            </h3>
            <p className="text-base sm:text-lg text-[#5F5A4F] leading-relaxed max-w-md mx-auto">
              Volte em breve para novos desafios e baterias de questões comentadas.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Primeiro simulado em DESTAQUE (largura inteira, imagem à esquerda, texto à direita) */}
            {firstSimulado && (
              <div className="bg-white rounded-[28px] border border-[#E4DED1] overflow-hidden shadow-[0_16px_36px_rgba(28,27,24,0.06)] grid grid-cols-1 lg:grid-cols-12 items-stretch group hover:shadow-xl transition-all duration-300">
                <div className="lg:col-span-5 relative aspect-video lg:aspect-auto min-h-[260px] sm:min-h-[320px] bg-[#FAF8F3] overflow-hidden">
                  <img
                    src={getSimuladoImageUrl(firstSimulado)}
                    alt={firstSimulado.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#173F33] text-[#FAF8F3] shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-[#FDBE2D]" />
                      Simulado em Destaque
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <span className="label-overline">PRÁTICA INTERATIVA</span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-semibold text-[#1C1B18] leading-tight group-hover:text-[#173F33] transition-colors">
                      {firstSimulado.title}
                    </h2>
                    <p className="text-base sm:text-lg text-[#5F5A4F] line-clamp-3 leading-relaxed font-normal">
                      {firstSimulado.description ||
                        'Pratique com questões elaboradas segundo as NRs vigentes e consolide seu aprendizado com gabarito comentado.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E4DED1] flex flex-wrap items-center gap-3">
                    <Button
                      size="lg"
                      className="h-12 px-8 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none text-base"
                      asChild
                    >
                      <Link
                        to={`/simulados/${firstSimulado.id}`}
                        className="inline-flex items-center"
                      >
                        <span>Iniciar simulado</span>
                        <ChevronRight className="w-4 h-4 ml-1.5" />
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full border-[#E4DED1] text-[#1C1B18] hover:bg-[#FAF8F3] shrink-0"
                      title="Compartilhar no WhatsApp"
                      onClick={() => handleShare(firstSimulado)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Demais simulados em grade de cartões 28px com descrição limitada a 3 linhas */}
            {remainingSimulados.length > 0 && (
              <div className="space-y-6 pt-4">
                <div className="border-b border-[#E4DED1] pb-3">
                  <span className="label-overline">OUTRAS BATERIAS DE QUESTÕES</span>
                  <h3 className="text-2xl font-serif font-semibold text-[#1C1B18] mt-1">
                    Mais Simulados
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {remainingSimulados.map((simulado) => (
                    <div
                      key={simulado.id}
                      className="bg-white rounded-[28px] border border-[#E4DED1] overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-300 group"
                    >
                      {/* Imagem */}
                      <div className="aspect-video relative overflow-hidden bg-[#FAF8F3] shrink-0">
                        <img
                          src={getSimuladoImageUrl(simulado)}
                          alt={simulado.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-[#1C1B18] shadow-sm border border-[#E4DED1]">
                            Simulado Interativo
                          </span>
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="p-6 sm:p-7 flex flex-col flex-grow justify-between space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-serif text-xl sm:text-2xl font-semibold text-[#1C1B18] leading-tight line-clamp-2 group-hover:text-[#173F33] transition-colors">
                            {simulado.title}
                          </h4>
                          <p className="text-sm text-[#5F5A4F] line-clamp-3 leading-relaxed font-normal">
                            {simulado.description ||
                              'Bateria de questões focadas nas principais normas regulamentadoras.'}
                          </p>
                        </div>

                        {/* Rodapé com botão primário Iniciar simulado */}
                        <div className="pt-4 border-t border-[#E4DED1] flex items-center gap-2">
                          <Button
                            className="flex-1 h-11 rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none"
                            asChild
                          >
                            <Link to={`/simulados/${simulado.id}`}>
                              Iniciar simulado
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-full border-[#E4DED1] text-[#1C1B18] hover:bg-[#FAF8F3] shrink-0"
                            title="Compartilhar no WhatsApp"
                            onClick={() => handleShare(simulado)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

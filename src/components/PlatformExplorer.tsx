import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { formatMagazineTitle } from '@/lib/magazine-utils'

interface PlatformExplorerProps {
  magazineCount: number
  latestMagazine: { number: string; title: string } | null
  courseCount: number
  latestCourseTitle: string | null
  nextLiveTitle: string | null
  simuladoCount: number
  latestSimuladoTitle: string | null
}

export function PlatformExplorer({
  magazineCount,
  latestMagazine,
  courseCount,
  latestCourseTitle,
  nextLiveTitle,
  simuladoCount,
  latestSimuladoTitle,
}: PlatformExplorerProps) {
  const [activeTab, setActiveTab] = useState<number>(1)

  const items = [
    {
      id: 1,
      num: '01',
      navLabel: 'Revistas',
      title: 'Revista Educação SST',
      paragraph: `São ${magazineCount} edições no acervo, com leitura gratuita, escritas por quem vive a SST na prática. No plano Ouro, a edição do mês também chega impressa pelo Box+.`,
      footer: (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs sm:text-sm text-[#1C1B18]">
            <span className="font-bold uppercase tracking-wider text-[11px] text-[#7F7869] mr-2">
              EDIÇÃO DO MÊS
            </span>
            <span>{formatMagazineTitle(latestMagazine?.title) || 'Edição nº 32'}</span>
          </div>
          <Link
            to="/revistas"
            className="editorial-link text-xs sm:text-sm font-semibold text-[#1C1B18] shrink-0"
          >
            Ver o acervo &rarr;
          </Link>
        </div>
      ),
    },
    {
      id: 2,
      num: '02',
      navLabel: 'Cursos',
      title: 'Cursos',
      paragraph:
        'Cursos selecionados já no plano Free e o catálogo completo no Prata, com foco na prática e na sua realidade de trabalho.',
      footer: (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {latestCourseTitle && (
            <div className="text-xs sm:text-sm text-[#1C1B18]">
              <span className="font-bold uppercase tracking-wider text-[11px] text-[#7F7869] mr-2">
                EM DESTAQUE
              </span>
              <span>{latestCourseTitle}</span>
            </div>
          )}
          <Link
            to="/cursos"
            className="editorial-link text-xs sm:text-sm font-semibold text-[#1C1B18] shrink-0"
          >
            Ver os cursos &rarr;
          </Link>
        </div>
      ),
    },
    {
      id: 3,
      num: '03',
      navLabel: 'Mentorias',
      title: 'Mentorias',
      paragraph:
        'Sessões online com especialistas de Segurança e Saúde no Trabalho. Você escolhe o mentor, confirma o pagamento e agenda o horário. Assinantes do Prata têm desconto.',
      footer: (
        <div className="flex items-center justify-end">
          <Link
            to="/mentorias"
            className="editorial-link text-xs sm:text-sm font-semibold text-[#1C1B18]"
          >
            Conhecer as mentorias &rarr;
          </Link>
        </div>
      ),
    },
    {
      id: 4,
      num: '04',
      navLabel: 'Aulas ao vivo',
      title: 'Aulas ao vivo',
      paragraph:
        'Toda quarta-feira tem aula ao vivo, aberta desde o plano Free. No Prata, as gravações ficam guardadas para você rever.',
      footer: nextLiveTitle ? (
        <div className="flex items-center text-xs sm:text-sm text-[#1C1B18]">
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#7F7869] mr-2">
            PRÓXIMA QUARTA
          </span>
          <span>{nextLiveTitle}</span>
        </div>
      ) : null,
    },
    {
      id: 5,
      num: '05',
      navLabel: 'Simulados',
      title: 'Simulados',
      paragraph: `${simuladoCount} simulados interativos sobre as NRs e Fatores Humanos.`,
      footer: (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {latestSimuladoTitle && (
            <div className="text-xs sm:text-sm text-[#1C1B18]">
              <span className="font-bold uppercase tracking-wider text-[11px] text-[#7F7869] mr-2">
                COMECE POR
              </span>
              <span>{latestSimuladoTitle}</span>
            </div>
          )}
          <Link
            to="/simulados"
            className="editorial-link text-xs sm:text-sm font-semibold text-[#1C1B18] shrink-0"
          >
            Fazer um simulado &rarr;
          </Link>
        </div>
      ),
    },
    {
      id: 6,
      num: '06',
      navLabel: 'Agente de IA',
      title: 'Agente de IA Educação SST',
      paragraph:
        'Um agente treinado em Segurança e Saúde no Trabalho para tirar dúvidas de norma e pensar casos com você, a qualquer hora.',
      footer: (
        <div className="flex items-center text-xs sm:text-sm text-[#1C1B18]">
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#7F7869] mr-2">
            EXPERIMENTE PERGUNTAR
          </span>
          <span className="italic text-[#5F5A4F]">“Quando a NR-35 exige análise de risco?”</span>
        </div>
      ),
    },
  ]

  const currentItem = items.find((it) => it.id === activeTab) || items[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* Coluna esquerda: Lista vertical de 6 botões */}
      <div className="lg:col-span-4 flex flex-col gap-2.5">
        {items.map((it) => {
          const isSelected = it.id === activeTab
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setActiveTab(it.id)}
              className={cn(
                'w-full px-5 py-4 rounded-2xl text-left transition-all flex items-center justify-between group border',
                isSelected
                  ? 'bg-white border-[#E4DED1] shadow-[0_4px_18px_rgba(28,27,24,0.06)] font-semibold text-[#1C1B18]'
                  : 'bg-transparent border-transparent text-[#7F7869] hover:text-[#1C1B18] hover:bg-white/50',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'font-mono text-xs tracking-wider transition-colors',
                    isSelected ? 'text-[#1C1B18] font-bold' : 'text-[#7F7869]',
                  )}
                >
                  {it.num}
                </span>
                <span className="text-base">{it.navLabel}</span>
              </div>
              {isSelected ? (
                <span className="w-2.5 h-2.5 rounded-full bg-[#FDBE2D] shrink-0 shadow-sm" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-[#E4DED1] shrink-0 transition-colors" />
              )}
            </button>
          )
        })}
      </div>

      {/* Coluna direita: Painel com a forma da logo (border-radius 8px 8px 8px 72px) */}
      <div className="lg:col-span-8 flex">
        <div
          key={currentItem.id}
          className="w-full bg-white brand-corner p-7 sm:p-10 shadow-[0_12px_36px_rgba(28,27,24,0.06)] border border-[#E4DED1] flex flex-col justify-between animate-panel-fade"
        >
          <div>
            <div className="font-serif italic text-2xl sm:text-3xl text-[#7F7869] mb-4">
              {currentItem.num} / 06
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1C1B18] mb-4">
              {currentItem.title}
            </h3>
            <p className="text-base sm:text-lg text-[#5F5A4F] leading-relaxed max-w-2xl">
              {currentItem.paragraph}
            </p>
          </div>

          {currentItem.footer && (
            <div className="mt-8 pt-5 border-t border-[#E4DED1]">{currentItem.footer}</div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicDailyDose } from '@/services/publicDose'
import { cn } from '@/lib/utils'

interface DailyDoseCardProps {
  dose: PublicDailyDose | null
  loading?: boolean
}

export function DailyDoseCard({ dose, loading }: DailyDoseCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  if (loading || !dose) {
    return (
      <div className="w-full max-w-[420px] bg-white rounded-[24px] p-6 shadow-xl border border-[#E4DED1]/60 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="h-5 bg-slate-100 rounded w-5/6 mb-4" />
        <div className="space-y-2 mb-4">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-16 bg-slate-50 rounded-xl" />
      </div>
    )
  }

  const { question, themeTag, options, explanation } = dose
  const hasAnswered = selectedOption !== null

  // Normalize strings for reliable matching (e.g., "b) Texto" vs "b) Texto")
  const norm = (s?: string) =>
    (s || '')
      .replace(/^[a-eA-E][)\].-]\s*/, '')
      .trim()
      .toLowerCase()

  const correctNormalized = norm(question.correct_option)
  const isSelectedCorrect = hasAnswered && norm(selectedOption) === correctNormalized

  const handleSelect = (opt: string) => {
    if (hasAnswered) return
    setSelectedOption(opt)
  }

  return (
    <div className="w-full max-w-[420px] bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_16px_40px_-12px_rgba(28,27,24,0.12)] border border-[#E4DED1] text-left transition-all">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E4DED1]/60">
        <span className="font-sans text-[11px] font-bold tracking-[0.14em] text-[#1C1B18] uppercase">
          DOSE DO DIA
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FAF8F3] text-[#173F33] border border-[#E4DED1]">
          {themeTag}
        </span>
      </div>

      {/* Enunciado */}
      <p className="mt-3 text-sm sm:text-[15px] font-medium text-[#1C1B18] leading-snug line-clamp-3">
        {question.question}
      </p>

      {/* 4 Alternativas */}
      <div className="mt-4 space-y-2">
        {options.map((opt, idx) => {
          const optNorm = norm(opt)
          const isThisCorrect = optNorm === correctNormalized
          const isThisSelected = selectedOption === opt

          let btnStyle =
            'bg-white border-[#E4DED1] text-[#1C1B18] hover:border-[#1C1B18] hover:bg-[#FAF8F3]'

          if (hasAnswered) {
            if (isThisCorrect) {
              btnStyle = 'bg-[#E3F1E9] border-[#1F6B4A] text-[#1F6B4A] font-bold shadow-sm'
            } else if (isThisSelected) {
              btnStyle = 'bg-[#FAE7E1] border-[#B4472E] text-[#B4472E] font-bold'
            } else {
              btnStyle = 'bg-white border-[#E4DED1] text-[#1C1B18] opacity-55 cursor-default'
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={hasAnswered}
              onClick={() => handleSelect(opt)}
              className={cn(
                'w-full min-h-[48px] px-3.5 py-2 rounded-xl border text-xs sm:text-[13px] text-left leading-snug transition-all flex items-center justify-between gap-2',
                btnStyle,
              )}
            >
              <span className="flex-1 break-words line-clamp-2">{opt}</span>
            </button>
          )
        })}
      </div>

      {/* Área de altura fixa (mínimo 104px) */}
      <div className="mt-4 pt-3 border-t border-[#E4DED1]/70 min-h-[104px] flex flex-col justify-center text-xs sm:text-[13px] leading-relaxed">
        {!hasAnswered ? (
          <p className="text-[#5F5A4F]">
            Escolha uma resposta. A explicação aparece na hora, como nos simulados da plataforma.
          </p>
        ) : (
          <div className="space-y-1.5 animate-panel-fade">
            <p className="text-[#1C1B18]">
              {isSelectedCorrect ? (
                <strong className="text-[#1F6B4A] font-bold">Isso mesmo. </strong>
              ) : (
                <strong className="text-[#B4472E] font-bold">Quase. </strong>
              )}
              <span className="text-[#5F5A4F]">{explanation}</span>
            </p>
            <div>
              <Link
                to="/planos"
                className="inline-flex items-center gap-1 font-semibold text-[#1C1B18] hover:text-[#173F33] hover:underline pt-1"
              >
                Receber a dose de amanhã &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

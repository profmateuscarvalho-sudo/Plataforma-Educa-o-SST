import { AgoraPosicao } from '@/types'
import { CheckCircle2, XCircle, PlusCircle } from 'lucide-react'

interface ScoreBoardProps {
  votosCount: {
    a_favor: number
    contra: number
    complementacao: number
    total: number
  }
}

export function ScoreBoard({ votosCount }: ScoreBoardProps) {
  const { a_favor, contra, complementacao, total } = votosCount

  const pctAFavor = total > 0 ? Math.round((a_favor / total) * 100) : 0
  const pctContra = total > 0 ? Math.round((contra / total) * 100) : 0
  const pctComplem = total > 0 ? Math.round((complementacao / total) * 100) : 0

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#2C5F7C] flex items-center gap-2">
          <span>🏛️ Placar em Tempo Real</span>
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          Total de {total} {total === 1 ? 'voto' : 'votos'}
        </span>
      </div>

      {/* Barra de distribuição gráfica */}
      {total > 0 && (
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex mb-5 shadow-inner">
          {pctAFavor > 0 && (
            <div
              style={{ width: `${pctAFavor}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`A Favor: ${pctAFavor}%`}
            />
          )}
          {pctContra > 0 && (
            <div
              style={{ width: `${pctContra}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`Contra: ${pctContra}%`}
            />
          )}
          {pctComplem > 0 && (
            <div
              style={{ width: `${pctComplem}%` }}
              className="bg-sky-500 transition-all duration-500"
              title={`Complementação: ${pctComplem}%`}
            />
          )}
        </div>
      )}

      {/* 3 cards de posição */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        {/* A Favor */}
        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3 md:p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-800 text-xs md:text-sm font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">A Favor</span>
            <span className="sm:hidden">Favor</span>
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-emerald-900 font-serif">
            {a_favor}
          </div>
          <div className="text-[11px] md:text-xs text-emerald-700 font-medium mt-0.5">
            {pctAFavor}%
          </div>
        </div>

        {/* Contra */}
        <div className="bg-rose-50/70 border border-rose-200/60 rounded-xl p-3 md:p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-rose-800 text-xs md:text-sm font-bold mb-1">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Contra</span>
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-rose-900 font-serif">
            {contra}
          </div>
          <div className="text-[11px] md:text-xs text-rose-700 font-medium mt-0.5">
            {pctContra}%
          </div>
        </div>

        {/* Complementação */}
        <div className="bg-sky-50/70 border border-sky-200/60 rounded-xl p-3 md:p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-sky-800 text-xs md:text-sm font-bold mb-1">
            <PlusCircle className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="hidden sm:inline">Complementação</span>
            <span className="sm:hidden">Complem.</span>
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-sky-900 font-serif">
            {complementacao}
          </div>
          <div className="text-[11px] md:text-xs text-sky-700 font-medium mt-0.5">
            {pctComplem}%
          </div>
        </div>
      </div>
    </div>
  )
}

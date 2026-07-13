import {
  BookOpen,
  Newspaper,
  Users,
  Film,
  Radio,
  ClipboardList,
  BellRing,
  Megaphone,
  Calendar,
} from 'lucide-react'

export function StudentHomePreview() {
  const cards = [
    { title: 'Cursos', icon: BookOpen, count: '12', gradient: 'from-emerald-600 to-teal-800' },
    { title: 'Revistas', icon: Newspaper, count: '8', gradient: 'from-blue-600 to-cyan-800' },
    { title: 'Mentorias', icon: Users, count: '5', gradient: 'from-rose-600 to-pink-800' },
    { title: 'Documentários', icon: Film, count: '6', gradient: 'from-purple-600 to-indigo-800' },
    { title: 'Aulas ao Vivo', icon: Radio, count: '3', gradient: 'from-red-600 to-rose-800' },
    { title: 'Simulados', icon: ClipboardList, count: '10', gradient: 'from-cyan-600 to-blue-800' },
  ]

  return (
    <div className="relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
        Preview da Home do Assinante
      </div>
      <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-50 mt-3">
        <div className="bg-slate-800 px-3 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              educacaosst.com.br/plataforma
            </span>
          </div>
        </div>

        <div className="bg-slate-900 h-8 px-3 flex items-center justify-between border-b border-white/10">
          <span className="text-white text-[10px] font-serif font-bold">Educação SST</span>
          <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-[8px]">
            J
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border-2 border-yellow-400 bg-slate-800 flex items-center justify-center text-yellow-400 font-bold text-xs shrink-0">
              J
            </div>
            <div>
              <h3 className="text-yellow-400 font-serif font-bold text-xs">Bom dia, João Silva</h3>
              <p className="text-slate-300 text-[9px]">Bem-vindo à sua área de estudos.</p>
            </div>
          </div>
        </div>

        <div className="p-3 grid grid-cols-3 gap-2">
          {cards.map((card) => (
            <div
              key={card.title}
              className={`rounded-lg p-2 bg-gradient-to-br ${card.gradient} text-white`}
            >
              <card.icon className="w-3.5 h-3.5 mb-1" />
              <p className="text-[9px] font-bold leading-tight">{card.title}</p>
              <p className="text-[8px] text-white/70 mt-0.5">{card.count} itens</p>
            </div>
          ))}
        </div>

        <div className="px-3 pb-3">
          <div className="bg-white rounded-lg p-2.5 border border-slate-200">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BellRing className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-slate-800">Quadro de Avisos</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-start gap-1.5 p-1.5 rounded bg-amber-50">
                <Megaphone className="w-2.5 h-2.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[8px] text-amber-900 font-medium">Novo Curso Adicionado</p>
              </div>
              <div className="flex items-start gap-1.5 p-1.5 rounded bg-emerald-50">
                <Calendar className="w-2.5 h-2.5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[8px] text-emerald-900 font-medium">Mentoria Disponível</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

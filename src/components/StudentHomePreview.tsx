import { useRef, useCallback } from 'react'
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
  Crown,
  BookMarked,
  MessagesSquare,
  User,
} from 'lucide-react'

const cards = [
  { title: 'Cursos', icon: BookOpen, count: '12', gradient: 'from-emerald-600 to-teal-800' },
  { title: 'Revistas', icon: Newspaper, count: '8', gradient: 'from-blue-600 to-cyan-800' },
  { title: 'Mentorias', icon: Users, count: '5', gradient: 'from-rose-600 to-pink-800' },
  { title: 'Documentários', icon: Film, count: '6', gradient: 'from-purple-600 to-indigo-800' },
  { title: 'Aulas ao Vivo', icon: Radio, count: '3', gradient: 'from-red-600 to-rose-800' },
  { title: 'Simulados', icon: ClipboardList, count: '10', gradient: 'from-cyan-600 to-blue-800' },
  { title: 'Caderno', icon: BookMarked, count: '', gradient: 'from-amber-600 to-orange-800' },
  { title: 'Cases', icon: MessagesSquare, count: '', gradient: 'from-teal-600 to-emerald-800' },
  { title: 'Perfil', icon: User, count: '', gradient: 'from-slate-700 to-slate-900' },
]

export function StudentHomePreview() {
  const ref = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${-(py - 0.5) * 26}deg`)
    el.style.setProperty('--ry', `${(px - 0.5) * 26}deg`)
    if (glowRef.current) {
      glowRef.current.style.setProperty('--gx', `${px * 100}%`)
      glowRef.current.style.setProperty('--gy', `${py * 100}%`)
      glowRef.current.style.opacity = '1'
    }
  }, [])

  const onLeave = useCallback(() => {
    const el = ref.current
    if (el) {
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    }
    if (glowRef.current) glowRef.current.style.opacity = '0'
  }, [])

  return (
    <div style={{ perspective: '1200px' }} className="w-full">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="dashboard-3d relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-50"
      >
        <div ref={glowRef} className="dashboard-glow pointer-events-none absolute inset-0 z-50" />
        <div className="dashboard-shine pointer-events-none absolute inset-0 z-40" />

        <div
          className="bg-slate-800 px-3 py-2 flex items-center gap-2"
          style={{ transform: 'translateZ(30px)' }}
        >
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

        <div
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-4"
          style={{ transform: 'translateZ(20px)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="animate-dashboard-float">
              <div
                className="w-10 h-10 rounded-full border-2 border-yellow-400 bg-slate-800 flex items-center justify-center text-yellow-400 font-bold text-sm shrink-0"
                style={{ transform: 'translateZ(50px)' }}
              >
                J
              </div>
            </div>
            <div style={{ transform: 'translateZ(25px)' }}>
              <h3 className="text-yellow-400 font-serif font-bold text-sm">Bom dia, João Silva</h3>
              <p className="text-slate-300 text-[10px]">Bem-vindo à sua área de estudos.</p>
            </div>
            <div className="ml-auto animate-dashboard-float" style={{ animationDelay: '0.6s' }}>
              <span
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950"
                style={{ transform: 'translateZ(40px)' }}
              >
                <Crown className="w-2.5 h-2.5" /> Ouro
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-2">
          <div className="grid grid-cols-3 gap-2" style={{ transform: 'translateZ(20px)' }}>
            {cards.map((card) => (
              <div
                key={card.title}
                className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${card.gradient} p-2 text-white min-h-[50px]`}
                style={{ transform: 'translateZ(15px)' }}
              >
                <card.icon className="w-3.5 h-3.5 mb-1" />
                <p className="text-[9px] font-bold leading-tight">{card.title}</p>
                {card.count && (
                  <p className="text-[8px] text-white/70 mt-0.5">{card.count} itens</p>
                )}
              </div>
            ))}
          </div>

          <div
            className="bg-white rounded-lg p-2 border border-slate-200"
            style={{ transform: 'translateZ(15px)' }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <BellRing className="w-3 h-3 text-amber-500" />
              <span className="text-[9px] font-bold text-slate-800">Avisos</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-start gap-1 p-1 rounded bg-amber-50">
                <Megaphone className="w-2.5 h-2.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[7px] text-amber-900 font-medium">Novo Curso</p>
              </div>
              <div className="flex items-start gap-1 p-1 rounded bg-emerald-50">
                <Calendar className="w-2.5 h-2.5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[7px] text-emerald-900 font-medium">Mentoria</p>
              </div>
              <div className="flex items-start gap-1 p-1 rounded bg-red-50">
                <Radio className="w-2.5 h-2.5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-[7px] text-red-900 font-medium">Ao Vivo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

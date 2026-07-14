import { useRef, useState, useCallback, type ReactNode } from 'react'
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
} from 'lucide-react'

function TiltCard({ children, gradient }: { children: ReactNode; gradient: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tf, setTf] = useState('')
  const [glow, setGlow] = useState({ x: 50, y: 50, o: 0 })

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const rx = ((y - r.height / 2) / (r.height / 2)) * -7
    const ry = ((x - r.width / 2) / (r.width / 2)) * 7
    setTf(`perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.05,1.05,1.05)`)
    setGlow({ x: (x / r.width) * 100, y: (y / r.height) * 100, o: 1 })
  }, [])

  const onLeave = useCallback(() => {
    setTf('perspective(600px) rotateX(0) rotateY(0) scale3d(1,1,1)')
    setGlow({ x: 50, y: 50, o: 0 })
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transform: tf, transition: 'transform 0.2s ease-out' }}
      className="relative overflow-hidden rounded-lg"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: glow.o,
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(255,255,255,0.3), transparent 55%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

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
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-50 animate-fade-in-up">
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
          <div className="w-8 h-8 rounded-full border-2 border-yellow-400 bg-slate-800 flex items-center justify-center text-yellow-400 font-bold text-xs shrink-0 animate-float">
            J
          </div>
          <div>
            <h3 className="text-yellow-400 font-serif font-bold text-xs">Bom dia, João Silva</h3>
            <p className="text-slate-300 text-[9px]">Bem-vindo à sua área de estudos.</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[7px] font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950">
            <Crown className="w-2 h-2" /> Ouro
          </span>
        </div>
      </div>

      <div className="p-3 grid grid-cols-3 gap-2">
        {cards.map((card) => (
          <TiltCard key={card.title} gradient={card.gradient}>
            <div className="p-2 text-white min-h-[56px]">
              <card.icon className="w-3.5 h-3.5 mb-1" />
              <p className="text-[9px] font-bold leading-tight">{card.title}</p>
              <p className="text-[8px] text-white/70 mt-0.5">{card.count} itens</p>
            </div>
          </TiltCard>
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
  )
}

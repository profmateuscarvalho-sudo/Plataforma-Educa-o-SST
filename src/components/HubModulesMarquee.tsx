import { BookOpen, Newspaper, Radio, ClipboardList, Users, Film, LucideIcon } from 'lucide-react'

export interface HubModuleItem {
  title: string
  icon: LucideIcon
}

export const HUB_MARQUEE_MODULES: HubModuleItem[] = [
  { title: 'Cursos', icon: BookOpen },
  { title: 'Revistas', icon: Newspaper },
  { title: 'Aulas ao vivo', icon: Radio },
  { title: 'Simulados', icon: ClipboardList },
  { title: 'Mentorias', icon: Users },
  { title: 'Documentários', icon: Film },
]

interface HubModulesMarqueeProps {
  className?: string
}

export function HubModulesMarquee({ className = '' }: HubModulesMarqueeProps) {
  // Duplicamos a lista para criar um loop contínuo sem salto (0 a -50%)
  const doubleList = [...HUB_MARQUEE_MODULES, ...HUB_MARQUEE_MODULES]

  return (
    <div
      className={`group-marquee relative w-full overflow-hidden select-none py-1.5 ${className}`}
      aria-label="Módulos integrados do Hub de estudos"
    >
      {/* Máscara de gradiente nas bordas esquerda e direita para fusão suave */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-background via-background/80 to-transparent z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-background via-background/80 to-transparent z-10"
      />

      {/* Faixa animada */}
      <div className="animate-hub-marquee flex items-center gap-2.5 sm:gap-3">
        {doubleList.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={`${item.title}-${index}`}
              className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-card/85 text-foreground border border-border shadow-xs shrink-0 transition-colors hover:border-[#FDBE2D]/60 hover:bg-card"
            >
              <span className="w-6 h-6 rounded-lg bg-muted/80 flex items-center justify-center text-foreground shrink-0 border border-border/50">
                <Icon className="w-3.5 h-3.5 stroke-[1.8] text-foreground" />
              </span>
              <span className="text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap">
                {item.title}
              </span>
              <span
                aria-hidden="true"
                className="w-1 h-1 rounded-full bg-[#FDBE2D] ml-0.5 shrink-0 opacity-80"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

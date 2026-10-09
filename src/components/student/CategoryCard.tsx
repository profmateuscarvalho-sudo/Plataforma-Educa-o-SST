import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Lock } from 'lucide-react'

interface CategoryCardProps {
  title: string
  description: string
  icon: LucideIcon
  imageUrl?: string
  count?: number
  gradient?: string
  locked?: boolean
  onClick: () => void
}

export function CategoryCard({
  title,
  description,
  icon: Icon,
  count = 0,
  locked = false,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between text-left p-6 min-h-[190px]',
        'bg-card text-foreground border border-border rounded-[28px]',
        'transition-all duration-300 ease-out cursor-pointer',
        'hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(28,27,24,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        locked && 'opacity-60',
      )}
    >
      {/* Ponto amarelo no canto superior direito no hover e no foco */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200"
      />

      <div className="flex items-start justify-between w-full">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-foreground transition-colors group-hover:bg-primary/20">
          <Icon className="w-6 h-6 stroke-[1.75]" />
        </div>
        <div className="flex items-center gap-2 pr-4">
          {locked && (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
              title="Módulo bloqueado"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloqueado</span>
            </span>
          )}
          {count > 0 && (
            <span className="text-xs font-semibold text-muted-foreground px-2.5 py-1 rounded-full bg-muted">
              {count} {count === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-sans text-lg font-semibold tracking-tight text-foreground mb-1 group-hover:text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
      </div>
    </button>
  )
}

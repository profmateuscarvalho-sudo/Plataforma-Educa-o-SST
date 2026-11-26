import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function LockedBadge({ className }: { className?: string }) {
  return (
    <Badge
      className={cn('bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100', className)}
    >
      <Lock className="w-3 h-3 mr-1" />
      Acesso para assinantes
    </Badge>
  )
}

/**
 * Cadeado com CTA "Disponível no plano Prata" levando a /planos.
 * Usado nos catálogos/telas do aluno onde o conteúdo está bloqueado para o plano atual.
 */
export function LockedCta({ className, label }: { className?: string; label?: string }) {
  return (
    <Button
      asChild
      size="sm"
      className={cn(
        'h-9 rounded-full bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 font-semibold gap-1.5',
        className,
      )}
    >
      <Link to="/planos">
        <Lock className="w-3.5 h-3.5" />
        {label ?? 'Disponível no plano Prata'}
      </Link>
    </Button>
  )
}

/** Overlay de cadeado para capas/cards (revistas, cursos, documentários, lives). Leva para /planos. */
export function LockedOverlay({ className }: { className?: string }) {
  return (
    <Link
      to="/planos"
      className={cn(
        'absolute inset-0 bg-black/50 hover:bg-black/60 transition-colors flex flex-col items-center justify-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center">
        <Lock className="w-5 h-5" aria-hidden="true" />
      </div>
      <span className="text-xs font-semibold px-2 text-center">Assine</span>
    </Link>
  )
}

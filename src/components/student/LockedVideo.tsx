// Bloqueio de vídeo sem acesso: cadeado + CTA "Disponível no plano Prata"
// (levando a /planos). NUNCA renderizar um player vazio: use este bloco
// sempre que useProtectedVideo devolver locked=true.
import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LockedVideoProps {
  className?: string
  message?: string
}

export function LockedVideo({ className, message }: LockedVideoProps) {
  const navigate = useNavigate()
  return (
    <div
      className={cn(
        'w-full h-full min-h-[220px] flex flex-col items-center justify-center gap-4 rounded-xl bg-muted/40 border border-border text-center p-6',
        className,
      )}
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        <Lock className="w-7 h-7" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">
        {message || 'Este conteúdo está disponível apenas para assinantes.'}
      </p>
      <Button
        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        onClick={() => navigate('/planos')}
      >
        Disponível no plano Prata
      </Button>
    </div>
  )
}

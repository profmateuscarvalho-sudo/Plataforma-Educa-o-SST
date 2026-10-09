import { useNavigate } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackToHubProps {
  className?: string
}

export function BackToHub({ className }: BackToHubProps) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/plataforma')}
      className={cn(
        'inline-flex items-center gap-2 text-sm font-semibold rounded-full border border-border',
        'bg-card text-foreground hover:bg-muted hover:border-foreground/20 px-4 h-10 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      <LayoutDashboard className="w-4 h-4" />
      Voltar ao Hub
    </button>
  )
}

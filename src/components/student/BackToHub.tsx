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
      onClick={() => navigate('/plataforma')}
      className={cn(
        'flex items-center gap-2 text-sm font-medium transition-colors rounded-lg',
        'text-white/80 hover:text-white hover:bg-white/10 px-4 h-10',
        className,
      )}
    >
      <LayoutDashboard className="w-4 h-4" />
      Voltar ao Hub
    </button>
  )
}

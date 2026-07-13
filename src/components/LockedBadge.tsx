import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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

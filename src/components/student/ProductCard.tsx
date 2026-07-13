import { Link } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lock, PlayCircle, CheckCircle2, Sparkles, Award } from 'lucide-react'
import type { AccessStatus } from '@/hooks/use-student-access'

interface ProductCardProps {
  title: string
  description?: string
  imageUrl?: string
  status: AccessStatus
  category: string
  accessUrl?: string
  price?: number
  onBuy?: () => void
  isFree?: boolean
}

const statusMap: Record<AccessStatus, { label: string; cls: string; Icon: typeof Lock }> = {
  free: { label: 'Acesso Liberado', cls: 'bg-emerald-100 text-emerald-800', Icon: Sparkles },
  owned: { label: 'Adquirido', cls: 'bg-blue-100 text-blue-700', Icon: CheckCircle2 },
  subscriber: { label: 'Assinante', cls: 'bg-amber-100 text-amber-700', Icon: Award },
  locked: { label: 'Comprar', cls: 'bg-slate-200 text-slate-700', Icon: Lock },
}

export function ProductCard({
  title,
  description,
  imageUrl,
  status,
  category,
  accessUrl,
  price,
  onBuy,
  isFree,
}: ProductCardProps) {
  const { label, cls, Icon } = statusMap[status]
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  return (
    <Card className="overflow-hidden flex flex-col h-full border-slate-100 hover:shadow-lg transition-shadow group">
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <Badge className={`${cls} font-bold shadow-sm border-none px-2.5 py-1`}>
            <Icon className="w-3.5 h-3.5 mr-1.5" />
            {label}
          </Badge>
          {isFree === false && (
            <Badge className="bg-amber-100 text-amber-800 font-bold shadow-sm border-none px-2.5 py-1">
              Acesso para assinantes
            </Badge>
          )}
        </div>
      </div>
      <CardHeader className="pb-2">
        <h3 className="font-serif text-lg font-bold line-clamp-2 leading-tight text-secondary">
          {title}
        </h3>
        {category && (
          <span className="text-xs text-slate-400 uppercase tracking-wide">{category}</span>
        )}
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <p className="text-sm text-slate-500 line-clamp-2">{description}</p>
      </CardContent>
      <CardFooter className="pt-0 border-t border-slate-50 p-4 flex justify-between items-center">
        {status === 'locked' ? (
          <>
            <span className="font-bold text-primary">{price ? fmt(price) : ''}</span>
            <Button size="sm" onClick={onBuy}>
              Comprar
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-emerald-600">{label}</span>
            <Button size="sm" variant="outline" asChild>
              <Link to={accessUrl || '#'}>
                Acessar <PlayCircle className="ml-1 w-3.5 h-3.5" />
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

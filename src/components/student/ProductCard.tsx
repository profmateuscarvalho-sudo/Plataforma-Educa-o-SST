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
  free: {
    label: 'Acesso Liberado',
    cls: 'bg-success/15 text-success border-success/30',
    Icon: Sparkles,
  },
  owned: {
    label: 'Adquirido',
    cls: 'bg-primary/20 text-foreground border-primary/40',
    Icon: CheckCircle2,
  },
  subscriber: {
    label: 'Assinante',
    cls: 'bg-primary text-foreground border-primary font-bold',
    Icon: Award,
  },
  locked: { label: 'Comprar', cls: 'bg-muted text-muted-foreground border-border', Icon: Lock },
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

  // Verifica se a imagem é placeholder genérico da fábrica antiga; se for, não exibe
  const hasValidCustomImage = Boolean(imageUrl && !imageUrl.includes('img.usecurling.com'))

  return (
    <Card className="rounded-[28px] border border-border bg-card text-card-foreground overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(28,27,24,0.08)] group">
      {hasValidCustomImage ? (
        <div className="relative aspect-[3/2] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <Badge
              className={`${cls} rounded-full font-semibold shadow-sm px-2.5 py-1 text-xs border`}
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {label}
            </Badge>
            {isFree === false && (
              <Badge className="bg-primary/20 text-foreground border-primary/30 rounded-full font-semibold shadow-sm px-2.5 py-1 text-xs border">
                Acesso para assinantes
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 pb-2 bg-muted/40 border-b border-border/50 flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-foreground group-hover:bg-primary/20 transition-colors">
            <PlayCircle className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge
              className={`${cls} rounded-full font-semibold shadow-none px-2.5 py-0.5 text-xs border`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Badge>
            {isFree === false && (
              <Badge className="bg-primary/20 text-foreground border-primary/30 rounded-full font-semibold shadow-none px-2.5 py-0.5 text-[11px] border">
                Assinantes
              </Badge>
            )}
          </div>
        </div>
      )}

      <CardHeader className="pb-2 pt-5">
        {category && <span className="label-overline mb-1 block">{category}</span>}
        <h3 className="font-serif text-lg font-bold line-clamp-2 leading-tight text-foreground">
          {title}
        </h3>
      </CardHeader>
      <CardContent className="flex-grow pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
      </CardContent>
      <CardFooter className="pt-3 border-t border-border p-5 flex justify-between items-center">
        {status === 'locked' ? (
          <>
            <span className="font-bold text-foreground text-base">{price ? fmt(price) : ''}</span>
            <Button
              size="sm"
              onClick={onBuy}
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 h-10 shadow-sm"
            >
              Comprar
            </Button>
          </>
        ) : (
          <>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="rounded-full border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all px-4 h-10 font-semibold"
            >
              <Link to={accessUrl || '#'}>
                Acessar <PlayCircle className="ml-1.5 w-4 h-4" />
              </Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

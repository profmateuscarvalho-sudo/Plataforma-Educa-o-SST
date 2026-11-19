// Botão + bloco de compra avulsa da revista (BLOCO 4, Parte 2).
// Usado no card do catálogo (/revistas) e no leitor bloqueado.
// Mostra o preço vindo do servidor (/backend/v1/magazine-pricing) e o lembrete
// de assinatura Prata (12x) linkando /planos. Quem já tem Prata/Ouro/admin não
// renderiza nada (o pai já filtra).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import {
  fetchMagazinePricing,
  priceForEdition,
  formatBRL,
  type MagazinePricing,
} from '@/lib/magazine-pricing'

interface MagazineBuyButtonProps {
  magazineId: string
  onBuy: (magazineId: string) => void
  className?: string
  variant?: 'full' | 'compact'
}

export function MagazineBuyButton({
  magazineId,
  onBuy,
  className,
  variant = 'full',
}: MagazineBuyButtonProps) {
  const { user } = useAuth()
  const [pricing, setPricing] = useState<MagazinePricing | null>(null)

  useEffect(() => {
    let alive = true
    fetchMagazinePricing()
      .then((p) => alive && setPricing(p))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (!user) return null
  const price = priceForEdition(pricing, magazineId)
  if (!(price > 0)) return null

  return (
    <div className={cn('space-y-1.5', className)}>
      <Button
        size={variant === 'full' ? 'default' : 'sm'}
        onClick={() => onBuy(magazineId)}
        className={cn(
          'w-full rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none',
          variant === 'full' ? 'h-11' : 'h-9 text-sm',
        )}
      >
        {variant === 'full' ? (
          <ShoppingCart className="w-4 h-4 mr-2" />
        ) : (
          <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
        )}
        Comprar esta edição — {formatBRL(price)}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center leading-snug">
        ou{' '}
        <Link to="/planos" className="underline font-semibold hover:text-foreground">
          assine o Prata
        </Link>{' '}
        e leia todas: 12x de R$ 14,90
      </p>
    </div>
  )
}

// Botão + bloco de compra avulsa da revista (BLOCO 4, Parte 2).
// Usado no card do catálogo (/revistas) e no leitor bloqueado.
// Mostra o preço vindo do servidor (/backend/v1/magazine-pricing) e o lembrete
// de assinatura Prata (12x) linkando /planos. VISITANTE TAMBÉM VÊ o botão:
// o clique leva ao login (o pai decide — navigate('/login?redirect=...')).
// Prata/Ouro/admin NÃO renderizam (o pai já filtra com useStudentAccess).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

  // Preço só aparece quando já carregou do servidor; o botão continua visível
  const price = pricing ? priceForEdition(pricing, magazineId) : 0

  return (
    <div className={cn('space-y-1.5', className)}>
      <Button
        size={variant === 'full' ? 'default' : 'sm'}
        onClick={() => onBuy(magazineId)}
        className={cn(
          // w-full + px simétrico: o botão ocupa 100% da largura INTERNA do card
          // e nunca estoura; whitespace-normal permite o texto quebrar em telas
          // estreitas (grade de 4 colunas no desktop) com o ícone sempre dentro.
          'w-full max-w-full rounded-full font-bold bg-[#FDBE2D] hover:bg-[#e0a724] text-[#1C1B18] shadow-none px-3',
          'whitespace-normal text-center leading-tight min-w-0',
          variant === 'full' ? 'h-11' : 'h-9 text-sm',
        )}
      >
        <ShoppingCart className={cn('shrink-0', variant === 'full' ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
        <span className="min-w-0">
          Comprar esta edição
          {price > 0 && (
            <>
              {' — '}
              <span className="whitespace-nowrap">{formatBRL(price)}</span>
            </>
          )}
        </span>
      </Button>
      <p className="text-[11px] text-muted-foreground text-center leading-snug">
        ou{' '}
        <Link to="/planos" className="underline font-semibold hover:text-foreground">
          assine o Prata
        </Link>{' '}
        e leia todas: 12x de <span className="whitespace-nowrap">R$ 14,90</span>
      </p>
    </div>
  )
}

import React from 'react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  /** Rótulo pequeno exibido acima do título (overline) */
  badge?: React.ReactNode
  /** Título principal em Playfair Display 600 */
  title: React.ReactNode
  /** Descrição de uma linha abaixo do título */
  description?: React.ReactNode
  /** Ações ou elementos adicionais alinhados ou abaixo da descrição */
  children?: React.ReactNode
  /** Classes extras para a section wrapper */
  className?: string
  /** Classes extras para o container interno */
  containerClassName?: string
}

/**
 * Cabeçalho interno padronizado para as páginas públicas:
 * - Fundo --background (creme)
 * - Rótulo pequeno (estilo overline, --muted-foreground)
 * - Título em Playfair Display 600
 * - Linha de descrição
 * - Alinhados à esquerda
 * - 72px de respiro acima (pt-[72px]) e 56px abaixo (pb-[56px])
 */
export function PageHeader({
  badge,
  title,
  description,
  children,
  className,
  containerClassName,
}: PageHeaderProps) {
  return (
    <section className={cn('bg-background border-b border-border', className)}>
      <div
        className={cn(
          'container mx-auto px-4 pt-[72px] pb-[56px] text-left max-w-6xl',
          containerClassName,
        )}
      >
        <div className="max-w-3xl space-y-4">
          {badge && (
            <div>
              {typeof badge === 'string' ? (
                <span className="label-overline inline-block">{badge}</span>
              ) : (
                badge
              )}
            </div>
          )}
          <h1 className="title-h2-fluid font-serif font-semibold text-foreground tracking-tight text-balance">
            {title}
          </h1>
          {description && (
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-normal text-balance">
              {description}
            </p>
          )}
          {children && <div className="pt-2">{children}</div>}
        </div>
      </div>
    </section>
  )
}

export default PageHeader

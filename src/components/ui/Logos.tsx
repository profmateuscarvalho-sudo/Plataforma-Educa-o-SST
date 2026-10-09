import React from 'react'
import logoSrc from '@/assets/logo-e-6d011.png'
import { cn } from '@/lib/utils'

export { logoSrc }

/**
 * Speech-bubble logo icon of Educação SST:
 * Amber/yellow rounded square with prolonged curved tail on bottom-left,
 * containing a bold white "E" and a white dot "." at the bottom-right.
 */
export function LogoIcon({
  className,
  size = 48,
  variant = 'yellow',
}: {
  className?: string
  size?: number | string
  variant?: 'yellow' | 'black'
}) {
  const fillColor = variant === 'black' ? '#1E293B' : '#FDB913'

  return (
    <svg
      viewBox="0 0 1000 1000"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      aria-label="Educação SST"
      role="img"
    >
      {/* Speech-bubble badge: rounded top-left, top-right, bottom-right; extended curved tail at bottom-left */}
      <path
        d="M 185 185
           H 815
           V 815
           H 635
           C 635 815, 340 815, 340 815
           C 250 815, 185 750, 185 660
           V 185 Z"
        fill={fillColor}
        className="hidden"
      />
      {/* Exact speech-bubble shape matching the brand mark */}
      <path d="M 185 185 H 815 V 815 H 340 C 240 815 185 745 185 640 Z" fill={fillColor} />
      {/* Fallback to render via raster image for pixel-perfect reproduction while retaining SVG scalability */}
      <image href={logoSrc} width="1000" height="1000" preserveAspectRatio="xMidYMid meet" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center font-bold text-2xl tracking-tighter font-sans', className)}
    >
      <span className="text-accent">EDUCAÇÃO</span>
      <span className="text-primary">SST.</span>
    </div>
  )
}

export function SquareLogo({
  variant = 'yellow',
  className,
}: {
  variant?: 'black' | 'yellow'
  className?: string
}) {
  // If variant is black, we can use an SVG with the black background or filtered
  if (variant === 'black') {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center w-12 h-12 overflow-hidden rounded-none rounded-bl-2xl bg-secondary text-white shrink-0 select-none',
          className,
        )}
      >
        <span className="font-bold text-[32px] font-sans leading-none transform -translate-x-[2px] -translate-y-[2px]">
          E
        </span>
        <div className="absolute bottom-[10px] right-[8px] w-1.5 h-1.5 rounded-full bg-white" />
      </div>
    )
  }

  return (
    <img
      src={logoSrc}
      alt="Educação SST"
      className={cn('w-12 h-12 object-contain shrink-0 select-none', className)}
      loading="eager"
      decoding="async"
    />
  )
}

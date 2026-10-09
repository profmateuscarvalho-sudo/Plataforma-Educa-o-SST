import React from 'react'
import logoSrc from '@/assets/logo-e-4958a.png'
import wordmarkSrc from '@/assets/logo-educacao-sst-fc67e.png'
import { cn } from '@/lib/utils'

export { logoSrc, wordmarkSrc }

/**
 * Brand logo icon of Educação SST:
 * Amber/yellow square (#FDB913) where ONLY the bottom-left corner has a large rounded radius
 * (no speech-bubble tail), containing a bold white "E" and a white dot "." at the bottom-right.
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
      {/* Yellow shape: square with heavily rounded bottom-left corner (no tail) */}
      <path d="M 185 185 H 815 V 815 H 360 C 240 815 185 760 185 640 V 185 Z" fill={fillColor} />
      {/* Bold "E" in white */}
      <path
        d="M 335 303 H 635 V 379 H 419 V 454 H 613 V 530 H 419 V 617 H 635 V 693 H 335 Z"
        fill="#FFFFFF"
      />
      {/* White dot at bottom right */}
      <circle cx="704" cy="643" r="52" fill="#FFFFFF" />
      {/* Render via high-res raster asset for pixel-perfect reproduction */}
      <image href={logoSrc} width="1000" height="1000" preserveAspectRatio="xMidYMid meet" />
    </svg>
  )
}

export function LogoWordmark({
  className,
  height = 30,
}: {
  className?: string
  height?: number | string
}) {
  return (
    <img
      src={wordmarkSrc}
      alt="Educação SST"
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: 'auto' }}
      className={cn('object-contain shrink-0 select-none block max-w-none', className)}
      loading="eager"
      decoding="async"
    />
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-baseline font-bold text-[15px] tracking-[0.06em] font-sans text-foreground select-none',
        className,
      )}
    >
      <span>EDUCAÇÃO SST</span>
      <span className="text-primary font-black ml-[1px]">.</span>
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
      className={cn('h-11 w-11 object-contain shrink-0 select-none', className)}
      loading="eager"
      decoding="async"
    />
  )
}

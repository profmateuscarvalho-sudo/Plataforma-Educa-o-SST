import { cn } from '@/lib/utils'

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
  variant = 'black',
  className,
}: {
  variant?: 'black' | 'yellow'
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-12 h-12 font-bold text-[32px] font-sans',
        variant === 'black' ? 'bg-secondary text-white' : 'bg-accent text-white',
        'rounded-none rounded-bl-2xl',
        className,
      )}
    >
      <span className="leading-none transform -translate-x-[2px] -translate-y-[2px]">E</span>
      <div
        className={cn('absolute bottom-[10px] right-[8px] w-1.5 h-1.5 rounded-full', 'bg-white')}
      ></div>
    </div>
  )
}

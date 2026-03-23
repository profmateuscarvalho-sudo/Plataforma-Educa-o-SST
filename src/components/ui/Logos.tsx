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
        'relative flex items-center justify-center w-12 h-12 font-bold text-3xl font-sans',
        variant === 'black' ? 'bg-secondary text-white' : 'bg-accent text-white',
        'rounded-none rounded-bl-2xl',
        className,
      )}
    >
      <span className="mr-1 -mt-1 leading-none">E</span>
      <div className={cn('absolute bottom-2 right-2 w-2 h-2 rounded-full', 'bg-white')}></div>
    </div>
  )
}

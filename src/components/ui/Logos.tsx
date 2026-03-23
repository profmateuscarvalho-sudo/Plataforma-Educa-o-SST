import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center font-bold text-2xl tracking-tighter', className)}>
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
        'relative flex items-center justify-center w-10 h-10 font-bold text-3xl',
        variant === 'black' ? 'bg-secondary text-white' : 'bg-accent text-secondary',
        'rounded-none rounded-bl-[1rem]',
        className,
      )}
    >
      <span className="mr-1 -mt-1 leading-none">E</span>
      <div
        className={cn(
          'absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full',
          variant === 'black' ? 'bg-white' : 'bg-white',
        )}
      ></div>
    </div>
  )
}

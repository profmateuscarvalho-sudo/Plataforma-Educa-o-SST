/* Button Component primitives - A component that displays a button - from shadcn/ui (exposes Button, buttonVariants) */
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-all duration-200 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none min-h-[44px]',
  {
    variants: {
      variant: {
        default:
          'rounded-full bg-primary text-primary-foreground font-bold hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(28,27,24,0.16)] transition-all duration-250',
        destructive:
          'rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-0.5 transition-all duration-250',
        outline:
          'rounded-full border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all duration-250',
        secondary:
          'rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:-translate-y-0.5 transition-all duration-250',
        ghost: 'rounded-full text-foreground hover:bg-muted transition-colors duration-200',
        link: 'editorial-link text-foreground font-semibold p-0 h-auto min-h-0',
      },
      size: {
        default: 'min-h-[52px] px-7 py-3 text-sm',
        sm: 'min-h-[44px] px-5 py-2 text-xs',
        lg: 'min-h-[56px] px-9 py-4 text-base',
        icon: 'min-h-[44px] min-w-[44px] h-11 w-11 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }

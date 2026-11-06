import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** 흰 테이프. 화면에서 가장 중요한 동작 하나에만 */
        tape: 'rounded-[3px] bg-tape text-ink hover:bg-white',
        outline: 'rounded-md border border-floor-line bg-transparent text-chalk hover:bg-white/5',
        ghost: 'rounded-md text-chalk-dim hover:bg-white/5 hover:text-chalk',
        danger: 'rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-[15px]',
        lg: 'h-12 px-5 text-base',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'tape', size: 'md' },
  },
)

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

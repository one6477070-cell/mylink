import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** 모바일에서 확대되지 않도록 작은 화면은 16px */
export const inputClass =
  'w-full rounded-md border border-input bg-floor px-3 text-base text-chalk placeholder:text-chalk-dim/70 outline-offset-1 focus-visible:outline-2 focus-visible:outline-ring md:text-[15px]'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputClass, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(inputClass, 'resize-none py-2 leading-relaxed', className)} {...props} />
}

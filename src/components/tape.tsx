import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** 바닥에 붙인 흰 테이프 위에 마커로 쓴 글씨. 키워드와 사이트 이름에만 쓴다 */
export function Tape({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('tape inline-block px-[0.45em] pb-[0.04em] pt-[0.1em] leading-[1.15]', className)} {...props} />
}

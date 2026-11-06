'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { MapModel } from '@/lib/graph'
import { cn } from '@/lib/utils'

/** 선 색이 누구인지, 지도에 무엇이 얼마나 있는지. 휴대폰에서는 접어 둔다 */
export function Legend({
  model,
  meUid,
  onNextIsolated,
  onFit,
  className,
}: {
  model: MapModel
  meUid: string
  onNextIsolated: () => void
  onFit: () => void
  className?: string
}) {
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="선 색과 지도 상태 펼치기"
        className={cn(
          'absolute right-3 top-[4.25rem] z-20 flex items-center gap-2 rounded-lg border border-floor-line bg-floor-raised/90 px-2.5 py-2 text-sm text-chalk-dim backdrop-blur md:hidden',
          className,
        )}
      >
        <span aria-hidden className="flex gap-0.5">
          {model.people.slice(0, 6).map((p) => (
            <span key={p.uid} className="h-[5px] w-3" style={{ background: p.color }} />
          ))}
        </span>
        선 색
        {model.isolated.length > 0 && <span className="text-chalk">외딴 {model.isolated.length}</span>}
      </button>
    )
  }

  return (
    <aside
      aria-label="선 색과 지도 상태"
      className={cn(
        'absolute z-20 rounded-lg border border-floor-line bg-floor-raised/90 p-3 text-sm backdrop-blur',
        'right-3 top-[4.25rem] w-[11rem] md:bottom-4 md:right-4 md:top-auto md:w-[13rem]',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-chalk-dim">선 색은 이은 사람</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-chalk-dim hover:text-chalk md:hidden">
          접기
        </button>
      </div>
      <ul className="mt-2 space-y-1.5">
        {model.people.map((p) => (
          <li key={p.uid} className="flex items-center gap-2">
            <span aria-hidden className="h-[5px] w-5 shrink-0" style={{ background: p.color }} />
            <span className="truncate text-chalk">{p.uid === meUid && p.name !== '나' ? `${p.name} (나)` : p.name}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-floor-line pt-2 text-chalk-dim">
        <p>
          조각 {model.fragments.length}개, 선 {model.links.length}개
        </p>
        {model.isolated.length > 0 && (
          <button
            type="button"
            onClick={onNextIsolated}
            className="mt-1 text-left text-chalk underline decoration-dashed underline-offset-4 hover:decoration-solid"
          >
            외딴 조각 {model.isolated.length}개 보기
          </button>
        )}
      </div>
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={onFit}>
        전체 보기
      </Button>
    </aside>
  )
}

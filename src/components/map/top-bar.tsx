'use client'

import Link from 'next/link'
import { Tape } from '@/components/tape'
import { Button } from '@/components/ui/button'
import type { MapModel } from '@/lib/graph'
import type { MapStore } from '@/lib/store/types'
import type { Person } from '@/lib/types'
import { FragmentSearch } from './fragment-search'

export function TopBar({
  store,
  user,
  model,
  notice,
  onFind,
}: {
  store: MapStore
  user: Person
  model: MapModel
  notice?: string
  onFind: (id: string) => void
}) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start gap-2 p-3 md:gap-3 md:p-4">
      <Link href="/" aria-label="연결 지도 첫 화면" className="pointer-events-auto shrink-0 rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">
        <Tape className="-rotate-2 text-[22px]">연결 지도</Tape>
      </Link>

      <FragmentSearch
        model={model}
        onPick={onFind}
        placeholder="조각 찾기"
        label="지도에서 조각 찾기"
        className="pointer-events-auto w-[min(15rem,38vw)]"
      />

      <div className="pointer-events-auto ml-auto flex items-center gap-1">
        {store.mode === 'demo' ? (
          <details className="group relative">
            <summary className="cursor-pointer list-none rounded-md border border-floor-line bg-floor-raised/90 px-2.5 py-1.5 text-sm text-chalk-dim hover:text-chalk [&::-webkit-details-marker]:hidden">
              체험 모드
            </summary>
            <div className="absolute right-0 z-40 mt-2 w-64 rounded-lg border border-floor-line bg-floor-raised p-3 text-sm leading-relaxed text-chalk shadow-[0_12px_32px_rgb(0_0_0/0.45)]">
              <p>{notice ?? '이 브라우저에만 저장돼요. 다른 사람은 볼 수 없어요.'}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => store.resetDemo?.()}>
                예시 지도로 되돌리기
              </Button>
            </div>
          </details>
        ) : (
          <>
            <span className="hidden max-w-[10rem] truncate text-sm text-chalk-dim sm:inline">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={() => void store.signOut()}>
              로그아웃
            </Button>
          </>
        )}
      </div>
    </header>
  )
}

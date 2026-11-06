'use client'

import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Tape } from '@/components/tape'
import { Button } from '@/components/ui/button'
import { canRemove, fragmentLabel, otherEnd, type MapModel } from '@/lib/graph'
import { displayThought } from '@/lib/keyword'
import { formatDay, formatWhen } from '@/lib/misc'
import type { Fragment, Person } from '@/lib/types'
import { FragmentSearch } from './fragment-search'

type Props = {
  model: MapModel
  fragment: Fragment
  user: Person
  picking: boolean
  onClose: () => void
  onSelect: (id: string) => void
  onStartPicking: () => void
  onConnect: (id: string) => void
  onThrowAndConnect: (label: string) => void
  onDisconnect: (linkId: string) => void
  onRemove: () => void
}

/** 조각 하나를 눌렀을 때: 누가 언제 던졌는지, 이은 선, 잇기 */
export function FragmentPanel({
  model,
  fragment,
  user,
  picking,
  onClose,
  onSelect,
  onStartPicking,
  onConnect,
  onThrowAndConnect,
  onDisconnect,
  onRemove,
}: Props) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  const links = useMemo(() => model.linksOf.get(fragment.id) ?? [], [model, fragment.id])
  const author = fragment.createdBy
  const alsoThrown = Object.entries(fragment.throwers).filter(([uid]) => uid !== author.uid)
  const who = (p: Person) => (p.uid === user.uid ? '내가' : `${p.name}님이`)

  // 이미 내가 이은 조각과 자기 자신은 잇기 후보에서 뺀다
  const exclude = useMemo(
    () =>
      new Set([
        fragment.id,
        ...links.filter((l) => l.createdBy.uid === user.uid).map((l) => otherEnd(l, fragment.id)),
      ]),
    [fragment.id, links, user.uid],
  )

  return (
    <section
      aria-label="조각 자세히"
      className="absolute z-30 flex flex-col overflow-hidden border-floor-line bg-floor-raised shadow-[0_-12px_40px_rgb(0_0_0/0.4)] max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[56dvh] max-md:rounded-t-xl max-md:border-t md:bottom-4 md:right-4 md:top-[4.5rem] md:w-[22rem] md:rounded-xl md:border"
    >
      <div className="flex items-center justify-between py-1.5 pl-4 pr-2">
        <p className="text-sm text-chalk-dim">{fragment.kind === 'keyword' ? '키워드' : '생각'}</p>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
          <X />
        </Button>
      </div>

      <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {fragment.kind === 'keyword' ? (
          <h2>
            <Tape className="-rotate-1 text-[28px]">{fragment.text}</Tape>
          </h2>
        ) : (
          <h2
            className="border-l-[3px] pl-3 text-[17px] leading-relaxed text-chalk"
            style={{ borderColor: model.colorOf(author.uid) }}
          >
            {displayThought(fragment.text)}
          </h2>
        )}

        <p className="mt-3 text-sm leading-relaxed text-chalk-dim">
          {who(author)} {formatWhen(fragment.createdAt)}에 던졌어요.
        </p>
        {alsoThrown.length > 0 && (
          <p className="mt-1 text-sm leading-relaxed text-chalk-dim">
            같은 키워드를 {alsoThrown.map(([uid, name]) => (uid === user.uid ? '나' : `${name}님`)).join(', ')}도
            던졌어요.
          </p>
        )}

        <h3 className="mt-6 text-sm font-semibold text-chalk">이은 선 {links.length}</h3>
        {links.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-chalk-dim">아직 아무도 잇지 않은 외딴 조각이에요.</p>
        ) : (
          <ul className="mt-1 divide-y divide-floor-line">
            {links.map((l) => {
              const other = model.byId.get(otherEnd(l, fragment.id))
              if (!other) return null
              const mine = l.createdBy.uid === user.uid
              return (
                <li key={l.id} className="flex items-start gap-3 py-2.5">
                  <span aria-hidden className="mt-[0.6rem] h-[5px] w-4 shrink-0" style={{ background: model.colorOf(l.createdBy.uid) }} />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onSelect(other.id)}
                      className="line-clamp-2 text-left text-chalk underline-offset-2 hover:underline"
                    >
                      {other.kind === 'keyword' ? (
                        <Tape className="text-[19px]">{other.text}</Tape>
                      ) : (
                        fragmentLabel(other, 60)
                      )}
                    </button>
                    <p className="text-xs text-chalk-dim">
                      {who(l.createdBy)} {formatDay(l.createdAt)}에 이음
                    </p>
                  </div>
                  {mine && (
                    <Button variant="ghost" size="sm" onClick={() => onDisconnect(l.id)} aria-label={`${fragmentLabel(other, 20)} 쪽 선 끊기`}>
                      끊기
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <h3 className="mt-6 text-sm font-semibold text-chalk">잇기</h3>
        <FragmentSearch
          inline
          model={model}
          exclude={exclude}
          onPick={onConnect}
          onCreate={onThrowAndConnect}
          placeholder="이을 조각 찾기"
          label="이을 조각 찾기"
          className="mt-2"
        />
        <Button variant="outline" size="sm" className="mt-2" onClick={onStartPicking} disabled={picking}>
          {picking ? '지도에서 고르는 중' : '지도에서 골라 잇기'}
        </Button>

        {canRemove(model, fragment.id, user.uid) && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {confirmRemove ? (
              <>
                <Button variant="danger" size="sm" onClick={onRemove}>
                  지우기
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                  그만두기
                </Button>
                <span className="text-xs text-chalk-dim">지우면 되돌릴 수 없어요.</span>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)}>
                이 조각 지우기
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

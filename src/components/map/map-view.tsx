'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { buildModel, fragmentLabel, hasMyLink } from '@/lib/graph'
import { keywordId } from '@/lib/keyword'
import { describeError } from '@/lib/misc'
import { throwFragment } from '@/lib/store/actions'
import type { MapStore } from '@/lib/store/types'
import type { FragmentKind, MapData, Person } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Composer } from './composer'
import { FragmentPanel } from './fragment-panel'
import GraphCanvas, { type GraphControls } from './graph-canvas'
import { Legend } from './legend'
import { TopBar } from './top-bar'

type Toast = { id: number; text: string; tone: 'info' | 'error' }

export default function MapView({
  store,
  user,
  data,
  notice,
}: {
  store: MapStore
  user: Person
  data: MapData
  notice?: string
}) {
  const model = useMemo(() => buildModel(data), [data])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const controls = useRef<GraphControls>(null)
  const isolatedTurn = useRef(0)

  // 다른 사람이 지운 조각이면 패널은 저절로 닫힌다
  const selected = selectedId ? (model.byId.get(selectedId) ?? null) : null
  const isPicking = picking && selected !== null

  const say = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    setToast({ id: Date.now(), text, tone })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), toast.tone === 'error' ? 6000 : 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  /** 저장소 작업을 돌리고, 실패하면 이유를 알려 준다 */
  const run = useCallback(
    async (job: () => Promise<void>) => {
      try {
        await job()
        return true
      } catch (e) {
        say(describeError(e), 'error')
        return false
      }
    },
    [say],
  )

  /** 조각을 화면 가운데로. 패널에 가리는 만큼 비켜 준다 */
  const focus = useCallback((id: string) => {
    const wide = window.matchMedia('(min-width: 768px)').matches
    controls.current?.focus(id, wide ? { x: 190, y: 0 } : { x: 0, y: window.innerHeight * 0.26 })
  }, [])

  const select = useCallback(
    (id: string | null, center = false) => {
      setSelectedId(id)
      setPicking(false)
      if (id && center) window.setTimeout(() => focus(id), 60)
    },
    [focus],
  )

  const handleThrow = (kind: FragmentKind, text: string) =>
    run(async () => {
      const merged = kind === 'keyword' && model.byId.has(keywordId(text))
      const id = await throwFragment(store, user, kind, text)
      select(id, true)
      say(merged ? '같은 키워드가 있어서 그 자리로 모였어요' : '던졌어요')
    })

  const connect = (a: string, b: string) =>
    run(async () => {
      setPicking(false)
      if (hasMyLink(model, a, b, user.uid)) {
        say('이미 내가 이은 두 조각이에요')
        return
      }
      await store.connect(user, a, b)
      say('이었어요')
    })

  const throwAndConnect = (from: string, label: string) =>
    run(async () => {
      const id = await store.addKeyword(user, label, { asThrower: true })
      await store.connect(user, from, id)
      say('새 키워드를 던지고 이었어요')
    })

  const disconnect = (linkId: string) =>
    run(async () => {
      await store.disconnect(user, linkId)
      say('선을 끊었어요')
    })

  const remove = (id: string) =>
    run(async () => {
      await store.removeFragment(user, id)
      select(null)
      say('지웠어요')
    })

  const handleNodeClick = (id: string) => {
    if (isPicking && selectedId && id !== selectedId) {
      void connect(selectedId, id)
      return
    }
    select(id)
  }

  const handleBackgroundClick = () => {
    if (isPicking) setPicking(false)
    else select(null)
  }

  const showNextIsolated = () => {
    if (model.isolated.length === 0) return
    const f = model.isolated[isolatedTurn.current % model.isolated.length]
    isolatedTurn.current += 1
    select(f.id, true)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (picking) setPicking(false)
      else setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picking])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-floor">
      <GraphCanvas
        model={model}
        selectedId={selectedId}
        pickingFromId={isPicking ? selectedId : null}
        meUid={user.uid}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        controlRef={controls}
      />

      <TopBar store={store} user={user} model={model} notice={notice} onFind={(id) => select(id, true)} />

      {/* 상단 안내 줄: 지도에서 고르는 중이면 그 안내, 아니면 알림 */}
      <div aria-live="polite" className="pointer-events-none absolute left-3 right-3 top-[4.25rem] z-30 md:left-4 md:right-auto md:max-w-md">
        {isPicking && selected ? (
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-white/60 bg-floor-raised px-3 py-2 text-[15px] text-chalk">
            <span className="min-w-0 flex-1">‘{fragmentLabel(selected, 16)}’에 이을 조각을 지도에서 눌러 주세요.</span>
            <Button variant="ghost" size="sm" onClick={() => setPicking(false)}>
              그만두기
            </Button>
          </div>
        ) : (
          toast && (
            <p
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className={cn(
                'inline-block rounded-lg border bg-floor-raised px-3 py-2 text-[15px] leading-relaxed',
                toast.tone === 'error' ? 'border-destructive/60 text-chalk' : 'border-floor-line text-chalk',
              )}
            >
              {toast.text}
            </p>
          )
        )}
      </div>

      {model.fragments.length === 0 && (
        <p className="absolute left-4 top-[8rem] z-10 max-w-xs leading-relaxed text-chalk-dim md:left-6">
          아직 바닥이 비어 있어요. 아래에 키워드 하나를 던져 보세요.
        </p>
      )}

      <Legend
        model={model}
        meUid={user.uid}
        onNextIsolated={showNextIsolated}
        onFit={() => controls.current?.fit()}
        className={cn((selected || isPicking) && 'hidden')}
      />

      <Composer onThrow={handleThrow} className={cn(selected && 'max-md:hidden')} />

      {selected && (
        <FragmentPanel
          key={selected.id}
          model={model}
          fragment={selected}
          user={user}
          picking={isPicking}
          onClose={() => select(null)}
          onSelect={(id) => select(id, true)}
          onStartPicking={() => setPicking(true)}
          onConnect={(id) => void connect(selected.id, id)}
          onThrowAndConnect={(label) => void throwAndConnect(selected.id, label)}
          onDisconnect={(id) => void disconnect(id)}
          onRemove={() => void remove(selected.id)}
        />
      )}
    </div>
  )
}

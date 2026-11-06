'use client'

import { useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { KEYWORD_MAX, THOUGHT_MAX } from '@/lib/keyword'
import type { FragmentKind } from '@/lib/types'
import { cn } from '@/lib/utils'

const KINDS: { kind: FragmentKind; label: string }[] = [
  { kind: 'keyword', label: '키워드' },
  { kind: 'thought', label: '생각' },
]

/** 조각 던지기: 키워드 하나, 또는 생각 한 조각 */
export function Composer({
  onThrow,
  className,
}: {
  onThrow: (kind: FragmentKind, text: string) => Promise<boolean>
  className?: string
}) {
  const [kind, setKind] = useState<FragmentKind>('keyword')
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)
  const ready = text.trim().length > 0 && !pending

  const submit = async () => {
    if (!ready) return
    setPending(true)
    const ok = await onThrow(kind, text.trim())
    setPending(false)
    if (ok) setText('')
  }

  // 한글 조합 중의 Enter는 무시한다 (글자가 두 번 들어가거나 잘리는 문제 방지)
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    e.preventDefault()
    void submit()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      aria-label="조각 던지기"
      className={cn(
        'absolute z-20 border-floor-line bg-floor-raised/95 backdrop-blur',
        'max-md:inset-x-0 max-md:bottom-0 max-md:border-t max-md:px-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:pt-3',
        'md:bottom-4 md:left-4 md:w-[min(32rem,calc(100%-25rem))] md:rounded-xl md:border md:p-3',
        className,
      )}
    >
      <div className="flex items-end gap-2">
        <div role="radiogroup" aria-label="던질 조각 종류" className="flex h-10 shrink-0 items-center rounded-md border border-floor-line p-0.5">
          {KINDS.map(({ kind: k, label }) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                'h-full rounded-[4px] px-2.5 text-sm outline-offset-1 focus-visible:outline-2 focus-visible:outline-ring',
                kind === k ? 'bg-white/12 font-semibold text-chalk' : 'text-chalk-dim hover:text-chalk',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {kind === 'keyword' ? (
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={KEYWORD_MAX}
            placeholder="키워드 하나"
            aria-label="던질 키워드"
            enterKeyHint="send"
          />
        ) : (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={THOUGHT_MAX}
            rows={2}
            placeholder="생각 한 조각"
            aria-label="던질 생각"
            enterKeyHint="send"
          />
        )}
        <Button type="submit" disabled={!ready}>
          던지기
        </Button>
      </div>
      {kind === 'thought' && (
        <p className="mt-2 text-xs leading-relaxed text-chalk-dim">
          [[키워드]]를 넣으면 그 키워드와 저절로 이어져요. 줄을 바꾸려면 Shift+Enter.
        </p>
      )}
    </form>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { fragmentLabel, type MapModel } from '@/lib/graph'
import { cleanKeyword, displayThought, keywordId, keywordKey, matchesQuery } from '@/lib/keyword'
import { cn } from '@/lib/utils'

type Props = {
  model: MapModel
  onPick: (id: string) => void
  /** 있으면, 맞는 키워드가 없을 때 "새 키워드로 던지고 잇기"를 보여 준다 */
  onCreate?: (label: string) => void
  exclude?: Set<string>
  placeholder: string
  label: string
  /** 패널 안에서는 결과를 아래로 펼치고, 상단 바에서는 띄워서 보여 준다 */
  inline?: boolean
  className?: string
}

export function FragmentSearch({ model, onPick, onCreate, exclude, placeholder, label, inline = false, className }: Props) {
  const [query, setQuery] = useState('')
  const q = query.trim()

  const results = useMemo(() => {
    if (!q) return []
    return model.fragments
      .filter((f) => !exclude?.has(f.id))
      .filter((f) => matchesQuery(f.kind === 'thought' ? displayThought(f.text) : f.text, q))
      .slice(0, 6)
  }, [model, exclude, q])

  const canCreate = Boolean(onCreate && keywordKey(q) && !model.byId.has(keywordId(q)))

  const pick = (id: string) => {
    setQuery('')
    onPick(id)
  }
  const create = () => {
    if (!onCreate) return
    setQuery('')
    onCreate(q)
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        enterKeyHint="search"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && query) {
            e.stopPropagation()
            setQuery('')
            return
          }
          if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.keyCode === 229) return
          e.preventDefault()
          if (results[0]) pick(results[0].id)
          else if (canCreate) create()
        }}
      />
      {q && (
        <ul
          className={cn(
            'overflow-hidden rounded-md border border-floor-line bg-floor-raised',
            inline ? 'mt-1' : 'absolute inset-x-0 top-full z-40 mt-1 shadow-[0_12px_32px_rgb(0_0_0/0.45)]',
          )}
        >
          {results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => pick(f.id)}
                className="flex w-full items-baseline gap-2 px-3 py-2 text-left hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none"
              >
                <span className="shrink-0 text-xs text-chalk-dim">{f.kind === 'keyword' ? '키워드' : '생각'}</span>
                <span className={cn('truncate text-chalk', f.kind === 'keyword' && 'font-marker text-[18px]')}>
                  {fragmentLabel(f)}
                </span>
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                type="button"
                onClick={create}
                className="w-full px-3 py-2 text-left text-chalk hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none"
              >
                ‘{cleanKeyword(q)}’ 새 키워드로 던지고 잇기
              </button>
            </li>
          )}
          {results.length === 0 && !canCreate && <li className="px-3 py-2 text-sm text-chalk-dim">맞는 조각이 없어요</li>}
        </ul>
      )}
    </div>
  )
}

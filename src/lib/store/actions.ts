import { findKeywordsInThought } from '../keyword'
import type { FragmentKind, Person } from '../types'
import type { MapStore } from './types'

/**
 * 조각 던지기.
 * - 키워드: 같은 키워드가 있으면 그 조각으로 모인다.
 * - 생각: 생각 안의 [[키워드]]·#키워드를 찾아, 그 키워드 조각과 자동으로 잇는다.
 */
export async function throwFragment(
  store: MapStore,
  user: Person,
  kind: FragmentKind,
  text: string,
): Promise<string> {
  if (kind === 'keyword') return store.addKeyword(user, text, { asThrower: true })

  const id = await store.addThought(user, text)
  for (const label of findKeywordsInThought(text)) {
    const keyword = await store.addKeyword(user, label, { asThrower: false })
    await store.connect(user, id, keyword)
  }
  return id
}

import { SPACE_ID, firebaseOptions, hasFirebase } from '../firebase-config'
import type { MapStore } from './types'

let demoStore: Promise<MapStore> | null = null
let teamStore: Promise<MapStore> | null = null

/**
 * 저장소를 하나만 만들어 돌려쓴다.
 * - 'demo': 언제나 체험 모드
 * - 'auto': Firebase 설정값이 있으면 팀 모드, 없으면 체험 모드
 * Firebase SDK는 팀 모드일 때만 내려받는다.
 */
export function getStore(kind: 'auto' | 'demo'): Promise<MapStore> {
  if (kind === 'demo' || !hasFirebase) {
    demoStore ??= import('./demo-store').then((m) => m.createDemoStore())
    return demoStore
  }
  teamStore ??= import('./firebase-store').then((m) =>
    m.createFirebaseStore(firebaseOptions, SPACE_ID),
  )
  return teamStore
}

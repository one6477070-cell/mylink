import { THOUGHT_MAX, cleanKeyword, keywordId, keywordKey, linkId, orderPair } from '../keyword'
import { newId } from '../misc'
import type { Fragment, MapData } from '../types'
import { DEMO_USER, createSeed, type DemoState } from './seed'
import type { MapStore } from './types'

const STORAGE_KEY = 'yeongyeol-jido:demo:v1'

function load(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DemoState) : null
  } catch {
    return null
  }
}

/** 체험 모드: 로그인 없이, 이 브라우저(localStorage)에만 저장한다 */
export function createDemoStore(): MapStore {
  let state: DemoState = load() ?? createSeed()
  const listeners = new Set<(data: MapData) => void>()

  const snapshot = (): MapData => ({
    fragments: Object.values(state.fragments),
    links: Object.values(state.links),
  })
  const emit = () => {
    const data = snapshot()
    listeners.forEach((l) => l(data))
  }
  const commit = (next: DemoState) => {
    state = next
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 저장 공간이 막혀도 화면에서는 계속 쓸 수 있게 둔다
    }
    emit()
  }

  // 같은 브라우저의 다른 탭에서 바꾼 것도 따라온다
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return
    state = load() ?? createSeed()
    emit()
  })

  return {
    mode: 'demo',

    watchUser(cb) {
      cb(DEMO_USER)
      return () => {}
    },
    async signIn() {},
    async signOut() {},
    async isMember() {
      return true
    },
    async join() {},

    watchMap(cb) {
      listeners.add(cb)
      cb(snapshot())
      return () => {
        listeners.delete(cb)
      }
    },

    async addKeyword(user, raw, opts) {
      const text = cleanKeyword(raw)
      const key = keywordKey(text)
      if (!key) throw new Error('키워드를 적어 주세요.')
      const id = keywordId(text)
      const now = Date.now()
      const existing = state.fragments[id]
      if (!existing) {
        const created: Fragment = {
          id,
          kind: 'keyword',
          text,
          key,
          createdBy: user,
          createdAt: now,
          updatedAt: now,
          throwers: { [user.uid]: user.name },
        }
        commit({ ...state, fragments: { ...state.fragments, [id]: created } })
      } else if (opts?.asThrower !== false && !(user.uid in existing.throwers)) {
        const updated = { ...existing, throwers: { ...existing.throwers, [user.uid]: user.name } }
        commit({ ...state, fragments: { ...state.fragments, [id]: updated } })
      }
      return id
    },

    async addThought(user, raw) {
      const text = raw.trim().slice(0, THOUGHT_MAX)
      if (!text) throw new Error('생각을 적어 주세요.')
      const id = newId('t:')
      const now = Date.now()
      const created: Fragment = {
        id,
        kind: 'thought',
        text,
        key: null,
        createdBy: user,
        createdAt: now,
        updatedAt: now,
        throwers: { [user.uid]: user.name },
      }
      commit({ ...state, fragments: { ...state.fragments, [id]: created } })
      return id
    },

    async connect(user, a, b) {
      if (a === b) throw new Error('같은 조각끼리는 이을 수 없어요.')
      if (!state.fragments[a] || !state.fragments[b]) throw new Error('이을 조각을 찾지 못했어요.')
      const id = linkId(a, b, user.uid)
      if (state.links[id]) return
      const [x, y] = orderPair(a, b)
      commit({
        ...state,
        links: { ...state.links, [id]: { id, a: x, b: y, createdBy: user, createdAt: Date.now() } },
      })
    },

    async disconnect(user, id) {
      const link = state.links[id]
      if (!link) return
      if (link.createdBy.uid !== user.uid) throw new Error('내가 이은 선만 끊을 수 있어요.')
      const links = { ...state.links }
      delete links[id]
      commit({ ...state, links })
    },

    async removeFragment(user, id) {
      const f = state.fragments[id]
      if (!f) return
      if (f.createdBy.uid !== user.uid) throw new Error('내가 던진 조각만 지울 수 있어요.')
      const fragments = { ...state.fragments }
      delete fragments[id]
      const links = Object.fromEntries(
        Object.entries(state.links).filter(
          ([, l]) => !((l.a === id || l.b === id) && l.createdBy.uid === user.uid),
        ),
      )
      commit({ fragments, links })
    },

    resetDemo() {
      commit(createSeed())
    },
  }
}

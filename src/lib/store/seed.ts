import { keywordId, keywordKey, linkId, orderPair } from '../keyword'
import type { Fragment, Link, Person } from '../types'

/** 체험 모드에서 '나' */
export const DEMO_USER: Person = { uid: 'demo-me', name: '나' }

const DIRECTOR: Person = { uid: 'demo-director', name: '연출' }
const ACTOR: Person = { uid: 'demo-actor', name: '배우' }
const STAGE: Person = { uid: 'demo-stage', name: '무대' }

export type DemoState = {
  fragments: Record<string, Fragment>
  links: Record<string, Link>
}

/** 체험용 예시 지도: 처음 들어온 사람이 무엇을 할 수 있는지 바로 보이게 */
export function createSeed(now = Date.now()): DemoState {
  const hour = 60 * 60 * 1000
  const fragments: Record<string, Fragment> = {}
  const links: Record<string, Link> = {}

  const keyword = (text: string, by: Person, hoursAgo: number, alsoThrownBy: Person[] = []) => {
    const id = keywordId(text)
    const at = now - hoursAgo * hour
    fragments[id] = {
      id,
      kind: 'keyword',
      text,
      key: keywordKey(text),
      createdBy: by,
      createdAt: at,
      updatedAt: at,
      throwers: Object.fromEntries([by, ...alsoThrownBy].map((p) => [p.uid, p.name])),
    }
    return id
  }
  const thought = (id: string, text: string, by: Person, hoursAgo: number) => {
    const at = now - hoursAgo * hour
    fragments[id] = {
      id,
      kind: 'thought',
      text,
      key: null,
      createdBy: by,
      createdAt: at,
      updatedAt: at,
      throwers: { [by.uid]: by.name },
    }
    return id
  }
  const connect = (a: string, b: string, by: Person, hoursAgo: number) => {
    const id = linkId(a, b, by.uid)
    const [x, y] = orderPair(a, b)
    links[id] = { id, a: x, b: y, createdBy: by, createdAt: now - hoursAgo * hour }
  }

  const silence = keyword('침묵', DIRECTOR, 72, [ACTOR])
  const waiting = keyword('기다림', DIRECTOR, 71)
  const breath = keyword('숨', ACTOR, 60)
  const chair = keyword('빈 의자', STAGE, 50)
  const door = keyword('문', STAGE, 49)
  keyword('소금', DEMO_USER, 2)

  const t1 = thought('t:seed-breath', '[[침묵]]이 길어지면 객석의 [[숨]]이 들린다', ACTOR, 58)
  const t2 = thought('t:seed-door', '암전 대신 [[문]] 여닫는 소리로 장면을 넘기면?', STAGE, 30)

  connect(silence, waiting, DIRECTOR, 70)
  connect(t1, silence, ACTOR, 58)
  connect(t1, breath, ACTOR, 58)
  connect(silence, chair, STAGE, 48)
  connect(waiting, chair, DIRECTOR, 47)
  connect(waiting, chair, STAGE, 46)
  connect(chair, door, STAGE, 45)
  connect(t2, door, STAGE, 30)
  connect(breath, waiting, ACTOR, 20)

  return { fragments, links }
}

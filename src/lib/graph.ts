import { TAPE_COLORS } from './colors'
import { displayThought } from './keyword'
import type { Fragment, Link, MapData, Person } from './types'

/** 목록이나 안내 문구에 쓸 짧은 이름 */
export function fragmentLabel(f: Fragment, max = 40): string {
  const text = f.kind === 'thought' ? displayThought(f.text) : f.text
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export type PersonInfo = Person & { color: string; firstAt: number }

/** 화면이 쓰는 지도 모델: 원본 데이터에서 연결 수, 외딴 조각, 사람별 색을 계산해 둔다 */
export type MapModel = {
  fragments: Fragment[]
  byId: Map<string, Fragment>
  /** 두 끝이 모두 남아 있는 연결만 */
  links: Link[]
  linksOf: Map<string, Link[]>
  people: PersonInfo[]
  colorOf: (uid: string) => string
  /** 아무도 잇지 않은 외딴 조각 */
  isolated: Fragment[]
}

export function buildModel(data: MapData): MapModel {
  const fragments = [...data.fragments].sort((x, y) => x.createdAt - y.createdAt)
  const byId = new Map(fragments.map((f) => [f.id, f]))
  const links = data.links
    .filter((l) => l.a !== l.b && byId.has(l.a) && byId.has(l.b))
    .sort((x, y) => x.createdAt - y.createdAt)

  const linksOf = new Map<string, Link[]>(fragments.map((f) => [f.id, []]))
  for (const l of links) {
    linksOf.get(l.a)?.push(l)
    linksOf.get(l.b)?.push(l)
  }

  // 사람별 색: 지도에 처음 나타난 순서대로 테이프 색을 나눠 준다
  const first = new Map<string, PersonInfo>()
  const touch = (p: Person, at: number) => {
    const seen = first.get(p.uid)
    if (!seen || at < seen.firstAt) first.set(p.uid, { ...p, color: '', firstAt: at })
  }
  for (const f of fragments) {
    touch(f.createdBy, f.createdAt)
    // 같은 키워드를 나중에 던진 사람은 처음 던진 사람보다 뒤로
    for (const [uid, name] of Object.entries(f.throwers)) touch({ uid, name }, f.createdAt + 1)
  }
  for (const l of links) touch(l.createdBy, l.createdAt)
  const people = [...first.values()]
    .sort((x, y) => x.firstAt - y.firstAt || x.uid.localeCompare(y.uid))
    .map((p, i) => ({ ...p, color: TAPE_COLORS[i % TAPE_COLORS.length] }))
  const colors = new Map(people.map((p) => [p.uid, p.color]))

  return {
    fragments,
    byId,
    links,
    linksOf,
    people,
    colorOf: (uid) => colors.get(uid) ?? TAPE_COLORS[0],
    isolated: fragments.filter((f) => (linksOf.get(f.id)?.length ?? 0) === 0),
  }
}

/** 상대 조각 id */
export function otherEnd(link: Link, id: string): string {
  return link.a === id ? link.b : link.a
}

/** 이미 내가 이 두 조각을 이었는지 */
export function hasMyLink(model: MapModel, a: string, b: string, uid: string): boolean {
  return (model.linksOf.get(a) ?? []).some(
    (l) => otherEnd(l, a) === b && l.createdBy.uid === uid,
  )
}

/**
 * 지울 수 있는 조각인지: 내가 만들었고, 다른 사람이 같은 키워드를 던지지 않았고,
 * 다른 사람이 이은 선이 없을 때만. (다른 사람의 기록을 함께 지우지 않기 위해)
 */
export function canRemove(model: MapModel, id: string, uid: string): boolean {
  const f = model.byId.get(id)
  if (!f || f.createdBy.uid !== uid) return false
  if (Object.keys(f.throwers).some((t) => t !== uid)) return false
  return (model.linksOf.get(id) ?? []).every((l) => l.createdBy.uid === uid)
}

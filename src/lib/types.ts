/**
 * 데이터의 원자 단위 (PRD.md 「데이터 구조」 참고)
 * - 조각: 키워드 또는 생각 하나
 * - 연결: 조각과 조각을 잇는 선, 누가 이었는지 포함
 * - 작성자와 시간: 누가 언제 만들고 바꿨는지
 * - 개념 노드: 같은 키워드는 팀 전체가 공유하는 하나의 조각으로 모인다
 */

export type FragmentKind = 'keyword' | 'thought'

export type Person = {
  uid: string
  name: string
}

/** 조각: 키워드 또는 생각 하나 */
export type Fragment = {
  id: string
  kind: FragmentKind
  text: string
  /** 키워드만: 같은 키워드를 하나로 모으는 기준값 (생각은 null) */
  key: string | null
  createdBy: Person
  createdAt: number
  updatedAt: number
  /** 같은 키워드를 던진 사람들 (uid → 이름). 생각은 작성자 한 명 */
  throwers: Record<string, string>
}

/** 연결: 조각과 조각을 잇는 선. a < b 순서로 저장한다 */
export type Link = {
  id: string
  a: string
  b: string
  createdBy: Person
  createdAt: number
}

export type MapData = {
  fragments: Fragment[]
  links: Link[]
}

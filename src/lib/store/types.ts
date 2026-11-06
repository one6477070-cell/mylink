import type { MapData, Person } from '../types'

export type Unsubscribe = () => void

/**
 * 화면이 데이터에 닿는 유일한 출입구.
 * 체험 모드(demo-store)와 팀 모드(firebase-store)가 같은 약속을 지킨다.
 * 기능을 더하면 두 저장소 모두에 구현한다.
 */
export interface MapStore {
  readonly mode: 'demo' | 'team'

  watchUser(cb: (user: Person | null) => void): Unsubscribe
  signIn(): Promise<void>
  signOut(): Promise<void>

  /** 팀 자료는 멤버만 본다. 멤버는 초대 코드로 들어온다 */
  isMember(user: Person): Promise<boolean>
  join(user: Person, code: string): Promise<void>

  /** 지도 전체를 실시간으로 받는다 */
  watchMap(cb: (data: MapData) => void, onError: (error: unknown) => void): Unsubscribe

  /**
   * 키워드를 던진다. 같은 키워드가 이미 있으면 새로 만들지 않고 그 조각으로 모인다.
   * asThrower가 false면(생각 안에서 [[언급]]만 한 경우) 던진 사람 목록에 넣지 않는다.
   */
  addKeyword(user: Person, label: string, opts?: { asThrower?: boolean }): Promise<string>
  addThought(user: Person, text: string): Promise<string>

  connect(user: Person, a: string, b: string): Promise<void>
  /** 내가 이은 선만 끊을 수 있다 */
  disconnect(user: Person, linkId: string): Promise<void>
  /** 내 조각과, 그 조각에 내가 이은 선을 함께 지운다 */
  removeFragment(user: Person, id: string): Promise<void>

  /** 체험 모드만: 예시 지도로 되돌리기 */
  resetDemo?(): void
}

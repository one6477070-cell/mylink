export const KEYWORD_MAX = 30
export const THOUGHT_MAX = 500

/** 화면에 보일 키워드: 앞의 #과 겹친 공백만 정리한다 */
export function cleanKeyword(raw: string): string {
  return raw
    .normalize('NFC')
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, KEYWORD_MAX)
}

/**
 * 같은 키워드인지 가리는 기준값.
 * 띄어쓰기, 영문 대소문자, 앞의 #은 무시한다. ("빈 의자" = "빈의자")
 */
export function keywordKey(raw: string): string {
  return cleanKeyword(raw).replace(/\s/g, '').toLowerCase().replace(/\//g, '∕')
}

/** 키워드 조각의 id. 같은 키워드면 누가 던져도 같은 id → 팀 전체가 하나의 노드를 공유 */
export function keywordId(raw: string): string {
  return `k:${keywordKey(raw)}`
}

/** 연결의 id. 같은 사람이 같은 두 조각을 두 번 잇지 않도록 (두 조각 + 이은 사람) */
export function linkId(a: string, b: string, uid: string): string {
  const [x, y] = orderPair(a, b)
  return `${x}__${y}__${uid}`
}

export function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

/**
 * 생각 안에 적힌 [[키워드]]와 #키워드를 찾는다.
 * 한국어는 조사가 붙기 쉬워서 [[침묵]]이 처럼 대괄호를 쓰는 편이 정확하다.
 * #은 뒤에 띄어쓰기가 있어야 끊긴다 (#빈_의자 → "빈 의자").
 */
export function findKeywordsInThought(text: string): string[] {
  const found = new Map<string, string>()
  const add = (raw: string) => {
    const label = cleanKeyword(raw)
    const key = keywordKey(label)
    if (key && !found.has(key)) found.set(key, label)
  }
  // 적힌 순서대로 찾는다: [[키워드]] 또는 (글자에 붙지 않은) #키워드
  const pattern = /\[\[([^[\]\n]+)\]\]|(?:^|[^\p{L}\p{N}_&/])#([\p{L}\p{N}_]+)/gu
  for (const m of text.matchAll(pattern)) {
    if (m[1]) add(m[1])
    else if (m[2]) add(m[2].replace(/_/g, ' '))
  }
  return [...found.values()]
}

/** 화면에 보일 생각 글: [[ ]] 표시만 걷어 낸다 (연결은 선으로 보이니까) */
export function displayThought(text: string): string {
  return text.replace(/\[\[([^[\]\n]+)\]\]/g, '$1')
}

/** 찾기용: 띄어쓰기·대소문자 무시 */
export function matchesQuery(text: string, query: string): boolean {
  const q = query.normalize('NFC').replace(/\s/g, '').toLowerCase()
  if (!q) return false
  return text.normalize('NFC').replace(/\s/g, '').toLowerCase().includes(q)
}

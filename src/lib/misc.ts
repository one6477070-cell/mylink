/** 짧은 무작위 id. http로 연 개발 서버(보안 컨텍스트 아님)에서도 동작하도록 대체 경로를 둔다 */
export function newId(prefix = ''): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return prefix + crypto.randomUUID().replace(/-/g, '').slice(0, 20)
  }
  return prefix + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12)
}

const dateFmt = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' })
const dateYearFmt = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' })

/** "11월 7일 오전 12:37" 처럼 */
export function formatWhen(ms: number, now = Date.now()): string {
  const d = new Date(ms)
  const sameYear = d.getFullYear() === new Date(now).getFullYear()
  return `${(sameYear ? dateFmt : dateYearFmt).format(d)} ${timeFmt.format(d)}`
}

/** "11월 7일" 처럼 */
export function formatDay(ms: number, now = Date.now()): string {
  const d = new Date(ms)
  return (d.getFullYear() === new Date(now).getFullYear() ? dateFmt : dateYearFmt).format(d)
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

/** Firebase 등에서 온 오류를 사람이 읽을 문장으로 */
export function describeError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : ''
  const known: Record<string, string> = {
    'permission-denied': '권한이 없어요. 팀 멤버로 들어왔는지, Firestore 보안 규칙을 게시했는지 확인해 주세요.',
    unavailable: '서버에 닿지 않아요. 인터넷 연결을 확인해 주세요.',
    'auth/popup-closed-by-user': '로그인 창이 닫혔어요. 다시 눌러 주세요.',
    'auth/cancelled-popup-request': '로그인 창이 닫혔어요. 다시 눌러 주세요.',
    'auth/popup-blocked': '브라우저가 로그인 창을 막았어요. 팝업을 허용한 뒤 다시 눌러 주세요.',
    'auth/unauthorized-domain':
      '이 주소가 Firebase에 등록되지 않았어요. Authentication → 설정 → 승인된 도메인에 이 주소를 추가해 주세요.',
    'auth/network-request-failed': '네트워크 문제로 로그인하지 못했어요. 연결을 확인하고 다시 눌러 주세요.',
  }
  if (known[code]) return known[code]
  if (error instanceof Error && error.message) return error.message
  return '알 수 없는 문제가 생겼어요. 새로고침한 뒤 다시 해 주세요.'
}

/** 카카오톡·인스타그램 같은 앱 안 브라우저에서는 구글 로그인이 막힌다 */
export function detectInAppBrowser(ua: string): 'kakaotalk' | 'other' | null {
  if (/KAKAOTALK/i.test(ua)) return 'kakaotalk'
  if (/Instagram|FBAN|FBAV|Line\/|NAVER\(inapp|DaumApps|; wv\)/i.test(ua)) return 'other'
  return null
}

export function openInExternalBrowserFromKakao(url: string) {
  window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
}

/**
 * 사람마다 다른 바미리(스파이크) 테이프 색.
 * 지도에서 색은 '누가'를 뜻할 때만 쓴다. 선택 표시는 색 대신 흰 빛으로 한다.
 */
export const TAPE_COLORS = [
  '#ef4b3f', // 빨강
  '#f3c331', // 노랑
  '#4d8ee8', // 파랑
  '#43b06c', // 초록
  '#f28a2d', // 주황
  '#a173dc', // 보라
  '#ee6fa8', // 분홍
  '#4fc6e0', // 하늘
] as const

export const TAPE_WHITE = '#f0eee6'
export const INK = '#19191b'
export const CHALK = '#e8e6df'
export const FLOOR = '#1e1e20'

export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

import type { CSSProperties } from 'react'
import { TAPE_COLORS } from '@/lib/colors'

/** 첫 화면의 바닥 그림: 테이프 조각들과, 사람마다 다른 색으로 이은 선 */

type TapeMark = { id: string; text: string; cx: number; cy: number; w: number; isolated?: boolean }

const H = 54
const TAPES: TapeMark[] = [
  { id: 'silence', text: '침묵', cx: 430, cy: 190, w: 132 },
  { id: 'waiting', text: '기다림', cx: 712, cy: 112, w: 160 },
  { id: 'breath', text: '숨', cx: 286, cy: 372, w: 86 },
  { id: 'chair', text: '빈 의자', cx: 616, cy: 346, w: 178 },
  { id: 'door', text: '문', cx: 806, cy: 478, w: 86 },
  { id: 'salt', text: '소금', cx: 470, cy: 548, w: 118, isolated: true },
]
const NOTE = { cx: 150, cy: 214, w: 252, h: 78, lines: ['침묵이 길어지면', '객석의 숨이 들린다'] }

const [RED, YELLOW, BLUE] = TAPE_COLORS
const THREADS: { from: string; to: string; color: string; bend?: number }[] = [
  { from: 'silence', to: 'waiting', color: RED },
  { from: 'note', to: 'silence', color: YELLOW },
  { from: 'note', to: 'breath', color: YELLOW, bend: -0.12 },
  { from: 'silence', to: 'chair', color: BLUE },
  { from: 'waiting', to: 'chair', color: RED, bend: 0.16 },
  { from: 'waiting', to: 'chair', color: BLUE, bend: -0.16 },
  { from: 'chair', to: 'door', color: BLUE },
]

function center(id: string) {
  if (id === 'note') return { x: NOTE.cx, y: NOTE.cy }
  const t = TAPES.find((m) => m.id === id)!
  return { x: t.cx, y: t.cy }
}

function threadPath(from: string, to: string, bend = 0) {
  const a = center(from)
  const b = center(to)
  const mx = (a.x + b.x) / 2 - (b.y - a.y) * bend
  const my = (a.y + b.y) / 2 + (b.x - a.x) * bend
  return `M${a.x} ${a.y} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x} ${b.y}`
}

/** 손으로 찢은 테이프 끝 */
function tapePolygon(cx: number, cy: number, w: number, h: number, seed: number) {
  const x = cx - w / 2
  const y = cy - h / 2
  const n = 5
  const a = Math.min(4, h * 0.1)
  const r = (i: number) => 0.55 + 0.45 * Math.abs(Math.sin(seed * 12.9898 + i * 78.233))
  const pts: [number, number][] = [
    [x, y],
    [x + w, y],
  ]
  for (let i = 1; i <= n; i++) pts.push([x + w - (i % 2 ? a * r(i) : 0), y + (h * i) / n])
  pts.push([x, y + h])
  for (let i = n - 1; i >= 0; i--) pts.push([x + (i % 2 ? a * r(i + 9) : 0), y + (h * i) / n])
  return pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
}

const delay = (ms: number) => ({ '--delay': `${ms}ms` }) as CSSProperties

export function FloorIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 620" className={className} aria-hidden="true" focusable="false">
      <g fill="none" strokeWidth={7} strokeLinecap="butt">
        {THREADS.map((t, i) => (
          <path
            key={`${t.from}-${t.to}-${t.color}`}
            d={threadPath(t.from, t.to, t.bend)}
            stroke={t.color}
            strokeOpacity={0.92}
            pathLength={1}
            className="draw-in"
            style={delay(420 + i * 110)}
          />
        ))}
      </g>

      <g className="lay-in" style={delay(0)}>
        <rect x={NOTE.cx - NOTE.w / 2} y={NOTE.cy - NOTE.h / 2} width={NOTE.w} height={NOTE.h} rx={4} fill="#2b2b2f" stroke="rgb(232 230 223 / 0.18)" />
        <rect x={NOTE.cx - NOTE.w / 2} y={NOTE.cy - NOTE.h / 2} width={5} height={NOTE.h} fill={YELLOW} />
        {NOTE.lines.map((line, i) => (
          <text key={line} x={NOTE.cx - NOTE.w / 2 + 22} y={NOTE.cy - 10 + i * 27} fill="var(--chalk)" fontSize={19} fontFamily="var(--font-sans)" dominantBaseline="middle">
            {line}
          </text>
        ))}
      </g>

      {TAPES.map((t, i) => (
        <g key={t.id} className="lay-in" style={delay(60 + i * 60)}>
          <polygon
            points={tapePolygon(t.cx, t.cy, t.w, H, i + 1)}
            fill={t.isolated ? 'none' : 'var(--tape)'}
            stroke={t.isolated ? 'rgb(240 238 230 / 0.75)' : 'none'}
            strokeWidth={2}
            strokeDasharray={t.isolated ? '7 6' : undefined}
          />
          <text
            x={t.cx}
            y={t.cy + 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-marker)"
            fontWeight={400}
            fontSize={34}
            fill={t.isolated ? 'var(--chalk)' : 'var(--ink)'}
          >
            {t.text}
          </text>
        </g>
      ))}
    </svg>
  )
}

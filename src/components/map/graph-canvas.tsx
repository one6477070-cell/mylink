'use client'

import { forceCollide, forceX, forceY } from 'd3-force'
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from 'react-force-graph-2d'
import { CHALK, INK, TAPE_WHITE, withAlpha } from '@/lib/colors'
import { otherEnd, type MapModel } from '@/lib/graph'
import { displayThought } from '@/lib/keyword'
import { escapeHtml } from '@/lib/misc'
import type { FragmentKind } from '@/lib/types'

/*
 * 지도 그리기 (react-force-graph-2d, canvas)
 * - 키워드: 흰 테이프 + 마커 글씨. 아무도 잇지 않았으면 점선 자리만 (아직 안 붙인 테이프)
 * - 생각: 타자 친 쪽지 카드. 왼쪽 띠는 쓴 사람의 색
 * - 선: 이은 사람의 테이프 색. 같은 두 조각을 여러 사람이 이으면 선이 갈라져 휜다
 * - 선택: 흰 스포트라이트
 */

const MARKER_FONT = '"Yeon Sung", "IBM Plex Sans KR", sans-serif'
const TYPED_FONT = '"IBM Plex Sans KR", "Apple SD Gothic Neo", sans-serif'
const KEYWORD_SIZE = 20
const THOUGHT_SIZE = 10.5
const THOUGHT_LINE = 14.5
const THOUGHT_MAX_W = 140
const THOUGHT_MAX_LINES = 3

type Layout = { key: string; w: number; h: number; lines: string[] }
type NodeData = {
  id: string
  kind: FragmentKind
  text: string
  authorColor: string
  isolated: boolean
  seed: number
  radius: number
  layout?: Layout
}
type LinkData = { id: string; color: string; curvature: number; tip: string }
type GNode = NodeObject<NodeData>
type GLink = LinkObject<NodeData, LinkData>

export type GraphControls = {
  /** offset: 패널에 가려지는 만큼(화면 px) 비켜서 가운데로 */
  focus: (id: string, offset?: { x: number; y: number }) => void
  fit: () => void
}

type Props = {
  model: MapModel
  selectedId: string | null
  pickingFromId: string | null
  meUid: string
  onNodeClick: (id: string) => void
  onBackgroundClick: () => void
  controlRef: Ref<GraphControls>
}

export default function GraphCanvas({
  model,
  selectedId,
  pickingFromId,
  meUid,
  onNodeClick,
  onBackgroundClick,
  controlRef,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphMethods<GNode, GLink> | undefined>(undefined)
  const cache = useRef(new Map<string, GNode>())
  const fitted = useRef(false)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const boxRef = useRef(box)
  const [fontTick, setFontTick] = useState(0)

  // 물리 엔진이 위치(x, y)를 노드 객체에 직접 적는다. 데이터가 새로 와도
  // 같은 조각은 같은 객체를 다시 써야 지도가 흔들리지 않는다.
  const graphData = useMemo(() => {
    const prev = cache.current
    const next = new Map<string, GNode>()
    const nodes = model.fragments.map((f) => {
      const seed = hashUnit(f.id)
      const data: NodeData = {
        id: f.id,
        kind: f.kind,
        text: f.text,
        authorColor: model.colorOf(f.createdBy.uid),
        isolated: (model.linksOf.get(f.id)?.length ?? 0) === 0,
        seed,
        radius: estimateRadius(f.kind, f.kind === 'thought' ? displayThought(f.text) : f.text),
      }
      const old = prev.get(f.id)
      const node: GNode = old ? Object.assign(old, data) : { ...data }
      if (!old) {
        // 새 조각은 이어진 조각 옆에서 나타나게
        const near = (model.linksOf.get(f.id) ?? [])
          .map((l) => prev.get(otherEnd(l, f.id)))
          .find((n) => n?.x !== undefined && n?.y !== undefined)
        if (near) {
          node.x = near.x! + (seed - 0.5) * 90
          node.y = near.y! + (hashUnit(`${f.id}y`) - 0.5) * 90
        }
      }
      next.set(f.id, node)
      return node
    })
    cache.current = next

    const groupSize = new Map<string, number>()
    for (const l of model.links) groupSize.set(`${l.a}|${l.b}`, (groupSize.get(`${l.a}|${l.b}`) ?? 0) + 1)
    const seen = new Map<string, number>()
    const links: GLink[] = model.links.map((l) => {
      const pair = `${l.a}|${l.b}`
      const n = groupSize.get(pair) ?? 1
      const i = seen.get(pair) ?? 0
      seen.set(pair, i + 1)
      const who = l.createdBy.uid === meUid ? '내가' : `${escapeHtml(l.createdBy.name)}님이`
      return {
        id: l.id,
        source: l.a,
        target: l.b,
        color: model.colorOf(l.createdBy.uid),
        curvature: n === 1 ? 0 : (i - (n - 1) / 2) * 0.32,
        tip: `${who} 이은 선`,
      }
    })
    return { nodes, links }
  }, [model, meUid])

  // 선택한 조각과 그 이웃만 밝게
  const focusSet = useMemo(() => {
    if (!selectedId) return null
    const set = new Set([selectedId])
    for (const l of model.linksOf.get(selectedId) ?? []) set.add(otherEnd(l, selectedId))
    return set
  }, [model, selectedId])

  // 캔버스 크기는 감싸는 칸에 맞춘다
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const next = { w: Math.round(width), h: Math.round(height) }
      boxRef.current = next
      setBox(next)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // canvas는 웹폰트가 늦게 오면 다시 그려야 한다. 지도에 쓰인 글자만큼만 불러온다
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return
    const keywords = model.fragments.filter((f) => f.kind === 'keyword').map((f) => f.text).join('')
    const thoughts = model.fragments.filter((f) => f.kind === 'thought').map((f) => displayThought(f.text)).join('')
    let alive = true
    Promise.all([
      document.fonts.load(`400 ${KEYWORD_SIZE}px "Yeon Sung"`, keywords || '가'),
      document.fonts.load(`400 ${THOUGHT_SIZE}px "IBM Plex Sans KR"`, thoughts || '가'),
    ])
      .then(() => alive && setFontTick((t) => t + 1))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [model])

  const mounted = box.w > 0

  // 힘 조절: 조각끼리 밀어내고, 겹치지 않게
  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    fg.d3Force('charge')?.strength(-260)
    fg.d3Force('link')?.distance(90)
    fg.d3Force('collide', forceCollide<GNode>((n) => n.radius).iterations(2))
    // 아무도 잇지 않은 외딴 조각이 멀리 떠내려가지 않게 살짝 붙잡는다 (위계 없는 약한 힘)
    fg.d3Force('x', forceX<GNode>(0).strength(0.06))
    fg.d3Force('y', forceY<GNode>(0).strength(0.06))
    fg.d3ReheatSimulation()
  }, [mounted])

  useImperativeHandle(
    controlRef,
    () => ({
      focus(id, offset = { x: 0, y: 0 }) {
        const attempt = (tries: number) => {
          const fg = fgRef.current
          const node = cache.current.get(id)
          if (!fg || !node) return
          if (node.x === undefined || node.y === undefined) {
            if (tries < 10) window.setTimeout(() => attempt(tries + 1), 100)
            return
          }
          const k = Math.max(fg.zoom(), 1.5)
          fg.zoom(k, 500)
          fg.centerAt(node.x + offset.x / k, node.y + offset.y / k, 500)
        }
        attempt(0)
      },
      fit() {
        if (fgRef.current) fitView(fgRef.current, boxRef.current, 600)
      },
    }),
    [],
  )

  const drawFloor = useCallback(
    (ctx: CanvasRenderingContext2D, scale: number) => {
      const fg = fgRef.current
      if (!fg || !box.w) return
      // 무대 평면도 격자 (화면과 함께 움직인다)
      const tl = fg.screen2GraphCoords(0, 0)
      const br = fg.screen2GraphCoords(box.w, box.h)
      let step = 80
      while (step * scale < 28) step *= 2
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.035)'
      ctx.lineWidth = 1 / scale
      ctx.beginPath()
      for (let x = Math.floor(tl.x / step) * step; x <= br.x; x += step) {
        ctx.moveTo(x, tl.y)
        ctx.lineTo(x, br.y)
      }
      for (let y = Math.floor(tl.y / step) * step; y <= br.y; y += step) {
        ctx.moveTo(tl.x, y)
        ctx.lineTo(br.x, y)
      }
      ctx.stroke()
      // 선택한 조각 아래 스포트라이트
      const sel = selectedId ? cache.current.get(selectedId) : undefined
      if (sel && sel.x !== undefined && sel.y !== undefined) {
        const r = Math.max(sel.layout?.w ?? 60, sel.layout?.h ?? 30) * 0.9 + 34
        const g = ctx.createRadialGradient(sel.x, sel.y, 0, sel.x, sel.y, r)
        g.addColorStop(0, 'rgba(255,255,255,0.20)')
        g.addColorStop(0.55, 'rgba(255,255,255,0.07)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(sel.x, sel.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    },
    [box, selectedId],
  )

  const drawNode = useCallback(
    (node: GNode, ctx: CanvasRenderingContext2D) => {
      if (node.x === undefined || node.y === undefined) return
      const layout = node.kind === 'keyword' ? layoutKeyword(ctx, node, fontTick) : layoutThought(ctx, node, fontTick)
      const x = node.x - layout.w / 2
      const y = node.y - layout.h / 2
      ctx.save()
      ctx.globalAlpha = focusSet && !focusSet.has(node.id) ? 0.5 : 1
      if (node.kind === 'keyword') drawKeyword(ctx, node, layout, x, y)
      else drawThought(ctx, node, layout, x, y)
      ctx.globalAlpha = 1
      if (node.id === pickingFromId) outline(ctx, x, y, layout, true)
      else if (node.id === selectedId) outline(ctx, x, y, layout, false)
      ctx.restore()
    },
    [focusSet, selectedId, pickingFromId, fontTick],
  )

  const paintHitArea = useCallback((node: GNode, color: string, ctx: CanvasRenderingContext2D) => {
    const l = node.layout
    if (!l || node.x === undefined || node.y === undefined) return
    ctx.fillStyle = color
    ctx.fillRect(node.x - l.w / 2 - 4, node.y - l.h / 2 - 4, l.w + 8, l.h + 8)
  }, [])

  const linkColor = useCallback(
    (l: GLink) => {
      if (!selectedId) return withAlpha(l.color, 0.88)
      return endId(l.source) === selectedId || endId(l.target) === selectedId ? l.color : withAlpha(l.color, 0.12)
    },
    [selectedId],
  )
  const linkWidth = useCallback(
    (l: GLink) => (selectedId && (endId(l.source) === selectedId || endId(l.target) === selectedId) ? 4 : 2.8),
    [selectedId],
  )

  const handleEngineStop = useCallback(() => {
    if (fitted.current || !fgRef.current) return
    fitted.current = true
    fitView(fgRef.current, boxRef.current, 500)
  }, [])

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-label="조각과 연결 지도" role="img">
      {mounted && (
        <ForceGraph2D<NodeData, LinkData>
          ref={fgRef}
          width={box.w}
          height={box.h}
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          nodeId="id"
          nodeCanvasObject={drawNode}
          nodeCanvasObjectMode={() => 'replace'}
          nodePointerAreaPaint={paintHitArea}
          nodeLabel={(n) => (n.kind === 'thought' ? escapeHtml(displayThought(n.text)) : '')}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkCurvature="curvature"
          linkLabel={(l) => l.tip}
          linkHoverPrecision={6}
          onRenderFramePre={drawFloor}
          onNodeClick={(n) => onNodeClick(String(n.id))}
          onBackgroundClick={onBackgroundClick}
          onEngineStop={handleEngineStop}
          warmupTicks={30}
          cooldownTicks={160}
          d3VelocityDecay={0.35}
          minZoom={0.25}
          maxZoom={3}
        />
      )}
    </div>
  )
}

/**
 * 전체 보기: 모든 조각이 들어오게 맞추되, 조각이 적을 때 지나치게 확대하지 않는다.
 * 아래쪽은 던지기 입력창에 가리므로 조금 위로 올려 맞춘다.
 */
function fitView(fg: ForceGraphMethods<GNode, GLink>, box: { w: number; h: number }, duration: number) {
  const bb = fg.getGraphBbox()
  if (!bb || !box.w) return
  const pad = 90
  const bw = Math.max(bb.x[1] - bb.x[0], 1)
  const bh = Math.max(bb.y[1] - bb.y[0], 1)
  const k = Math.min(1.6, Math.max(0.3, Math.min((box.w - pad * 2) / bw, (box.h - pad * 2 - 80) / bh)))
  fg.zoom(k, duration)
  fg.centerAt((bb.x[0] + bb.x[1]) / 2, (bb.y[0] + bb.y[1]) / 2 + 40 / k, duration)
}

function endId(end: GLink['source']): string {
  return typeof end === 'object' && end !== null ? String(end.id) : String(end)
}

function hashUnit(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

/** 겹치지 않게 밀어낼 반지름 (글자 수로 어림) */
function estimateRadius(kind: FragmentKind, text: string): number {
  if (kind === 'keyword') return (Math.min(text.length, 30) * KEYWORD_SIZE * 0.85 + 22) / 2 + 8
  const lines = Math.min(THOUGHT_MAX_LINES, Math.ceil((text.length * THOUGHT_SIZE) / THOUGHT_MAX_W))
  return Math.max(Math.min(text.length * THOUGHT_SIZE, THOUGHT_MAX_W) / 2 + 14, (lines * THOUGHT_LINE) / 2 + 12)
}

function layoutKeyword(ctx: CanvasRenderingContext2D, node: GNode, fontTick: number): Layout {
  const key = `${node.text}|${fontTick}`
  if (node.layout?.key === key) return node.layout
  ctx.font = `400 ${KEYWORD_SIZE}px ${MARKER_FONT}`
  const layout = { key, w: ctx.measureText(node.text).width + 22, h: KEYWORD_SIZE + 12, lines: [node.text] }
  node.layout = layout
  return layout
}

function layoutThought(ctx: CanvasRenderingContext2D, node: GNode, fontTick: number): Layout {
  const key = `${node.text}|${fontTick}`
  if (node.layout?.key === key) return node.layout
  ctx.font = `400 ${THOUGHT_SIZE}px ${TYPED_FONT}`
  const lines = wrapLines(ctx, displayThought(node.text), THOUGHT_MAX_W, THOUGHT_MAX_LINES)
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width), 20)
  const layout = { key, w: textW + 24, h: lines.length * THOUGHT_LINE + 14, lines }
  node.layout = layout
  return layout
}

/** 어절 단위로 줄을 바꾸고, 한 어절이 너무 길면 글자 단위로 자른다 */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const fits = (s: string) => ctx.measureText(s).width <= maxW
  const lines: string[] = []
  let line = ''
  for (const word of text.replace(/\s+/g, ' ').trim().split(' ')) {
    const candidate = line ? `${line} ${word}` : word
    if (fits(candidate)) {
      line = candidate
      continue
    }
    if (line) lines.push(line)
    line = ''
    for (const ch of word) {
      if (line && !fits(line + ch)) {
        lines.push(line)
        line = ch
      } else line += ch
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last.length > 1 && !fits(`${last}…`)) last = last.slice(0, -1)
  kept[maxLines - 1] = `${last}…`
  return kept
}

/** 손으로 찢은 테이프: 양 끝이 들쭉날쭉 */
function tapePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  const n = 5
  const a = Math.min(2.4, h * 0.1)
  const r = (i: number) => 0.55 + 0.45 * Math.abs(Math.sin(seed * 129.898 + i * 78.233))
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  for (let i = 1; i <= n; i++) ctx.lineTo(x + w - (i % 2 ? a * r(i) : 0), y + (h * i) / n)
  ctx.lineTo(x, y + h)
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(x + (i % 2 ? a * r(i + 9) : 0), y + (h * i) / n)
  ctx.closePath()
}

function drawKeyword(ctx: CanvasRenderingContext2D, node: GNode, layout: Layout, x: number, y: number) {
  tapePath(ctx, x, y, layout.w, layout.h, node.seed)
  if (node.isolated) {
    // 외딴 조각: 아직 붙이지 않은 자리처럼 점선만
    ctx.setLineDash([3, 2.5])
    ctx.lineWidth = 1.2
    ctx.strokeStyle = withAlpha(TAPE_WHITE, 0.8)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = CHALK
  } else {
    ctx.fillStyle = TAPE_WHITE
    ctx.fill()
    ctx.fillStyle = INK
  }
  ctx.font = `400 ${KEYWORD_SIZE}px ${MARKER_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(node.text, node.x!, node.y! + 1)
}

function drawThought(ctx: CanvasRenderingContext2D, node: GNode, layout: Layout, x: number, y: number) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, layout.w, layout.h, 3)
  else ctx.rect(x, y, layout.w, layout.h)
  ctx.fillStyle = '#2b2b2f'
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = withAlpha(CHALK, node.isolated ? 0.55 : 0.2)
  if (node.isolated) ctx.setLineDash([3, 2.5])
  ctx.stroke()
  ctx.setLineDash([])
  // 쓴 사람의 색 띠
  ctx.fillStyle = node.authorColor
  ctx.fillRect(x, y, 3, layout.h)
  ctx.font = `400 ${THOUGHT_SIZE}px ${TYPED_FONT}`
  ctx.fillStyle = CHALK
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  layout.lines.forEach((line, i) => ctx.fillText(line, x + 12, y + 8 + i * THOUGHT_LINE))
}

function outline(ctx: CanvasRenderingContext2D, x: number, y: number, layout: Layout, dashed: boolean) {
  const pad = 4
  ctx.lineWidth = 1.5
  ctx.strokeStyle = '#ffffff'
  if (dashed) ctx.setLineDash([4, 3])
  ctx.strokeRect(x - pad, y - pad, layout.w + pad * 2, layout.h + pad * 2)
  ctx.setLineDash([])
}

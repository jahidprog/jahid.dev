"use client"

import * as React from "react"

/**
 * AI Engineer Lanyard Badge — a physics-driven ID badge on a printed lanyard.
 *
 * - Two strands drop from above the frame and meet at a side-release buckle;
 *   a short strap and a split ring hold the card.
 * - The strap is a verlet rope drawn as a textured ribbon on a 2D canvas.
 * - The card is real HTML turned in 3D with CSS, so both faces can hold anything.
 * - Drag the card to pull the strap taut, flick it to spin it, tap / Enter to flip.
 *
 * Fully self-contained: React is the only dependency. No Tailwind, no CSS
 * variables, no 3D library, no images. Drop it into any React / Next.js / Vite
 * project and it works. (Colour props expect #rrggbb hex strings.)
 *
 * Usage:
 *   import LanyardBadge from "./lanyard-badge"
 *   <LanyardBadge name="Jane Doe" role="ML Engineer" height="100vh" />
 */

// #region physics
/** Verlet step. `w` is inverse mass; 0 pins a point in place. */
export function integrate(pts, dt, gravity, damping) {
  for (const p of pts) {
    if (!p.w) continue
    const vx = (p.x - p.px) * damping
    const vy = (p.y - p.py) * damping
    p.px = p.x
    p.py = p.y
    p.x += vx
    p.y += vy + gravity * dt * dt
  }
}

/** Relax distance constraints, heavier points moving less. */
export function solve(pts, links, iterations) {
  for (let k = 0; k < iterations; k++) {
    for (const [i, j, rest] of links) {
      const a = pts[i]
      const b = pts[j]
      const ws = a.w + b.w
      if (!ws) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1e-6
      const f = (d - rest) / (d * ws)
      a.x += dx * f * a.w
      a.y += dy * f * a.w
      b.x -= dx * f * b.w
      b.y -= dy * f * b.w
    }
  }
}

/** The card's turn on the ring: a damped spring pulling toward `target`. */
export function spinStep(s, target, dt, drive) {
  s.v += (-(s.a - target) * 18 - s.v * 3.2 + drive) * dt
  s.a += s.v * dt
}

/** How far the card swings from hanging straight down, in radians. */
export function swingAngle(top, bottom) {
  return Math.atan2(bottom.x - top.x, bottom.y - top.y)
}
// #endregion

const MONO =
  '"JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, Menlo, Consolas, "Liberation Mono", monospace'
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
const FONT_EVENT = "lanyard-badge-fonts"

const BARS = [2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 2]

/** Rounded-rect path that works in browsers without ctx.roundRect. */
function roundRectPath(ctx, x, y, w, h, r) {
  const [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r]
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y)
  ctx.arcTo(x + w, y, x + w, y + tr, tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br)
  ctx.lineTo(x + bl, y + h)
  ctx.arcTo(x, y + h, x, y + h - bl, bl)
  ctx.lineTo(x, y + tl)
  ctx.arcTo(x, y, x + tl, y, tl)
  ctx.closePath()
}

/** A circuit-board medallion: rings, spokes, nodes and a chip in the middle. */
function drawCircuit(ctx, cx, cy, r) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.lineWidth = Math.max(0.8, r * 0.018)
  for (const k of [1, 0.78, 0.5]) {
    ctx.beginPath()
    ctx.arc(0, 0, r * k, 0, Math.PI * 2)
    ctx.stroke()
  }
  for (let i = 0; i < 12; i++) {
    ctx.save()
    ctx.rotate((i / 12) * Math.PI * 2)
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.5)
    ctx.lineTo(0, -r * 0.78)
    if (i % 2 === 0) ctx.lineTo(0, -r)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, -r * 0.78, r * 0.026, 0, Math.PI * 2)
    ctx.fill()
    if (i % 2 === 0) {
      ctx.beginPath()
      ctx.arc(0, -r, r * 0.03, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.rotate(Math.PI / 12)
    ctx.beginPath()
    ctx.rect(-r * 0.025, -r * 0.9, r * 0.05, r * 0.05)
    ctx.fill()
    ctx.restore()
  }
  ctx.beginPath()
  ctx.rect(-r * 0.14, -r * 0.14, r * 0.28, r * 0.28)
  ctx.stroke()
  ctx.beginPath()
  ctx.rect(-r * 0.06, -r * 0.06, r * 0.12, r * 0.12)
  ctx.fill()
  ctx.restore()
}

/**
 * The printed strap, `length` css px long, laid out along the canvas height so
 * each rope segment can crop its own slice. Returns a canvas in device px.
 */
function makeStrap(length, width, dpr, opts) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.round(width * dpr))
  c.height = Math.max(1, Math.round(length * dpr))
  const ctx = c.getContext("2d")
  // strap space: x runs down the strap, y runs across it
  ctx.setTransform(0, dpr, -dpr, 0, c.width, 0)
  ctx.fillStyle = opts.color
  ctx.fillRect(0, 0, length, width)
  ctx.strokeStyle = ctx.fillStyle = opts.ink

  if (!opts.plain) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, length, width)
    ctx.clip()
    ctx.textBaseline = "middle"
    const textFont = "400 " + Math.round(width * 0.42) + "px " + MONO
    const labelFont = "700 " + Math.round(width * 0.34) + "px " + MONO
    ctx.font = textFont
    const textW = ctx.measureText(opts.text).width
    ctx.font = labelFont
    const labelW = ctx.measureText(opts.label).width
    const gap = width * 0.6
    let x = width * 0.4
    let flip = 1
    while (x < length) {
      // a medallion too big for the strap, so only an arc of it shows
      ctx.globalAlpha = 0.5
      drawCircuit(ctx, x + width * 1.3, width * (0.5 + flip * 0.28), width * 1.35)
      x += width * 2.8
      ctx.globalAlpha = 0.95
      ctx.font = textFont
      ctx.fillText(opts.text, x, width * 0.52)
      x += textW + gap
      if (opts.label) {
        ctx.font = labelFont
        ctx.fillText("[ " + opts.label + " ]", x, width * 0.53)
        x += labelW + ctx.measureText("[  ]").width + gap
      }
      flip = -flip
    }
    ctx.restore()
  }

  // woven edges catch a little light
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 1.5)
  ctx.lineTo(length, 1.5)
  ctx.moveTo(0, width - 1.5)
  ctx.lineTo(length, width - 1.5)
  ctx.stroke()
  return c
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const h = (e) => setReduced(e.matches)
    if (mq.addEventListener) mq.addEventListener("change", h)
    else mq.addListener(h)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", h)
      else mq.removeListener(h)
    }
  }, [])
  return reduced
}

/** A small neural network: layers of nodes, fully connected, softly pulsing. */
function NeuralNet({ style }) {
  const layers = [3, 5, 5, 2]
  const xs = [20, 73, 127, 180]
  const nodes = layers.map((n, li) =>
    Array.from({ length: n }, (_, j) => ({ x: xs[li], y: (140 * (j + 1)) / (n + 1) })),
  )
  const edges = []
  for (let l = 0; l < nodes.length - 1; l++)
    for (const a of nodes[l]) for (const b of nodes[l + 1]) edges.push([a, b])
  let k = 0
  return (
    <svg viewBox="0 0 200 140" fill="none" stroke="currentColor" strokeWidth={0.8} style={{ maxWidth: "none", display: "block", ...style }} aria-hidden="true">
      {edges.map(([a, b], i) => (
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} opacity={0.28} />
      ))}
      {nodes.flat().map((n, i) => {
        k++
        return (
          <circle key={i} cx={n.x} cy={n.y} r={4} fill="currentColor" strokeWidth={0}>
            <animate attributeName="opacity" values="1;0.35;1" dur={2 + ((k * 0.37) % 2) + "s"} begin={((k * 0.23) % 2) + "s"} repeatCount="indefinite" />
          </circle>
        )
      })}
    </svg>
  )
}

export default function LanyardBadge({
  front,
  back,
  title = "Hello, World",
  subtitle = "LLMs · Agents · MLOps · 2026",
  name = "Jahidul Islam",
  role = "AI Engineer",
  skills = ["PyTorch", "LLMs", "RAG", "Agents"],
  badgeId = "AI-2026-0042",
  photo,
  strapText = "train → eval → ship",
  strapLabel = "AI ENGINEER",
  strapColor = "#0a0f1c",
  inkColor = "#22d3ee",
  cardColor = "#0b1324",
  accentColor = "#8b5cf6",
  textColor = "#e6f1ff",
  background = "transparent",
  flipButton = true,
  loadFonts = true,
  cardWidth = 240,
  anchorX = 0.5,
  physicsHeight = "container",
  dragLimitSelector,
  height = "100svh",
  className = "",
  style,
}) {
  const rootRef = React.useRef(null)
  const canvasRef = React.useRef(null)
  const cardRef = React.useRef(null)
  const innerRef = React.useRef(null)
  const reduced = usePrefersReducedMotion()
  const flipRef = React.useRef(() => {})
  const [showBack, setShowBack] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [btnHover, setBtnHover] = React.useState(false)
  const backRef = React.useRef(showBack)
  backRef.current = showBack

  const cw = cardWidth
  const ch = Math.round(cardWidth * 1.5)
  const ringR = Math.max(7, Math.round(cw * 0.036))
  const clipH = Math.round(cw * 0.1)

  const look = React.useRef({ strapText, strapLabel, strapColor, inkColor })
  look.current = { strapText, strapLabel, strapColor, inkColor }
  const lookKey = [strapText, strapLabel, strapColor, inkColor].join("|")

  // load the monospace font once; the strap print is redrawn when it arrives
  React.useEffect(() => {
    if (!loadFonts || typeof document === "undefined") return
    const id = "lanyard-badge-font"
    if (document.getElementById(id)) return
    const l = document.createElement("link")
    l.id = id
    l.rel = "stylesheet"
    l.href = FONT_HREF
    l.addEventListener("load", () => window.dispatchEvent(new Event(FONT_EVENT)))
    document.head.appendChild(l)
  }, [loadFonts])

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const card = cardRef.current
    const inner = innerRef.current
    const ctx = canvas && canvas.getContext("2d")
    if (!root || !canvas || !card || !inner || !ctx) return

    const STEP = 1 / 120
    const GRAVITY = 2400
    const ITER = 18

    const sw = Math.max(14, Math.round(cw * 0.1)) // strap width
    const lowLen = sw * 2.2 // buckle to ring
    const arm = ringR * 2 + clipH + ch * 0.55 // ring to the card's centre of mass
    const N = 14

    let alive = true
    let pts = []
    let links = []
    let left = []
    let right = []
    let low = []
    let iB = 0
    let iT = 0
    let iC = 0
    let strandRest = 1
    let dpr = 1
    let W = 1
    let H = 1
    let rootLeft = 0
    let rootTop = 0
    let strapTex = null
    let plainTex = null
    const spin = { a: 0, v: 0 }
    let spinTarget = backRef.current ? Math.PI : 0
    spin.a = spinTarget

    const add = (x, y, w) => {
      pts.push({ x, y, px: x, py: y, w })
      return pts.length - 1
    }
    const strand = (from, to, n, slack) => {
      const a = pts[from]
      const b = pts[to]
      const rest = (Math.hypot(b.x - a.x, b.y - a.y) * slack) / n
      const ids = [from]
      for (let i = 1; i < n; i++) ids.push(add(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n, 1))
      ids.push(to)
      for (let i = 0; i < n; i++) links.push([ids[i], ids[i + 1], rest])
      return { ids, rest }
    }

    const makeTextures = () => {
      const c = look.current
      const opts = { color: c.strapColor, ink: c.inkColor, text: c.strapText, label: c.strapLabel }
      strapTex = makeStrap(strandRest * N + 4, sw, dpr, opts)
      plainTex = makeStrap(lowLen + 4, sw * 0.8, dpr, { ...opts, plain: true })
    }

    const build = (preserveMotion = false) => {
      const previousPoints = preserveMotion ? pts.map((p) => ({ ...p })) : null
      const previousW = W
      const previousRootLeft = rootLeft
      const previousRootTop = rootTop
      const previousCenter =
        previousW >= 1024
          ? previousW * anchorX
          : previousW * (0.5 + (anchorX - 0.5) * Math.max(0, Math.min(1, (previousW - 640) / 384)))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = Math.max(1, root.clientWidth)
      H = Math.max(1, root.clientHeight)
      const rootRect = root.getBoundingClientRect()
      rootLeft = rootRect.left
      rootTop = rootRect.top
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)

      let referenceHeight = H
      if (physicsHeight === "responsive") {
        referenceHeight =
          window.innerWidth < 1024 ? 620 : Math.min(820, window.innerHeight * 0.9)
      } else if (physicsHeight === "viewport") {
        referenceHeight = Math.min(820, window.innerHeight * 0.9)
      } else if (typeof physicsHeight === "number") {
        referenceHeight = physicsHeight
      }
      const hangH = Math.max(1, Math.min(H, referenceHeight))

      pts = []
      links = []
      const anchorBlend = Math.max(0, Math.min(1, (W - 640) / 384))
      const cx = W * (0.5 + (anchorX - 0.5) * anchorBlend)
      const spread = Math.min(W * 0.16, cw * 0.55)
      const top = -sw * 2
      // hang the buckle so the whole card fits, but never above a sixth of the frame
      const bY = Math.max(hangH * 0.16, Math.min(hangH * 0.42, hangH - (lowLen + ringR * 2 + clipH + ch) - 28))

      const aL = add(cx - spread, top, 0)
      iB = add(cx, bY, 1.4)
      const l = strand(aL, iB, N, 1.03)
      const aR = add(cx + spread, top, 0)
      const r = strand(aR, iB, N, 1.03)
      iT = add(cx, bY + lowLen, 0.8)
      const lo = strand(iB, iT, 3, 1)
      iC = add(cx, bY + lowLen + arm, 0.25)
      links.push([iT, iC, arm])
      left = l.ids
      right = r.ids
      low = lo.ids
      strandRest = l.rest

      makeTextures()

      if (previousPoints && previousPoints.length === pts.length) {
        const dx = cx - previousCenter + previousRootLeft - rootLeft
        const dy = previousRootTop - rootTop
        const fixedAnchors = new Set([left[0], right[0]])
        pts = pts.map((point, index) => {
          if (fixedAnchors.has(index)) {
            return { ...point, y: point.y + dy, py: point.py + dy }
          }
          const previous = previousPoints[index]
          return {
            ...point,
            x: previous.x + dx,
            px: previous.px + dx,
            y: previous.y + dy,
            py: previous.py + dy,
            w: previous.w,
          }
        })
        if (drag) {
          drag.tx += dx
          drag.ty += dy
          drag.sx = drag.clientX - rootLeft
          drag.sy = drag.clientY - rootTop
          drag.moved = true
          drag.ox = drag.tx - drag.sx
          drag.oy = drag.ty - drag.sy
        }
      }

      if (reduced && !previousPoints) {
        for (let i = 0; i < 900; i++) {
          integrate(pts, STEP, GRAVITY, 0.98)
          solve(pts, links, ITER)
        }
      } else if (!previousPoints) {
        // enter mid-swing, as if someone just let go of it
        pts[iC].x += cw * 0.55
        pts[iC].px = pts[iC].x - 2
        spin.v = 5
      }
    }

    // ---- drawing ---------------------------------------------------------
    const ribbon = (ids, tex, rest, light) => {
      const Wt = tex.width
      for (let i = 0; i < ids.length - 1; i++) {
        const a = pts[ids[i]]
        const b = pts[ids[i + 1]]
        const dx = (b.x - a.x) * dpr
        const dy = (b.y - a.y) * dpr
        const len = Math.hypot(dx, dy) || 1e-6
        const tx = dx / len
        const ty = dy / len
        const nx = ty
        const ny = -tx
        const v0 = i * rest * dpr
        const dv = rest * dpr
        const k = len / dv
        ctx.setTransform(nx, ny, tx * k, ty * k, a.x * dpr - (nx * Wt) / 2 - tx * k * v0, a.y * dpr - (ny * Wt) / 2 - ty * k * v0)
        // +1.5 overlaps the next slice, so bends never show a hairline seam
        const src = Math.min(dv + 1.5, tex.height - v0)
        if (src > 0) ctx.drawImage(tex, 0, v0, Wt, src, 0, v0, Wt, src)
        // a strand turned away from the light reads darker, which sells the 3D
        const shade = 0.22 * (1 - Math.max(0, nx * light))
        ctx.fillStyle = "rgba(0,0,0," + shade.toFixed(3) + ")"
        ctx.fillRect(0, v0, Wt, dv + 1)
      }
    }

    const metal = (x0, y0, x1, y1) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1)
      g.addColorStop(0, "#e8eef5")
      g.addColorStop(0.45, "#9aa7b8")
      g.addColorStop(0.55, "#6b7686")
      g.addColorStop(1, "#dfe7f0")
      return g
    }

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (!strapTex || !plainTex) return
      ctx.imageSmoothingEnabled = true
      ribbon(left, strapTex, strandRest, -1)
      ribbon(right, strapTex, strandRest, 1)
      ribbon(low, plainTex, lowLen / 3, 0)

      // side-release buckle, turned to follow the short strap
      const B = pts[iB]
      const T = pts[iT]
      const ang = Math.atan2(T.x - B.x, T.y - B.y)
      const u = sw / 20
      ctx.setTransform(dpr, 0, 0, dpr, B.x * dpr, B.y * dpr)
      ctx.rotate(-ang)
      ctx.shadowColor = "rgba(0,0,0,0.45)"
      ctx.shadowBlur = 6 * dpr
      ctx.shadowOffsetY = 2 * dpr
      ctx.fillStyle = metal(-16 * u, 0, 16 * u, 0)
      ctx.beginPath()
      roundRectPath(ctx, -15 * u, -14 * u, 30 * u, 17 * u, 3 * u)
      ctx.fill()
      ctx.beginPath()
      roundRectPath(ctx, -11 * u, 1 * u, 22 * u, 15 * u, [2 * u, 2 * u, 6 * u, 6 * u])
      ctx.fill()
      ctx.shadowColor = "transparent"
      ctx.fillStyle = "rgba(20,28,40,0.6)"
      ctx.fillRect(-10 * u, -9 * u, 20 * u, 2.2 * u)
      ctx.fillRect(-5 * u, 6 * u, 10 * u, 3 * u)
      ctx.strokeStyle = "rgba(255,255,255,0.6)"
      ctx.lineWidth = 0.8 * u
      ctx.beginPath()
      ctx.moveTo(-13 * u, -12.5 * u)
      ctx.lineTo(13 * u, -12.5 * u)
      ctx.stroke()

      // split ring
      ctx.setTransform(dpr, 0, 0, dpr, T.x * dpr, (T.y + ringR * 0.8) * dpr)
      ctx.lineWidth = Math.max(2.5, ringR * 0.38)
      ctx.strokeStyle = metal(-ringR, -ringR, ringR, ringR)
      ctx.beginPath()
      ctx.arc(0, 0, ringR, 0, Math.PI * 2)
      ctx.stroke()
    }

    const place = () => {
      const T = pts[iT]
      const C = pts[iC]
      const swing = swingAngle(T, C)
      card.style.transform =
        "translate3d(" + (T.x - cw / 2).toFixed(2) + "px," + (T.y + ringR).toFixed(2) + "px,0) rotate(" + (-swing).toFixed(4) + "rad)"
      inner.style.transform = "perspective(1100px) rotateY(" + spin.a.toFixed(4) + "rad)"
      const edge = 1 - Math.abs(Math.cos(spin.a))
      inner.style.setProperty("--lyd-dim", (edge * 0.5).toFixed(3))
      inner.style.setProperty("--lyd-shine", (50 + Math.sin(spin.a) * 70 + swing * 90).toFixed(1) + "%")
    }

    // ---- interaction -----------------------------------------------------
    let drag = null
    const local = (e) => {
      const r = root.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const clampDragTarget = (x, y) => {
      const rootRect = root.getBoundingClientRect()
      const minX = cw / 2
      const maxX = Math.max(minX, W - cw / 2)
      const cardBottomOffset = ringR + Math.hypot(cw, ch) / 2
      let maxY = H - cardBottomOffset

      if (dragLimitSelector) {
        const limitSection = document.querySelector(dragLimitSelector)
        if (limitSection) {
          const sectionRect = limitSection.getBoundingClientRect()
          const sectionMidpoint = (sectionRect.top + sectionRect.bottom) / 2
          maxY = Math.min(maxY, sectionMidpoint - rootRect.top - cardBottomOffset)
        }
      }

      return [
        Math.min(maxX, Math.max(minX, x)),
        Math.min(Math.max(0, maxY), Math.max(0, y)),
      ]
    }
    const flip = () => {
      spinTarget = spinTarget === 0 ? Math.PI : 0
      setShowBack(spinTarget !== 0)
    }
    flipRef.current = flip
    const onDown = (e) => {
      if (e.button > 0) return
      const [x, y] = local(e)
      const T = pts[iT]
      const [tx, ty] = clampDragTarget(T.x, T.y)
      drag = {
        id: e.pointerId,
        ox: tx - x,
        oy: ty - y,
        tx,
        ty,
        sx: x,
        sy: y,
        clientX: e.clientX,
        clientY: e.clientY,
        moved: false,
      }
      pts[iT].w = 0
      card.setPointerCapture(e.pointerId)
      card.style.cursor = "grabbing"
    }
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const [x, y] = local(e)
      const [tx, ty] = clampDragTarget(x + drag.ox, y + drag.oy)
      drag.tx = tx
      drag.ty = ty
      drag.clientX = e.clientX
      drag.clientY = e.clientY
      if (Math.hypot(x - drag.sx, y - drag.sy) > 5) drag.moved = true
    }
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      if (!drag.moved) flip()
      drag = null
      pts[iT].w = 0.8
      card.style.cursor = "grab"
    }
    card.addEventListener("pointerdown", onDown)
    card.addEventListener("pointermove", onMove)
    card.addEventListener("pointerup", onUp)
    card.addEventListener("pointercancel", onUp)

    // ---- loop --------------------------------------------------------------
    let raf = 0
    let acc = 0
    let last = performance.now()
    let t = 0
    const tick = (now) => {
      acc += Math.min(0.05, (now - last) / 1000)
      last = now
      let steps = 0
      while (acc >= STEP && steps < 8) {
        acc -= STEP
        steps++
        t += STEP
        if (drag) {
          const T = pts[iT]
          T.px = T.x
          T.py = T.y
          T.x += (drag.tx - T.x) * 0.35
          T.y += (drag.ty - T.y) * 0.35
        }
        const C = pts[iC]
        if (!reduced && !drag) {
          // a draught in the room, so the badge is never perfectly still
          C.x += (22 * Math.sin(t * 0.7) + 12 * Math.sin(t * 1.9)) * STEP * STEP
        }
        integrate(pts, STEP, GRAVITY, 0.992)
        solve(pts, links, ITER)
        const vx = (C.x - C.px) / STEP
        spinStep(spin, spinTarget, STEP, vx * 0.03 + (reduced ? 0 : 0.6 * Math.sin(t * 0.5)))
      }
      draw()
      place()
      raf = requestAnimationFrame(tick)
    }
    build()
    draw()
    place()
    raf = requestAnimationFrame(tick)

    // redraw the strap print once the web font is really available
    const refreshFonts = () => {
      if (!document.fonts || !document.fonts.load) return
      Promise.all([
        document.fonts.load('400 12px "JetBrains Mono"'),
        document.fonts.load('700 12px "JetBrains Mono"'),
      ])
        .then(() => {
          if (alive && strandRest > 1) makeTextures()
        })
        .catch(() => {})
    }
    refreshFonts()
    window.addEventListener(FONT_EVENT, refreshFonts)

    let observer = null
    let resizeFrame = 0
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        if (Math.abs(root.clientWidth - W) < 1 && Math.abs(root.clientHeight - H) < 1) return
        if (resizeFrame) return
        resizeFrame = requestAnimationFrame(() => {
          resizeFrame = 0
          if (!alive) return
          if (Math.abs(root.clientWidth - W) < 1 && Math.abs(root.clientHeight - H) < 1) return
          build(true)
          if (drag) {
            const [tx, ty] = clampDragTarget(drag.tx, drag.ty)
            drag.tx = tx
            drag.ty = ty
            drag.ox = tx - (drag.clientX - rootLeft)
            drag.oy = ty - (drag.clientY - rootTop)
          }
          draw()
          place()
        })
      })
      observer.observe(root)
    }

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      if (observer) observer.disconnect()
      window.removeEventListener(FONT_EVENT, refreshFonts)
      card.removeEventListener("pointerdown", onDown)
      card.removeEventListener("pointermove", onMove)
      card.removeEventListener("pointerup", onUp)
      card.removeEventListener("pointercancel", onUp)
    }
  }, [reduced, cw, ch, ringR, clipH, lookKey, anchorX, physicsHeight, dragLimitSelector])

  // ---- card faces ----------------------------------------------------------
  const face = {
    position: "absolute",
    inset: 0,
    borderRadius: cw * 0.06,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    boxShadow: "0 18px 40px -12px rgba(0,0,0,0.6), 0 0 36px -10px " + inkColor + "55",
  }
  const shade = (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderRadius: cw * 0.06,
        boxShadow: focused ? "inset 0 0 0 2px " + inkColor : "inset 0 0 0 1px " + inkColor + "40",
        background:
          "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.16) 50%, transparent 65%) var(--lyd-shine, 50%) 0 / 250% 100% no-repeat, rgba(0,0,0,var(--lyd-dim, 0))",
      }}
    />
  )
  const slot = (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: cw * 0.05,
        left: "50%",
        width: cw * 0.2,
        height: cw * 0.035,
        transform: "translateX(-50%)",
        borderRadius: 999,
        background: "rgba(0,0,0,0.55)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.8), 0 0 0 1px " + inkColor + "22",
      }}
    />
  )
  const s = cw / 240 // built-in faces are laid out at 240px and scale with the card
  const abs = { position: "absolute" }

  // front with a portrait: a cutout PNG/WebP (URL or data URI) standing on the card
  const photoFront = (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        color: inkColor,
        fontFamily: MONO,
        background: "radial-gradient(120% 70% at 85% 0%, " + accentColor + "40, transparent 60%), " + cardColor,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          ...abs,
          inset: 0,
          backgroundImage:
            "linear-gradient(" + inkColor + "12 1px, transparent 1px), linear-gradient(90deg, " + inkColor + "12 1px, transparent 1px)",
          backgroundSize: 16 * s + "px " + 16 * s + "px",
        }}
      />
      <NeuralNet style={{ ...abs, left: 10 * s, top: 96 * s, width: 220 * s, color: inkColor, opacity: 0.28 }} />
      <div
        aria-hidden="true"
        style={{
          ...abs,
          left: "50%",
          top: 120 * s,
          width: 190 * s,
          height: 190 * s,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle, " + inkColor + "55, transparent 68%)",
        }}
      />
      <div style={{ ...abs, left: 22 * s, top: 34 * s, right: 22 * s }}>
        <div style={{ fontWeight: 700, fontSize: 25 * s, lineHeight: 1, textTransform: "uppercase", color: textColor, letterSpacing: "-0.02em" }}>
          {title}
        </div>
        <div style={{ fontSize: 6.5 * s, marginTop: 8 * s, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.9 }}>
          {subtitle}
        </div>
      </div>
      <div style={{ ...abs, left: 0, right: 0, top: 84 * s, bottom: 0, overflow: "hidden" }}>
        <img
          src={photo}
          alt={name}
          draggable={false}
          style={{
            ...abs,
            left: "50%",
            top: 0,
            width: 205 * s,
            height: "auto",
            maxWidth: "none",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            userSelect: "none",
            filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.5))",
          }}
        />
      </div>
      <div
        style={{
          ...abs,
          left: 0,
          right: 0,
          bottom: 0,
          padding: 40 * s + "px " + 18 * s + "px " + 16 * s + "px",
          background: "linear-gradient(to top, " + cardColor + " 45%, " + cardColor + "cc 70%, transparent)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14 * s, lineHeight: 1.1, textTransform: "uppercase", color: textColor, letterSpacing: "-0.01em" }}>{name}</div>
        <div style={{ fontSize: 6.5 * s, marginTop: 3 * s, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.9 }}>{role}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 * s, paddingTop: 6 * s, borderTop: "1px solid " + inkColor + "33", fontSize: 6 * s }}>
          <span>
            <span style={{ color: "#34d399" }}>●</span> ONLINE
          </span>
          <span>ID {badgeId}</span>
        </div>
      </div>
    </div>
  )

  const defaultFront = (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        color: inkColor,
        fontFamily: MONO,
        background: "radial-gradient(120% 70% at 85% 0%, " + accentColor + "40, transparent 60%), " + cardColor,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          ...abs,
          inset: 0,
          backgroundImage:
            "linear-gradient(" + inkColor + "12 1px, transparent 1px), linear-gradient(90deg, " + inkColor + "12 1px, transparent 1px)",
          backgroundSize: 16 * s + "px " + 16 * s + "px",
        }}
      />
      <div style={{ ...abs, left: 22 * s, top: 34 * s, right: 22 * s }}>
        <div style={{ fontWeight: 700, fontSize: 25 * s, lineHeight: 1, textTransform: "uppercase", color: textColor, letterSpacing: "-0.02em" }}>
          {title}
        </div>
        <div style={{ fontSize: 6.5 * s, marginTop: 8 * s, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.9 }}>
          {subtitle}
        </div>
      </div>
      <NeuralNet style={{ ...abs, left: 20 * s, top: 118 * s, width: 200 * s, color: inkColor }} />
      <div
        style={{
          ...abs,
          left: 18 * s,
          right: 18 * s,
          bottom: 20 * s,
          padding: 9 * s,
          borderRadius: 6 * s,
          background: "rgba(0,0,0,0.38)",
          border: "1px solid " + inkColor + "33",
          fontSize: 6.5 * s,
          lineHeight: 1.7,
          color: textColor,
        }}
      >
        <div>
          <span style={{ color: accentColor }}>$</span> python train.py --epochs 100
        </div>
        <div style={{ opacity: 0.75 }}>loss: 0.0042 · acc: 99.1%</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 * s, color: inkColor }}>
          <span>
            <span style={{ color: "#34d399" }}>●</span> ONLINE
          </span>
          <span>ID {badgeId}</span>
        </div>
      </div>
    </div>
  )

  const defaultBack = (
    <div style={{ position: "relative", width: "100%", height: "100%", fontFamily: MONO, background: cardColor, color: textColor }}>
      <div
        aria-hidden="true"
        style={{
          ...abs,
          inset: 0,
          backgroundImage:
            "linear-gradient(" + inkColor + "10 1px, transparent 1px), linear-gradient(90deg, " + inkColor + "10 1px, transparent 1px)",
          backgroundSize: 16 * s + "px " + 16 * s + "px",
        }}
      />
      <NeuralNet style={{ ...abs, width: 160 * s, right: -34 * s, top: 24 * s, color: inkColor, opacity: 0.3 }} />
      <div style={{ ...abs, left: 22 * s, right: 22 * s, top: 62 * s }}>
        <div style={{ fontSize: 6.5 * s, letterSpacing: "0.16em", color: inkColor }}>{"// AUTHORIZED PERSONNEL"}</div>
        <div style={{ width: 16 * s, height: 2 * s, background: accentColor, margin: 12 * s + "px 0 " + 9 * s + "px" }} />
        <div style={{ fontWeight: 700, fontSize: 17 * s, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "-0.02em" }}>{name}</div>
        <div style={{ fontSize: 7 * s, marginTop: 4 * s, letterSpacing: "0.1em", textTransform: "uppercase", color: inkColor, opacity: 0.85 }}>{role}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 * s, marginTop: 12 * s }}>
          {skills.map((sk) => (
            <span
              key={sk}
              style={{
                fontSize: 6 * s,
                padding: 2.5 * s + "px " + 6 * s + "px",
                borderRadius: 999,
                border: "1px solid " + inkColor + "66",
                color: inkColor,
                background: inkColor + "10",
              }}
            >
              {sk}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          ...abs,
          left: 0,
          right: 0,
          bottom: 0,
          height: "38%",
          overflow: "hidden",
          background: "linear-gradient(160deg, " + accentColor + " 0%, #1e1b4b 125%)",
          borderTopLeftRadius: 40 * s,
          color: "#fff",
        }}
      >
        <div style={{ ...abs, left: 22 * s, top: 22 * s, display: "flex", alignItems: "stretch", gap: 1.5 * s, height: 30 * s }}>
          {BARS.map((b, i) => (
            <div key={i} style={{ width: b * 1.2 * s, background: "rgba(255,255,255,0.88)" }} />
          ))}
        </div>
        <div style={{ ...abs, left: 22 * s, top: 60 * s, fontSize: 6.5 * s, letterSpacing: "0.14em", opacity: 0.9 }}>
          {"ID · " + badgeId}
        </div>
        <div style={{ ...abs, left: 22 * s, top: 74 * s, fontSize: 5.5 * s, letterSpacing: "0.14em", opacity: 0.6 }}>
          SCAN TO VERIFY
        </div>
      </div>
    </div>
  )

  const rootHeight =
    typeof CSS !== "undefined" && CSS.supports && !CSS.supports("height", height) ? "100vh" : height

  return (
    <section
      ref={rootRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: rootHeight,
        overflow: "hidden",
        background,
        boxSizing: "border-box",
        userSelect: "none",
        WebkitUserSelect: "none",
        isolation: "isolate",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", display: "block", pointerEvents: "none" }}
      />
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-label="Badge. Drag to swing, press to flip."
        aria-pressed={showBack}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            flipRef.current()
          }
        }}
        onFocus={(e) => setFocused(!!(e.target.matches && e.target.matches(":focus-visible")))}
        onBlur={() => setFocused(false)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: cw,
          height: ch + ringR + clipH,
          transformOrigin: "50% 0",
          cursor: "grab",
          touchAction: "none",
          willChange: "transform",
          outline: "none",
        }}
      >
        {/* badge clip: hooks the ring, bites the card */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: cw * 0.075,
            height: clipH + cw * 0.05,
            transform: "translateX(-50%)",
            borderRadius: cw * 0.02,
            background: "linear-gradient(90deg, #e8eef5, #8a97a8 50%, #dfe7f0)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
            zIndex: 2,
          }}
        />
        <div
          ref={innerRef}
          style={{ position: "absolute", left: 0, right: 0, top: ringR + clipH * 0.6, height: ch, transformStyle: "preserve-3d" }}
        >
          <div style={face}>
            {front || (photo ? photoFront : defaultFront)}
            {slot}
            {shade}
          </div>
          <div style={{ ...face, transform: "rotateY(180deg)" }}>
            {back || defaultBack}
            {slot}
            {shade}
          </div>
        </div>
      </div>
      {flipButton && (
        <button
          type="button"
          onClick={() => flipRef.current()}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          aria-pressed={showBack}
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            zIndex: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid " + inkColor + (btnHover ? "aa" : "55"),
            background: btnHover ? inkColor + "22" : "rgba(8,12,24,0.72)",
            color: inkColor,
            fontFamily: MONO,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.2,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ transition: reduced ? "none" : "transform 0.5s", transform: showBack ? "scaleX(-1)" : "none" }}
          >
            <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          {showBack ? "Show front" : "Show back"}
        </button>
      )}
    </section>
  )
}

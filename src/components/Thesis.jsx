import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '../config'
import { useSiteTheme } from './useSiteTheme.jsx'

/*
  Light-only research section (same palette, fonts and background as Hero /
  About / Projects).

  Uses siteConfig.thesis: title, institution, year, abstract, tech[], highlights[]
  Optional extras:
    thesis.poster -> poster image URL   (default: /images/thesis-poster.png)
    thesis.pdf    -> link to the paper / PDF, shows a "Read the paper" button

  What's dynamic:
    - blocks reveal on scroll, highlights stagger in
    - poster tile tilts toward the pointer with a glare
    - poster lightbox: Esc / click outside to close, click the image to zoom
    - long abstracts collapse with a "Read full abstract" toggle
  Motion is reduced for visitors who prefer reduced motion.
*/

const POSTER_FALLBACK = '/images/thesis-poster.png'

/* ---------- hooks ---------- */
function useReducedMotion() {
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  return reduce
}

function useInView(ref, reduce, threshold = 0.15) {
  const [seen, setSeen] = useState(reduce)
  useEffect(() => {
    if (reduce || seen || !ref.current) return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref, reduce, seen, threshold])
  return seen
}

function Reveal({ children, delay = 0, className = '', reduce }) {
  const ref = useRef(null)
  const seen = useInView(ref, reduce)
  return (
    <div ref={ref} data-in={seen ? '1' : '0'} className={`th-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/* ---------- lightbox ---------- */
function PosterLightbox({ src, alt, onClose }) {
  const closeRef = useRef(null)
  const [zoom, setZoom] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  const onImgMove = (e) => {
    if (!zoom) return
    const r = e.currentTarget.getBoundingClientRect()
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
  }

  const onImgClick = (e) => {
    e.stopPropagation()
    const r = e.currentTarget.getBoundingClientRect()
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
    setZoom((z) => !z)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thesis poster"
      className="th-lightbox fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close poster"
        className="th-close absolute right-5 top-5 rounded-lg px-4 py-2 font-data text-sm"
      >
        Close ×
      </button>
      <p className="font-data absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/60">
        {zoom ? 'Move to pan · click to zoom out' : 'Click the poster to zoom in'}
      </p>
      <div className="max-h-[86vh] max-w-full overflow-hidden rounded-xl shadow-2xl">
        <img
          src={src}
          alt={alt}
          onClick={onImgClick}
          onPointerMove={onImgMove}
          className="th-lightbox-img max-h-[86vh] max-w-full object-contain"
          style={{
            transform: zoom ? 'scale(2.2)' : 'scale(1)',
            transformOrigin: origin,
            cursor: zoom ? 'zoom-out' : 'zoom-in',
          }}
        />
      </div>
    </div>
  )
}

/* ---------- main ---------- */
export default function Thesis() {
  const reduce = useReducedMotion()
  const siteTheme = useSiteTheme()
  const thesis = siteConfig.thesis
  const [posterOpen, setPosterOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const posterRef = useRef(null)

  if (!thesis) return null

  const poster = thesis.poster || POSTER_FALLBACK
  const highlights = thesis.highlights || []
  const tech = thesis.tech || []
  const longAbstract = (thesis.abstract || '').length > 420

  const onPosterMove = (e) => {
    if (reduce || e.pointerType === 'touch' || !posterRef.current) return
    const el = posterRef.current
    const r = el.getBoundingClientRect()
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
    el.style.setProperty('--ry', `${((px - 0.5) * 8).toFixed(2)}deg`)
    el.style.setProperty('--rx', `${((0.5 - py) * 6).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
    el.dataset.hover = '1'
  }

  const onPosterLeave = () => {
    const el = posterRef.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.dataset.hover = '0'
  }

  return (
    <>
      {posterOpen && (
        <PosterLightbox
          src={poster}
          alt={`${thesis.title} research poster`}
          onClose={() => setPosterOpen(false)}
        />
      )}

      <section id="thesis" data-hero-theme={siteTheme.dark ? 'dark' : 'light'} className="th-root relative overflow-hidden py-24 sm:py-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="th-glow absolute inset-0" />
          <div className="th-grid absolute inset-0" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          {/* ===== Header ===== */}
          <Reveal reduce={reduce}>
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="space-y-6">
                <div className="th-pill inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-data text-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="th-ping absolute inline-flex h-full w-full rounded-full opacity-60" />
                    <span className="th-dot relative inline-flex h-2 w-2 rounded-full" />
                  </span>
                  research
                </div>
                <h2 className="th-text font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                  A question
                  <br />
                  worth studying.
                </h2>
              </div>
              <span className="th-pill self-start rounded-md px-4 py-2 font-data text-xs md:self-auto">
                B.Sc. thesis{thesis.year ? ` · ${thesis.year}` : ''}
              </span>
            </div>
          </Reveal>

          {/* ===== Main ===== */}
          <div className="mt-14 grid gap-6 lg:grid-cols-12">
            {/* paper */}
            <Reveal reduce={reduce} delay={80} className="lg:col-span-7">
              <article className="th-card h-full rounded-3xl p-7 sm:p-10">
                {thesis.institution && <p className="th-muted font-data text-xs">{thesis.institution}</p>}
                <h3 className="th-text font-display mt-3 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
                  {thesis.title}
                </h3>

                <div className="mt-6">
                  <p
                    id="th-abstract"
                    className={`th-muted leading-7 ${longAbstract && !expanded ? 'line-clamp-5' : ''}`}
                  >
                    {thesis.abstract}
                  </p>
                  {longAbstract && (
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      aria-expanded={expanded}
                      aria-controls="th-abstract"
                      className="th-link mt-3 font-data text-xs font-medium"
                    >
                      {expanded ? 'Show less' : 'Read full abstract'}
                    </button>
                  )}
                </div>

                {tech.length > 0 && (
                  <div className="mt-8">
                    <p className="th-muted mb-3 font-data text-xs">methods & tools</p>
                    <ul className="flex flex-wrap gap-2">
                      {tech.map((item) => (
                        <li key={item} className="th-chip rounded-md px-3 py-1 font-data text-xs">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {thesis.pdf && (
                  <a
                    href={thesis.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="th-btn-primary mt-9 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold"
                  >
                    Read the paper
                    <svg className="th-ico h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </a>
                )}
              </article>
            </Reveal>

            {/* highlights + poster */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              {highlights.length > 0 && (
                <Reveal reduce={reduce} delay={160}>
                  <div className="th-card rounded-3xl p-6 sm:p-8">
                    <p className="th-muted font-data text-xs">research highlights</p>
                    <ul className="mt-5 space-y-4">
                      {highlights.map((h, i) => (
                        <li
                          key={i}
                          className="th-hl flex gap-4"
                          style={{ '--i': i }}
                        >
                          <span aria-hidden="true" className="th-hl-bar mt-1 w-[3px] shrink-0 self-stretch rounded-full" />
                          <p className="th-text2 text-[0.95rem] font-medium leading-6">{h}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              <Reveal reduce={reduce} delay={240}>
                <button
                  type="button"
                  ref={posterRef}
                  data-hover="0"
                  onClick={() => setPosterOpen(true)}
                  onPointerMove={onPosterMove}
                  onPointerLeave={onPosterLeave}
                  aria-label="Open the research poster"
                  className="th-poster group relative block w-full overflow-hidden rounded-3xl text-left"
                >
                  <img
                    src={poster}
                    alt={`${thesis.title} research poster preview`}
                    loading="lazy"
                    className="th-poster-img h-56 w-full object-cover object-top sm:h-64"
                  />
                  <span aria-hidden="true" className="th-poster-shade absolute inset-0" />
                  <span aria-hidden="true" className="th-glare pointer-events-none absolute inset-0" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                    <span>
                      <span className="font-data block text-[11px] text-white/70">research poster</span>
                      <span className="font-display text-lg font-extrabold">Explore the poster</span>
                    </span>
                    <span className="th-expand flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7" />
                      </svg>
                    </span>
                  </span>
                </button>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}

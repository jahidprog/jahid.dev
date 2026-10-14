import { useEffect, useMemo, useRef, useState } from 'react'
import { siteConfig } from '../config'
import { useSiteTheme } from './useSiteTheme.jsx'

/*
  Shares Hero.jsx's palette, fonts, accent and theme hook, but has its own layout.

  What's dynamic here:
    - sections reveal as they scroll into view
    - the bio text lights up word by word while you scroll through it
    - stat numbers count up once visible
    - tiles have a pointer-following spotlight
    - the skill explorer filters by group with a staggered chip animation
    - a slow marquee strip (pauses on hover)
  All motion is disabled when the visitor prefers reduced motion.

  Theming: follows your dark/white toggle via useSiteTheme().
  Or pass it directly: <About theme={isDark ? 'dark' : 'light'} />
*/

const GROUPS = [
  { id: 'ai', label: 'AI / ML', items: ['NLP', 'Computer Vision', 'Multimodal Learning', 'LLMs', 'RAG', 'Generative AI', 'Agentic AI'] },
  { id: 'data', label: 'Data & retrieval', items: ['Vector Databases', 'PostgreSQL', 'MySQL'] },
  { id: 'eng', label: 'Engineering', items: ['Python', 'Go', 'JavaScript', 'React', 'Node.js', 'Git'] },
]
const ALL_ITEMS = GROUPS.flatMap((g) => g.items)
const TRAITS = ['Research-minded', 'Backend foundations', 'Community-driven']
const MARQUEE = [...TRAITS, ...ALL_ITEMS]

/* ---------- hooks ---------- */
function useReducedMotion() {
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  return reduce
}

function useInView(ref, reduce, threshold = 0.2) {
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

function useCountUp(target, active, reduce, duration = 1200) {
  const [value, setValue] = useState(reduce ? target : 0)
  useEffect(() => {
    if (reduce) {
      setValue(target)
      return undefined
    }
    if (!active) return undefined
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, reduce, duration])
  return value
}

/* ---------- small building blocks ---------- */
function Reveal({ children, delay = 0, className = '', reduce }) {
  const ref = useRef(null)
  const seen = useInView(ref, reduce, 0.15)
  return (
    <div
      ref={ref}
      className={`ab-reveal ${className}`}
      data-in={seen ? '1' : '0'}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function Tile({ children, className = '', reduce }) {
  const onMove = (e) => {
    if (reduce || e.pointerType === 'touch') return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div className={`ab-tile relative overflow-hidden rounded-3xl ${className}`} onPointerMove={onMove}>
      <div aria-hidden="true" className="ab-spot pointer-events-none absolute inset-0" />
      <div className="relative">{children}</div>
    </div>
  )
}

function Stat({ label, value, active, reduce, delay }) {
  const n = useCountUp(value, active, reduce)
  return (
    <div className="ab-stat flex items-end justify-between gap-4 py-5" style={{ '--d': `${delay}ms` }}>
      <div>
        <p className="ab-muted font-data text-xs">{label}</p>
        <p className="ab-text font-display text-5xl font-extrabold leading-none tabular-nums sm:text-6xl">{n}</p>
      </div>
      <span aria-hidden="true" className="ab-bar h-10 w-1 rounded-full" data-in={active ? '1' : '0'} />
    </div>
  )
}

/* ---------- main ---------- */
export default function About({ theme: themeOverride } = {}) {
  const reduce = useReducedMotion()
  const site = useSiteTheme()
  const isDark = themeOverride ? themeOverride === 'dark' : site.dark

  const rootStyle = {
    ...(siteConfig.accentColor ? { '--accent': siteConfig.accentColor } : {}),
  }

  /* bio: words light up as the paragraph scrolls through the viewport */
  const paragraphs = useMemo(
    () => (siteConfig.aboutMe || '').split(/\n\s*\n/).filter(Boolean),
    []
  )
  const paragraphWords = useMemo(
    () => paragraphs.map((paragraph) => paragraph.split(/\s+/).filter(Boolean)),
    [paragraphs]
  )
  const paragraphOffsets = useMemo(() => {
    let offset = 0
    return paragraphWords.map((wordsInParagraph) => {
      const start = offset
      offset += wordsInParagraph.length
      return start
    })
  }, [paragraphWords])
  const words = useMemo(() => paragraphWords.flat(), [paragraphWords])
  const bioRef = useRef(null)
  const [lit, setLit] = useState(reduce ? words.length : 0)

  useEffect(() => {
    if (reduce) {
      setLit(words.length)
      return undefined
    }
    let raf = 0
    const update = () => {
      raf = 0
      const el = bioRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.25)))
      setLit(Math.round(p * words.length))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduce, words.length])

  /* stats */
  const statsRef = useRef(null)
  const statsSeen = useInView(statsRef, reduce, 0.3)
  const stats = [
    ['Projects', siteConfig.projects?.length || 0],
    ['Roles', siteConfig.experience?.length || 0],
    ['Activities', siteConfig.activities?.length || 0],
  ]

  /* skill explorer */
  const [tab, setTab] = useState('all')
  const tabs = [{ id: 'all', label: 'All', items: ALL_ITEMS }, ...GROUPS]
  const current = tabs.find((t) => t.id === tab) || tabs[0]

  const onTabKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = tabs.findIndex((t) => t.id === tab)
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    setTab(tabs[next].id)
    e.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus()
  }

  return (
    <>
      <section
        id="about"
        className="about-root relative overflow-hidden py-24 sm:py-32"
        data-hero-theme={isDark ? 'dark' : 'light'}
        style={rootStyle}
      >
        {/* background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="ab-glow absolute inset-0" />
          <div className="ab-grid absolute inset-0" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          {/* ===== Heading ===== */}
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] lg:gap-16">
            <Reveal reduce={reduce} className="space-y-6">
              <div className="ab-pill inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-data text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="ab-ping absolute inline-flex h-full w-full rounded-full opacity-60 ab-dot" />
                  <span className="relative inline-flex h-2 w-2 rounded-full ab-dot" />
                </span>
                about me
              </div>
              <h2 className="ab-text font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Curiosity first.
                <br />
                Useful by design.
              </h2>
            </Reveal>

            <Reveal reduce={reduce} delay={120} className="space-y-6">
              <p className="ab-muted max-w-md text-lg leading-relaxed">
                I work across NLP, computer vision, and multimodal learning, bringing machine learning systems
                from experimentation into production.
              </p>
              <a href="#intro-video" className="ab-link inline-flex items-center gap-2 font-semibold">
                More about my journey
                <svg className="ab-arrow h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </Reveal>
          </div>

          {/* ===== Bento ===== */}
          <div className="mt-14 grid gap-5 lg:grid-cols-12">
            {/* bio */}
            <Reveal reduce={reduce} className="lg:col-span-8">
              <Tile reduce={reduce} className="h-full">
                <div className="p-7 sm:p-10">
                  <p className="ab-muted font-data text-xs">how I think</p>
                  <div ref={bioRef} className="mt-5 space-y-5">
                    {paragraphs.map((paragraph, paragraphIndex) => {
                      const wordsInParagraph = paragraphWords[paragraphIndex]
                      const startIndex = paragraphOffsets[paragraphIndex]
                      return (
                        <p
                          key={paragraphIndex}
                          className="font-display text-2xl font-medium leading-[1.55] sm:text-[1.75rem]"
                          aria-label={paragraph}
                        >
                          {wordsInParagraph.map((word, index) => (
                            <span
                              key={startIndex + index}
                              aria-hidden="true"
                              className="ab-word"
                              data-lit={startIndex + index < lit ? '1' : '0'}
                            >
                              {word}{index < wordsInParagraph.length - 1 ? ' ' : ''}
                            </span>
                          ))}
                        </p>
                      )
                    })}
                  </div>
                  <ul className="mt-8 flex flex-wrap gap-2" aria-label="Working style">
                    {TRAITS.map((t) => (
                      <li key={t} className="ab-chip rounded-md px-3 py-1 font-data text-xs">
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 border-t border-[var(--line)] pt-6">
                    <p className="ab-muted max-w-2xl leading-relaxed">
                      Let’s connect. I’m open to discussing AI innovations, collaboration opportunities, and
                      technical challenges.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                      <a href={`mailto:${siteConfig.social.email}`} className="ab-link inline-flex items-center gap-2 font-semibold">
                        {siteConfig.social.email}
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M9 7h8v8" />
                        </svg>
                      </a>
                      <a href={siteConfig.social.linkedin} target="_blank" rel="noreferrer" className="ab-link inline-flex items-center gap-2 font-semibold">
                        LinkedIn
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M9 7h8v8" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </Tile>
            </Reveal>

            {/* stats */}
            <Reveal reduce={reduce} delay={100} className="lg:col-span-4">
              <Tile reduce={reduce} className="h-full">
                <div ref={statsRef} className="flex h-full flex-col justify-between px-7 py-3 sm:px-8">
                  {stats.map(([label, value], i) => (
                    <Stat key={label} label={label} value={value} active={statsSeen} reduce={reduce} delay={i * 120} />
                  ))}
                </div>
              </Tile>
            </Reveal>

            {/* skill explorer */}
            <Reveal reduce={reduce} delay={80} className="lg:col-span-12">
              <Tile reduce={reduce}>
                <div className="p-7 sm:p-10">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="ab-muted font-data text-xs">toolbox</p>
                      <h3 className="ab-text font-display mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Areas I’m working with
                      </h3>
                    </div>

                    <div role="tablist" aria-label="Skill groups" className="ab-tabs flex flex-wrap gap-2">
                      {tabs.map((t) => (
                        <button
                          key={t.id}
                          role="tab"
                          type="button"
                          id={`ab-tab-${t.id}`}
                          aria-selected={tab === t.id}
                          aria-controls="ab-panel"
                          tabIndex={tab === t.id ? 0 : -1}
                          onClick={() => setTab(t.id)}
                          onKeyDown={onTabKey}
                          className="ab-tab rounded-md px-3.5 py-1.5 font-data text-xs"
                        >
                          {t.label}
                          <span className="ab-tab-n ml-2 tabular-nums">{t.items.length}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    id="ab-panel"
                    role="tabpanel"
                    aria-labelledby={`ab-tab-${tab}`}
                    key={tab}
                    className="mt-8 flex min-h-[7.5rem] flex-wrap content-start gap-3"
                  >
                    {current.items.map((item, i) => (
                      <span
                        key={item}
                        className="ab-skill rounded-xl px-4 py-2.5 text-sm font-medium"
                        style={{ animationDelay: `${i * 45}ms` }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Tile>
            </Reveal>
          </div>
        </div>

        {/* ===== Marquee strip ===== */}
        <div aria-hidden="true" className="ab-marquee relative z-10 mt-16 overflow-hidden">
          <div className="ab-track flex w-max gap-3">
            {[0, 1].map((dup) =>
              MARQUEE.map((m, i) => (
                <span key={`${dup}-${i}`} className="ab-chip flex items-center gap-3 rounded-md px-4 py-2 font-data text-xs">
                  <span className="ab-dot inline-block h-1.5 w-1.5 rounded-full" />
                  {m}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

    </>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { siteConfig } from '../config'
import { useSiteTheme } from './useSiteTheme.jsx'

/*
  Light-only section (no dark mode), sharing Hero/About's palette and fonts.
  Built so a recruiter can answer three questions in seconds:
    1. What is it?        -> full description, first sentence emphasised
    2. Is it live?        -> "Live" badge + a primary "Live demo" button
    3. Where's the code?  -> a separate "Source" button

  Link detection (use whichever fields you like in siteConfig.projects[]):
    live demo : live | demo | website | link (when it's not a github.com URL)
    source    : github | repo | source | link (when it IS a github.com URL)
  Optional fields: image (screenshot URL), featured (true), highlights (string[])
*/

/* ---------- helpers ---------- */
const isGithub = (url) => /github\.com/i.test(url || '')

function getLinks(p) {
  const live = p.live || p.demo || p.website || (p.link && !isGithub(p.link) ? p.link : null)
  const source = p.github || p.repo || p.source || (p.link && isGithub(p.link) ? p.link : null)
  return { live, source }
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function splitDescription(text = '') {
  const clean = text.trim()
  const m = clean.match(/^(.+?[.!?])(\s+|$)/)
  if (!m) return { lead: clean, rest: '' }
  return { lead: m[1], rest: clean.slice(m[0].length).trim() }
}

function useReducedMotion() {
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  return reduce
}

function useInView(ref, reduce, threshold = 0.12) {
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

/* ---------- icons ---------- */
const ArrowUpRight = () => (
  <svg className="pr-ico h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M7 17L17 7M9 7h8v8" />
  </svg>
)
const GithubIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)
const Check = () => (
  <svg className="mt-1 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M5 13l4 4L19 7" />
  </svg>
)

/* ---------- preview (browser frame) ---------- */
function Preview({ project, live, source }) {
  const url = live ? hostOf(live) : source ? hostOf(source) : 'local project'
  const body = project.image ? (
    <img
      src={project.image}
      alt={project.imageAlt || `${project.name} screenshot`}
      loading="lazy"
      className="pr-shot h-full w-full object-cover object-top"
    />
  ) : (
    <div className="pr-blank flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="pr-text font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
        {project.name}
      </span>
      <span className="flex flex-wrap justify-center gap-1.5">
        {project.skills?.slice(0, 3).map((s) => (
          <span key={s} className="pr-chip rounded-md px-2 py-0.5 font-data text-[11px]">
            {s}
          </span>
        ))}
      </span>
    </div>
  )

  const frame = (
    <div className="pr-frame overflow-hidden rounded-2xl">
      <div className="pr-frame-bar flex items-center gap-3 px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="pr-light h-2.5 w-2.5 rounded-full" />
          <span className="pr-light h-2.5 w-2.5 rounded-full" />
          <span className="pr-light h-2.5 w-2.5 rounded-full" />
        </span>
        <span className="pr-url min-w-0 flex-1 truncate rounded-md px-3 py-1 font-data text-[11px]">
          {live ? 'https://' : ''}
          {url}
        </span>
      </div>
      <div className="pr-frame-body aspect-[16/10] overflow-hidden">{body}</div>
    </div>
  )

  return live ? (
    <a href={live} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="block">
      {frame}
    </a>
  ) : (
    frame
  )
}

/* ---------- card ---------- */
function Card({ project, featured, index, reduce }) {
  const ref = useRef(null)
  const seen = useInView(ref, reduce)
  const { live, source } = getLinks(project)
  const { lead, rest } = splitDescription(project.description)

  const onMove = (e) => {
    if (reduce || e.pointerType === 'touch') return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <article
      ref={ref}
      onPointerMove={onMove}
      data-in={seen ? '1' : '0'}
      style={{ transitionDelay: `${Math.min(index, 4) * 70}ms` }}
      className={`pr-card relative overflow-hidden rounded-3xl ${featured ? 'md:col-span-2' : ''}`}
    >
      <div aria-hidden="true" className="pr-spot pointer-events-none absolute inset-0" />
      <div
        className={`relative grid gap-8 p-6 sm:p-8 ${featured ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:p-10' : 'content-start'}`}
      >
        {/* text */}
        <div className={`flex flex-col ${featured ? 'order-2 lg:order-1' : 'order-2'}`}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {live ? (
              <span className="pr-badge-live inline-flex items-center gap-2 rounded-md px-2.5 py-1 font-data text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="pr-ping absolute inline-flex h-full w-full rounded-full opacity-60" />
                  <span className="pr-live-dot relative inline-flex h-2 w-2 rounded-full" />
                </span>
                Live
              </span>
            ) : (
              <span className="pr-chip inline-flex items-center rounded-md px-2.5 py-1 font-data text-xs">Source only</span>
            )}
            {featured && (
              <span className="pr-chip inline-flex items-center rounded-md px-2.5 py-1 font-data text-xs">Featured</span>
            )}
          </div>

          <h3
            className={`pr-text font-display font-extrabold leading-[1.05] tracking-tight ${featured ? 'text-4xl sm:text-5xl' : 'text-3xl'}`}
          >
            {project.name}
          </h3>

          <p className="pr-text mt-4 text-lg font-medium leading-snug">{lead}</p>
          {rest && <p className="pr-muted mt-3 leading-7">{rest}</p>}

          {project.highlights?.length > 0 && (
            <ul className="mt-5 space-y-2">
              {project.highlights.map((h) => (
                <li key={h} className="pr-text2 flex gap-2.5 text-sm leading-6">
                  <span className="pr-accent">
                    <Check />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          )}

          {project.skills?.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label={`${project.name} tech stack`}>
              {project.skills.slice(0, 7).map((s) => (
                <li key={s} className="pr-chip rounded-md px-2.5 py-1 font-data text-xs">
                  {s}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {live && (
              <a
                href={live}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${project.name} live demo (opens in a new tab)`}
                className="pr-btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold"
              >
                Live demo
                <ArrowUpRight />
              </a>
            )}
            {source && (
              <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${project.name} source code on GitHub (opens in a new tab)`}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold ${live ? 'pr-btn-ghost' : 'pr-btn-primary'}`}
              >
                <GithubIcon />
                Source code
              </a>
            )}
          </div>
        </div>

        {/* preview */}
        <div className={featured ? 'order-1 lg:order-2' : 'order-1'}>
          <Preview project={project} live={live} source={source} />
        </div>
      </div>
    </article>
  )
}

/* ---------- main ---------- */
export default function Projects() {
  const reduce = useReducedMotion()
  const siteTheme = useSiteTheme()
  const projects = siteConfig.projects || []

  const [filter, setFilter] = useState('All')
  const [liveOnly, setLiveOnly] = useState(false)

  // most-used skills become the filter chips
  const filters = useMemo(() => {
    const counts = new Map()
    projects.forEach((p) => (p.skills || []).forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)))
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([s, n]) => ({ name: s, count: n }))
    return [{ name: 'All', count: projects.length }, ...top]
  }, [projects])

  const liveCount = projects.filter((p) => getLinks(p).live).length

  const visible = projects.filter(
    (p) => (filter === 'All' || p.skills?.includes(filter)) && (!liveOnly || getLinks(p).live)
  )

  if (!projects.length) return null

  const reset = () => {
    setFilter('All')
    setLiveOnly(false)
  }

  return (
    <>
      <section id="projects" data-hero-theme={siteTheme.dark ? 'light' : 'dark'} className="pr-root relative overflow-hidden py-24 sm:py-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="pr-glow absolute inset-0" />
          <div className="pr-grid absolute inset-0" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          {/* ===== Header ===== */}
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] lg:gap-16">
            <div className="space-y-6">
              <div className="pr-pill inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-data text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="pr-ping-accent absolute inline-flex h-full w-full rounded-full opacity-60" />
                  <span className="pr-dot relative inline-flex h-2 w-2 rounded-full" />
                </span>
                selected work
              </div>
              <h2 className="pr-text font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Things I’ve built,
                <br />
                ready to open.
              </h2>
            </div>

            <div className="space-y-5">
              <p className="pr-muted max-w-md text-lg leading-relaxed">
                Each project shows what it does, what it’s built with, and links straight to the live demo and the
                source code.
              </p>
              <dl className="flex gap-8 font-data">
                <div>
                  <dd className="pr-text font-display text-4xl font-extrabold tabular-nums">{projects.length}</dd>
                  <dt className="pr-muted text-xs">projects</dt>
                </div>
                <div>
                  <dd className="pr-text font-display text-4xl font-extrabold tabular-nums">{liveCount}</dd>
                  <dt className="pr-muted text-xs">live demos</dt>
                </div>
              </dl>
            </div>
          </div>

          {/* ===== Filters ===== */}
          <div className="mt-12 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects by technology">
              {filters.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setFilter(f.name)}
                  aria-pressed={filter === f.name}
                  className="pr-filter rounded-md px-3.5 py-1.5 font-data text-xs"
                >
                  {f.name}
                  <span className="pr-filter-n ml-2 tabular-nums">{f.count}</span>
                </button>
              ))}
            </div>

            {liveCount > 0 && (
              <button
                type="button"
                role="switch"
                aria-checked={liveOnly}
                onClick={() => setLiveOnly((v) => !v)}
                className="pr-switch inline-flex items-center gap-3 self-start font-data text-xs lg:self-auto"
              >
                <span className="pr-track relative inline-block h-5 w-9 rounded-full" data-on={liveOnly ? '1' : '0'}>
                  <span className="pr-thumb absolute left-0.5 top-0.5 h-4 w-4 rounded-full" />
                </span>
                Live demos only
              </button>
            )}
          </div>

          {/* ===== Cards ===== */}
          <div
            key={`${filter}-${liveOnly}`}
            className="mt-8 grid gap-6 md:grid-cols-2"
            aria-live="polite"
          >
            {visible.map((p, i) => (
              <Card key={p.name} project={p} featured={i === 0} index={i} reduce={reduce} />
            ))}
          </div>

          {visible.length === 0 && (
            <div className="pr-card mt-6 rounded-3xl p-10 text-center">
              <p className="pr-muted">No projects match these filters yet.</p>
              <button type="button" onClick={reset} className="pr-btn-ghost mt-5 inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold">
                Show all projects
              </button>
            </div>
          )}

          {siteConfig.social?.github && (
            <div className="mt-12 flex justify-center">
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="pr-btn-ghost inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold"
              >
                <GithubIcon />
                See everything on GitHub
                <ArrowUpRight />
              </a>
            </div>
          )}
        </div>
      </section>

    </>
  )
}

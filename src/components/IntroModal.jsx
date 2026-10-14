import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '../config'

function getEmbedUrl(url) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const id = parsed.hostname.includes('youtu.be')
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get('v') || parsed.pathname.match(/\/embed\/([^/]+)/)?.[1]

    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  } catch {
    return null
  }
}

export default function IntroModal() {
  const [open, setOpen] = useState(true)
  const closeButtonRef = useRef(null)
  const dialogRef = useRef(null)
  const embedUrl = getEmbedUrl(siteConfig.introVideoUrl)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll('button, a[href], iframe')]
        .filter((element) => !element.hasAttribute('disabled'))
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false)
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-modal-title"
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c1222] text-white shadow-2xl shadow-black/40"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-xl text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
          aria-label="Close introduction"
        >
          ×
        </button>

        <div className="p-6 pb-4 sm:p-9 sm:pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sky-300">A quick introduction</p>
          <h2 id="intro-modal-title" className="mt-3 max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Before you explore, meet {siteConfig.name.split(' ')[0]}.
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">
            A short introduction to my work in AI, machine learning, and software engineering.
          </p>
        </div>

        <div className="px-6 pb-6 sm:px-9 sm:pb-9">
          {embedUrl ? (
            <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
              <iframe
                className="h-full w-full"
                src={embedUrl}
                title={`${siteConfig.name} introduction video`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative flex min-h-64 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-6 sm:min-h-80 sm:p-9">
              <div aria-hidden="true" className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
              <div aria-hidden="true" className="absolute -bottom-20 left-1/4 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="relative z-10 flex items-end gap-5 sm:gap-8">
                <img src={siteConfig.profileImage} alt="" className="h-24 w-20 rounded-xl border border-white/20 object-cover object-top sm:h-40 sm:w-32" />
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-sky-300">Intro film · Coming soon</p>
                  <p className="mt-2 font-display text-2xl font-extrabold sm:text-4xl">Hi, I’m {siteConfig.name.split(' ')[0]}.</p>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">{siteConfig.heroIntro}</p>
                </div>
              </div>
              <p className="relative z-10 mt-6 font-mono text-[11px] text-slate-400">
                Add a YouTube link to <code className="rounded bg-white/10 px-1.5 py-0.5">introVideoUrl</code> in your site config to show the video here.
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-xs text-slate-400">{siteConfig.title}</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                window.setTimeout(() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }), 0)
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              Explore the portfolio <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

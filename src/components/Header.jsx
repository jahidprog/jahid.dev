import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '../config'
import { useSiteTheme } from './useSiteTheme.jsx'

const links = [
  { id: 'intro-video', label: 'Intro' },
  { id: 'about', label: 'About' },
  ...(siteConfig.projects?.length ? [{ id: 'projects', label: 'Work' }] : []),
  ...(siteConfig.thesis ? [{ id: 'thesis', label: 'Research' }] : []),
  ...(siteConfig.experience?.length ? [{ id: 'experience', label: 'Experience' }] : []),
  ...(siteConfig.education?.length ? [{ id: 'education', label: 'Education' }] : []),
  ...(siteConfig.activities?.length ? [{ id: 'activity', label: 'Activities' }] : []),
]

export default function Header() {
  const { dark: darkMode, setDark: setDarkMode } = useSiteTheme()
  const [active, setActive] = useState('hero')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigating = useRef(false)
  const settleTimer = useRef(null)
  useEffect(() => {
    const update = () => {
      if (!navigating.current) {
        const sections = ['hero', ...links.map(({ id }) => id)]
          .map((id) => document.getElementById(id))
          .filter(Boolean)
          .sort((a, b) => a.offsetTop - b.offsetTop)
        const current = sections.filter((section) => section.getBoundingClientRect().top <= 145).at(-1)
        setActive(current?.id || 'hero')
      }
    }
    const finishNavigation = () => {
      if (!navigating.current) return
      navigating.current = false
      clearTimeout(settleTimer.current)
      const sections = ['hero', ...links.map(({ id }) => id)].map((id) => document.getElementById(id)).filter(Boolean).sort((a, b) => a.offsetTop - b.offsetTop)
      setActive(sections.filter((section) => section.getBoundingClientRect().top <= 145).at(-1)?.id || 'hero')
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    document.addEventListener('scrollend', finishNavigation)
    return () => {
      window.removeEventListener('scroll', update)
      document.removeEventListener('scrollend', finishNavigation)
      clearTimeout(settleTimer.current)
    }
  }, [])

  const closeMenu = () => setMenuOpen(false)
  const navigateTo = (event, id) => {
    event.preventDefault()
    setActive(id)
    navigating.current = true
    closeMenu()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      navigating.current = false
      window.dispatchEvent(new Event('scroll'))
    }, 1800)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav aria-label="Main navigation" className={`mx-auto flex max-w-5xl items-center justify-between rounded-2xl border px-3 py-2 transition-all duration-300 sm:rounded-full sm:px-4 ${darkMode ? 'border-white/10 bg-slate-950/90 shadow-lg shadow-black/20 backdrop-blur-xl' : 'border-slate-200/70 bg-white/90 shadow-lg shadow-slate-900/5 backdrop-blur-xl'}`}>
        <a href="#hero" onClick={closeMenu} className={`flex shrink-0 items-center gap-2 rounded-full px-2 py-1.5 text-sm font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 font-mono text-xs text-white">JI</span>
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ id, label }) => <a key={id} href={`#${id}`} onClick={(event) => navigateTo(event, id)} aria-current={active === id ? 'location' : undefined} className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition ${active === id ? (darkMode ? 'bg-white text-slate-950' : 'bg-slate-900 text-white') : (darkMode ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950')}`}>{label}</a>)}
        </div>

        <button type="button" onClick={() => setDarkMode(!darkMode)} aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`} aria-pressed={darkMode} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition ${darkMode ? 'text-amber-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`} title={`${darkMode ? 'Light' : 'Dark'} mode`}>{darkMode ? '☀' : '☾'}</button>
        <a href={`mailto:${siteConfig.social.email}`} className="hidden items-center gap-2 rounded-full bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 sm:inline-flex">Let’s talk <span aria-hidden="true">↗</span></a>
        <button type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className={`flex h-10 w-10 items-center justify-center rounded-full transition md:hidden ${darkMode ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'}`}>
          <span className="text-xl leading-none">{menuOpen ? '×' : '☰'}</span>
        </button>
      </nav>
      {menuOpen && <div className={`mx-auto mt-2 max-w-5xl rounded-2xl border p-2 shadow-xl backdrop-blur-xl md:hidden ${darkMode ? 'border-slate-700 bg-slate-900/95' : 'border-slate-200/70 bg-white/95'}`}>
        {links.map(({ id, label }, index) => <a key={id} href={`#${id}`} onClick={(event) => navigateTo(event, id)} className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${active === id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}><span className="flex items-center gap-3"><span className="font-mono text-xs text-slate-400">0{index + 1}</span>{label}</span><span>↗</span></a>)}
        <a href={`mailto:${siteConfig.social.email}`} onClick={closeMenu} className="mt-1 flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">Let’s talk <span>↗</span></a>
      </div>}
    </header>
  )
}

import { siteConfig } from '../config'
import { useSiteTheme } from './useSiteTheme.jsx'

function getEmbedUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v') || parsed.pathname.match(/\/embed\/([^/]+)/)?.[1]
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  } catch { return null }
}

// Every themed class pair is written out in full so Tailwind can see it.
// The white column is your original design, unchanged.
const theme = {
  light: {
    section: 'bg-white',
    eyebrow: 'text-blue-700',
    title: 'text-slate-950',
    accent: 'text-blue-600',
    lead: 'text-slate-500',
    card: 'border-slate-200 bg-slate-100 shadow-xl shadow-slate-900/10',
    placeholder: 'bg-gradient-to-br from-blue-50 via-white to-indigo-100',
    blobA: 'bg-blue-200/50',
    blobB: 'bg-indigo-200/50',
    photo: 'border-white shadow-xl',
    body: 'text-slate-600',
    play: 'bg-blue-600 text-white shadow-lg shadow-blue-600/25',
    hint: 'text-slate-400',
    code: 'bg-white/70',
  },
  dark: {
    section: '',
    eyebrow: 'text-sky-400',
    title: 'text-slate-50',
    accent: 'text-sky-400',
    lead: 'text-slate-400',
    card: 'border-white/10 bg-slate-900 shadow-xl shadow-black/40',
    placeholder: 'bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950',
    blobA: 'bg-sky-500/20',
    blobB: 'bg-indigo-500/20',
    photo: 'border-slate-700 shadow-xl shadow-black/40',
    body: 'text-slate-400',
    play: 'bg-sky-400 text-slate-950 shadow-lg shadow-sky-400/25',
    hint: 'text-slate-500',
    code: 'bg-white/10',
  },
}

export default function IntroVideo() {
  const embedUrl = getEmbedUrl(siteConfig.introVideoUrl)
  const { dark } = useSiteTheme()
  const sectionDark = !dark
  const t = sectionDark ? theme.dark : theme.light
  const sectionStyle = sectionDark ? { backgroundColor: '#0C1222' } : undefined

  return (
    <section id="intro-video" style={sectionStyle} className={`${t.section} py-16 transition-colors duration-300 sm:py-24`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className={`mb-3 font-mono text-sm uppercase tracking-[0.2em] ${t.eyebrow}`}>A quick introduction</p><h2 className={`max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl ${t.title}`}>The person behind the <span className={t.accent}>projects.</span></h2></div>
          <p className={`max-w-sm leading-7 ${t.lead}`}>My story, what I’m learning, and the kind of problems I want to solve.</p>
        </div>
        <div className={`relative aspect-video overflow-hidden rounded-[1.75rem] border transition-colors duration-300 ${t.card}`}>
          {embedUrl ? <iframe className="h-full w-full" src={embedUrl} title={`${siteConfig.name} introduction video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : (
            <div className={`absolute inset-0 flex items-center justify-center overflow-hidden p-6 sm:p-10 ${t.placeholder}`}>
              <div className={`absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl ${t.blobA}`} />
              <div className={`absolute -bottom-28 left-12 h-72 w-72 rounded-full blur-3xl ${t.blobB}`} />
              <div className="relative grid w-full max-w-4xl items-center gap-6 sm:grid-cols-[auto_1fr_auto] sm:gap-8">
                <div className={`mx-auto h-24 w-20 overflow-hidden rounded-2xl border-4 sm:mx-0 sm:h-40 sm:w-32 ${t.photo}`}><img src={siteConfig.profileImage} alt={siteConfig.name} className="h-full w-full object-cover object-top" /></div>
                <div className="text-center sm:text-left"><p className={`font-mono text-xs uppercase tracking-[0.2em] ${t.eyebrow}`}>Intro film · Coming soon</p><h3 className={`mt-2 text-2xl font-semibold tracking-tight sm:text-4xl ${t.title}`}>Hi, I’m {siteConfig.name.split(' ')[0]}.</h3><p className={`mt-2 max-w-xl text-sm leading-6 sm:text-base ${t.body}`}>AI/ML engineer exploring RAG, LLMs, generative AI, and agentic systems.</p></div>
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl sm:mx-0 sm:h-16 sm:w-16 ${t.play}`}>▶</div>
              </div>
              <p className={`absolute bottom-3 right-4 text-[10px] sm:bottom-5 sm:right-6 sm:text-xs ${t.hint}`}>Add a YouTube URL in <code className={`rounded px-1.5 py-0.5 ${t.code}`}>src/config.js</code> to embed your video</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

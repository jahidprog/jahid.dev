import { useState } from 'react'
import { siteConfig } from '../config'
import { useSiteTheme } from './useSiteTheme.jsx'

function ActivityLightbox({ activity, activities, onSelect, onClose }) {
  const currentIndex = activities.findIndex((item) => item.id === activity.id)
  const move = (step) => {
    const nextIndex = (currentIndex + step + activities.length) % activities.length
    onSelect(activities[nextIndex])
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activity.title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/15 px-4 py-2 text-white hover:bg-white/25">
        Close ×
      </button>
      <button type="button" aria-label="Previous photo" onClick={(event) => { event.stopPropagation(); move(-1) }} className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25 sm:left-8">
        ‹
      </button>
      <article onClick={(event) => event.stopPropagation()} className="grid max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[1.3fr_.7fr]">
        <img src={activity.image} alt={activity.title} className="max-h-[60vh] w-full bg-slate-100 object-contain md:max-h-[80vh]" />
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{activity.category} · {activity.date}</p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-950">{activity.title}</h3>
          <p className="mt-4 leading-7 text-slate-600">{activity.description}</p>
          <p className="mt-8 text-xs text-slate-400">{currentIndex + 1} / {activities.length}</p>
        </div>
      </article>
      <button type="button" aria-label="Next photo" onClick={(event) => { event.stopPropagation(); move(1) }} className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25 sm:right-8">
        ›
      </button>
    </div>
  )
}

export default function Activities() {
  const { dark } = useSiteTheme()
  const activities = siteConfig.activities || []
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('All')

  if (!activities.length) return null

  const categories = ['All', ...new Set(activities.map((item) => item.category))]
  const visible = category === 'All' ? activities : activities.filter((item) => item.category === category)

  return (
    <>
      <section id="activity" data-hero-theme={dark ? 'light' : 'dark'} className="resume-root relative overflow-hidden py-24 sm:py-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="resume-glow absolute inset-0" />
          <div className="resume-grid absolute inset-0" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="resume-heading mb-12 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] lg:items-end lg:gap-16">
            <div>
              <p className="resume-eyebrow">06 / Community</p>
              <h2 className="resume-title mt-5">People make<br className="hidden sm:block" /> the moments.</h2>
              <p className="resume-muted mt-6 max-w-2xl text-lg leading-relaxed">
                A few memories from volunteering, learning together, and showing up for the community.
              </p>
            </div>
            <div className="resume-card flex items-center gap-4 rounded-2xl px-5 py-4">
              <span className="resume-index">{String(activities.length).padStart(2, '0')}</span>
              <div>
                <p className="resume-card-title text-lg">Moments captured</p>
                <p className="resume-muted font-data text-xs">community & volunteering</p>
              </div>
            </div>
          </div>

          <div className="mb-7 flex flex-wrap items-center gap-2" aria-label="Filter volunteer memories">
            {categories.map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`resume-filter rounded-md px-3.5 py-1.5 font-data text-xs ${category === item ? 'is-active' : ''}`}>
                {item}
              </button>
            ))}
            <span className="resume-muted ml-auto self-center font-data text-xs">{visible.length} / {activities.length}</span>
          </div>

          <div className="grid auto-rows-[190px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:gap-4 lg:grid-cols-4">
            {visible.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelected(item)}
                aria-label={`View ${item.title}, ${item.date}`}
                className={`resume-activity group relative overflow-hidden rounded-2xl text-left ${index % 7 === 0 ? 'col-span-2 row-span-2' : ''}`}
              >
                <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/0 to-transparent opacity-80 transition group-hover:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                  <span className="mb-2 inline-flex rounded-md bg-white/20 px-2.5 py-1 font-data text-[10px] uppercase tracking-wider backdrop-blur sm:text-xs">{item.category}</span>
                  <span className="block text-base font-semibold sm:text-lg">{item.title}</span>
                  <span className="mt-1 block font-data text-xs text-white/75">{item.date}</span>
                </span>
                <span aria-hidden="true" className="resume-activity-open absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full">↗</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selected && <ActivityLightbox activity={selected} activities={activities} onSelect={setSelected} onClose={() => setSelected(null)} />}
    </>
  )
}

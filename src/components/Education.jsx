import { siteConfig } from '../config'
import { useSiteTheme } from './useSiteTheme.jsx'

export default function Education() {
  const { dark } = useSiteTheme()
  const education = siteConfig.education || []

  if (!education.length) return null

  return (
    <section id="education" data-hero-theme={dark ? 'dark' : 'light'} className="resume-root relative overflow-hidden py-24 sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="resume-glow absolute inset-0" />
        <div className="resume-grid absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="resume-heading mb-12 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] lg:items-end lg:gap-16">
          <div>
            <p className="resume-eyebrow">05 / Education</p>
            <h2 className="resume-title mt-5">The foundations<br className="hidden sm:block" /> behind the work.</h2>
          </div>
          <p className="resume-muted max-w-md text-lg leading-relaxed">
            The study and research that shaped how I approach engineering and intelligent systems.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {education.map((item, index) => (
            <article key={`${item.school}-${item.degree}`} className="resume-card rounded-3xl p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="resume-index">0{index + 1}</span>
                <span className="resume-date">{item.dateRange}</span>
              </div>
              <h3 className="resume-card-title mt-8">{item.degree}</h3>
              <p className="resume-accent mt-2 text-lg font-semibold">{item.school}</p>

              {item.achievements?.length > 0 && (
                <ul className="resume-list mt-7 space-y-3 border-t pt-5">
                  {item.achievements.map((achievement) => (
                    <li key={achievement} className="resume-muted flex gap-3 text-sm leading-6">
                      <span className="resume-accent" aria-hidden="true">↗</span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

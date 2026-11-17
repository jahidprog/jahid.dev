import { siteConfig } from '../config'
import { useSiteTheme } from './useSiteTheme.jsx'

function CompanyMark({ experience }) {
  return (
    <span aria-hidden="true" className="resume-company-mark">
      {experience.company?.slice(0, 2).toUpperCase() || 'EX'}
    </span>
  )
}

export default function Experience() {
  const { dark } = useSiteTheme()
  const experiences = siteConfig.experience || []

  if (!experiences.length) return null

  return (
    <section id="experience" data-hero-theme={dark ? 'light' : 'dark'} className="resume-root relative overflow-hidden py-24 sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="resume-glow absolute inset-0" />
        <div className="resume-grid absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="resume-heading mb-12 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] lg:items-end lg:gap-16">
          <div>
            <p className="resume-eyebrow">04 / Experience</p>
            <h2 className="resume-title mt-5">Where I’ve<br className="hidden sm:block" /> contributed.</h2>
          </div>
          <p className="resume-muted max-w-md text-lg leading-relaxed">
            Roles, responsibilities, and the work behind them.
          </p>
        </div>

        <div className="space-y-5">
          {experiences.map((experience, index) => (
            <article key={`${experience.company}-${experience.title}`} className="resume-card rounded-3xl p-6 sm:p-8">
              {experience.image && (
                <img
                  src={experience.image}
                  alt={experience.imageAlt || `${experience.company} team`}
                  loading="lazy"
                  className="resume-experience-photo mb-7"
                />
              )}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {!experience.image && <CompanyMark experience={experience} />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="resume-eyebrow">0{index + 1} / {experience.company}</p>
                      <h3 className="resume-card-title mt-2">{experience.title}</h3>
                    </div>
                    <span className="resume-date">{experience.dateRange}</span>
                  </div>
                  {experience.bullets?.length > 0 && (
                    <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                      {experience.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="resume-bullet">
                          <span className="resume-accent" aria-hidden="true">↗</span>
                          <span className="resume-muted text-sm leading-6">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

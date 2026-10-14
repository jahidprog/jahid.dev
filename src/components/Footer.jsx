import { siteConfig } from '../config'
import { useSiteTheme } from './useSiteTheme.jsx'

export default function Footer() {
  const { dark } = useSiteTheme()
  const footerLinks = [
    ['Intro', '#intro-video'],
    ['About', '#about'],
    ['Projects', '#projects'],
    ...(siteConfig.thesis ? [['Research', '#thesis']] : []),
    ...(siteConfig.experience?.length ? [['Experience', '#experience']] : []),
    ...(siteConfig.education?.length ? [['Education', '#education']] : []),
    ...(siteConfig.activities?.length ? [['Volunteer', '#activity']] : []),
  ]

  return (
    <footer id="contact" data-hero-theme={dark ? 'dark' : 'light'} className="resume-root relative overflow-hidden border-t py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="resume-glow absolute inset-0" />
        <div className="resume-grid absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="resume-footer-card grid gap-12 rounded-3xl p-7 sm:p-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] lg:gap-16 lg:p-14">
          <div>
            <p className="resume-eyebrow">Have a good problem?</p>
            <h2 className="resume-title mt-5">Let’s make something useful.</h2>
            <p className="resume-muted mt-6 max-w-xl text-lg leading-relaxed">
              I’m always interested in thoughtful conversations about AI, engineering, and ideas worth building.
            </p>
            <a href={`mailto:${siteConfig.social.email}`} className="resume-primary mt-8 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold">
              Get in touch <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t pt-8 sm:gap-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div>
              <p className="resume-eyebrow mb-5">Explore</p>
              <ul className="space-y-3">
                {footerLinks.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="resume-footer-link">{label}<span aria-hidden="true">↗</span></a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="resume-eyebrow mb-5">Elsewhere</p>
              <ul className="space-y-3">
                <li><a href={siteConfig.social.github} target="_blank" rel="noreferrer" className="resume-footer-link">GitHub<span aria-hidden="true">↗</span></a></li>
                <li><a href={siteConfig.social.linkedin} target="_blank" rel="noreferrer" className="resume-footer-link">LinkedIn<span aria-hidden="true">↗</span></a></li>
                <li><a href={`mailto:${siteConfig.social.email}`} className="resume-footer-link">Email<span aria-hidden="true">↗</span></a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="resume-footer-meta mt-10 flex flex-col justify-between gap-3 border-t pt-6 text-xs sm:flex-row">
          <span>© {new Date().getFullYear()} {siteConfig.name}</span>
          <span>Built with curiosity and a lot of iteration.</span>
          <a href="#hero" className="resume-back-top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  )
}

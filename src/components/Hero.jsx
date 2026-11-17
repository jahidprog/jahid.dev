import { useEffect, useMemo, useState } from 'react';
import { siteConfig } from '../config';
import { useSiteTheme } from './useSiteTheme.jsx';
import LanyardBadge from './lanyard-badge.jsx';

/*
  THEMING
  -------
  The hero follows your site's dark/white toggle automatically:
    1. It looks for class="dark" / data-theme="dark" (or "light") on <html>/<body>.
    2. If none is found, it checks whether the page background is dark.
    3. It also copies your page's real background colour, so the hero blends
       into the rest of the site in both themes.
  If your toggle lives in React state / context instead, pass it directly:
    <Hero theme={isDark ? 'dark' : 'light'} />

  Optional siteConfig fields (all have fallbacks):
    siteConfig.roles   -> ['Computer vision systems', 'Deep learning research', ...]
    siteConfig.skills  -> ['Python', 'PyTorch', 'YOLO', ...]
    siteConfig.status  -> 'open to work'
  If siteConfig.accentColor is set it is used in both themes; otherwise
  each theme uses its own tuned accent.
*/

const FALLBACK_ROLES = [
  'Deep learning research',
  'Computer vision systems',
  'Backend & full-stack engineering',
];
const FALLBACK_SKILLS = ['Python', 'PyTorch', 'YOLO', 'OpenCV', 'Go', 'React'];

/* ---------- neural-net background geometry (computed once) ---------- */
const LAYERS = [4, 6, 7, 5, 3];
const W = 1200;
const H = 800;

const NODES = LAYERS.map((count, li) => {
  const x = 90 + li * ((W - 180) / (LAYERS.length - 1));
  const gap = 110;
  const top = H / 2 - ((count - 1) * gap) / 2;
  return Array.from({ length: count }, (_, i) => ({ x, y: top + i * gap }));
});

const EDGES = [];
for (let l = 0; l < NODES.length - 1; l++) {
  NODES[l].forEach((a) => {
    NODES[l + 1].forEach((b) => EDGES.push({ a, b }));
  });
}

/* ---------- typing effect ---------- */
function useTyped(words) {
  const [text, setText] = useState('');

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setText(words[0]);
      return undefined;
    }

    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer;

    const tick = () => {
      const word = words[wordIndex];
      charIndex += deleting ? -1 : 1;
      setText(word.slice(0, charIndex));

      let delay = deleting ? 28 : 55;
      if (!deleting && charIndex === word.length) {
        deleting = true;
        delay = 1800;
      } else if (deleting && charIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 350;
      }
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [words]);

  return text;
}

export default function Hero({ theme: themeOverride } = {}) {
  const roles = useMemo(
    () => (siteConfig.roles?.length ? siteConfig.roles : FALLBACK_ROLES),
    []
  );
  const skills = (siteConfig.skills?.length ? siteConfig.skills : FALLBACK_SKILLS).slice(0, 6);
  const typed = useTyped(roles);

  const status = siteConfig.status || 'open to work';

  const site = useSiteTheme();
  const isDark = themeOverride ? themeOverride === 'dark' : site.dark;

  // Use the page's real background so the hero blends into the rest of the site.
  // (Skipped when the theme is forced via the `theme` prop.)
  const rootStyle = {
    ...(siteConfig.accentColor ? { '--accent': siteConfig.accentColor } : {}),
  };

  return (
    <>
      <div
        id="hero"
        className="hero-root relative flex min-h-screen items-center overflow-visible"
        data-hero-theme={isDark ? 'dark' : 'light'}
        style={rootStyle}
      >
        {/* ---------- Background: blueprint grid + neural network ---------- */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="hero-glow absolute inset-0" />
          <div className="hero-grid absolute inset-0" />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
          >
            <g stroke="var(--accent)" strokeWidth="1" fill="none">
              {EDGES.map((e, i) => (
                <line
                  key={i}
                  x1={e.a.x}
                  y1={e.a.y}
                  x2={e.b.x}
                  y2={e.b.y}
                  opacity="0.14"
                  className={i % 11 === 0 ? 'hero-signal' : undefined}
                  style={i % 11 === 0 ? { animationDelay: `${(i % 7) * 0.6}s` } : undefined}
                />
              ))}
            </g>
            <g fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.5">
              {NODES.flat().map((n, i) => (
                <circle key={i} cx={n.x} cy={n.y} r="5" opacity="0.5" />
              ))}
            </g>
          </svg>
          <div className="hero-fade absolute inset-0" />
        </div>

        {/* ---------- Content ---------- */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24 md:pb-20 md:pt-28 lg:pb-10 lg:pt-24">
          <div
            className="grid items-center"
          >
            {/* Text column */}
            <div
              className="hero-copy relative self-center space-y-8"
            >
              {siteConfig.profileImage && <div className="hero-badge-spacer" aria-hidden="true" />}

              <div className="hero-in hx-pill inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-data text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 hx-dot" />
                  <span className="relative inline-flex h-2 w-2 rounded-full hx-dot" />
                </span>
                status: {status}
              </div>

              <div className="space-y-5">
                <h1
                  className="hero-in hx-text font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl"
                  style={{ animationDelay: '0.1s' }}
                >
                  {siteConfig.name}
                </h1>

                <p
                  className="hero-in hx-text2 font-display text-2xl font-medium sm:text-3xl"
                  style={{ animationDelay: '0.2s' }}
                >
                  {siteConfig.title}
                </p>

                <p
                  className="hero-in hx-muted font-data text-base sm:text-lg"
                  style={{ animationDelay: '0.3s' }}
                  aria-label={`Focus areas: ${roles.join(', ')}`}
                >
                  <span className="hx-accent">&gt;</span>{' '}
                  <span aria-hidden="true">{typed}</span>
                  <span
                    aria-hidden="true"
                    className="hero-caret hx-dot ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px]"
                  />
                </p>

                <p
                  className="hero-in hx-muted max-w-xl text-lg leading-relaxed"
                  style={{ animationDelay: '0.4s' }}
                >
                  {siteConfig.aboutMe.split('.')[0]}.
                </p>
              </div>

              <ul
                className="hero-in flex flex-wrap gap-2"
                style={{ animationDelay: '0.5s' }}
                aria-label="Core stack"
              >
                {skills.map((s) => (
                  <li key={s} className="hx-chip rounded-md px-3 py-1 font-data text-xs">
                    {s}
                  </li>
                ))}
              </ul>

              <div
                className="hero-in flex flex-wrap items-center gap-4"
                style={{ animationDelay: '0.6s' }}
              >
                <a
                  href="#projects"
                  className="hx-btn-primary inline-flex items-center gap-2 rounded-lg px-7 py-3.5 font-semibold"
                >
                  View projects
                </a>
                <a
                  href={siteConfig.resume}
                  download
                  className="hx-btn-ghost inline-flex items-center gap-2 rounded-lg px-7 py-3.5 font-semibold"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v10m0 0l-4-4m4 4l4-4M5 20h14" />
                  </svg>
                  Download resume
                </a>

                <div className="flex gap-2 sm:ml-2">
                  {siteConfig.social?.github && (
                    <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hx-social flex h-11 w-11 items-center justify-center rounded-lg">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  )}
                  {siteConfig.social?.linkedin && (
                    <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hx-social flex h-11 w-11 items-center justify-center rounded-lg">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                  {siteConfig.social?.email && (
                    <a href={`mailto:${siteConfig.social.email}`} aria-label="Email" className="hx-social flex h-11 w-11 items-center justify-center rounded-lg">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {siteConfig.profileImage && (
          <div className="hero-badge-anchor">
            <LanyardBadge
              className="hero-lanyard"
              height="100%"
              background="transparent"
              photo="/images/profile.png"
              name={siteConfig.name}
              role="AI/ML Engineer"
              title="AI Engineer"
              cardWidth={260}
              anchorX={0.76}
              physicsHeight="responsive"
              dragLimitSelector="#intro-video"
              skills={skills}
              accentColor={isDark ? '#38bdf8' : (siteConfig.accentColor || '#2563eb')}
              inkColor={isDark ? '#7dd3fc' : '#1d4ed8'}
              cardColor={isDark ? '#101827' : '#f8fafc'}
              textColor={isDark ? '#e8edf7' : '#0f172a'}
              flipButton={false}
            />
          </div>
        )}

        <a
          href="#intro-video"
          className="hx-scroll absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 font-data text-xs md:flex"
        >
          watch my intro
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>

    </>
  );
}

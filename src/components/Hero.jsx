import { useEffect, useMemo, useRef, useState } from 'react';
import { siteConfig } from '../config';
import { useSiteTheme } from './useSiteTheme.jsx';

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

const PHOTO_ON_LEFT = false; // set true to put the photo frame on the left on desktop

const FALLBACK_ROLES = [
  'Computer vision systems',
  'Deep learning research',
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

/* ---------- live "inference" simulation (decorative) ---------- */
// Box positions are percentages of the photo frame. Tweak to fit your photo.
const TARGETS = [
  { label: 'person', base: 0.99, left: 12, top: 12, width: 76, height: 79 },
  { label: 'face', base: 0.98, left: 29, top: 15, width: 42, height: 31 },
];

function usePrefersReducedMotion() {
  const [reduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  return reduce;
}

function useLiveInference(disabled) {
  const [state, setState] = useState(() => ({
    latency: 12.4,
    history: Array.from({ length: 24 }, (_, i) => 12.4 + Math.sin(i / 2.2) * 1.1),
    jitter: 0,
    target: 0,
  }));

  // metrics tick
  useEffect(() => {
    if (disabled) return undefined;
    const id = setInterval(() => {
      setState((p) => {
        const latency = Math.min(15.5, Math.max(10.2, p.latency + (Math.random() - 0.5) * 1.4));
        return { ...p, latency, history: [...p.history.slice(1), latency], jitter: Math.random() };
      });
    }, 900);
    return () => clearInterval(id);
  }, [disabled]);

  // tracker hops between targets
  useEffect(() => {
    if (disabled) return undefined;
    const id = setInterval(() => {
      setState((p) => ({ ...p, target: (p.target + 1) % TARGETS.length }));
    }, 2800);
    return () => clearInterval(id);
  }, [disabled]);

  return state;
}

function Sparkline({ values }) {
  const min = 9;
  const max = 16;
  const w = 56;
  const h = 20;
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / (max - min)) * (h - 4)).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function Hero({ theme: themeOverride } = {}) {
  const roles = useMemo(
    () => (siteConfig.roles?.length ? siteConfig.roles : FALLBACK_ROLES),
    []
  );
  const skills = (siteConfig.skills?.length ? siteConfig.skills : FALLBACK_SKILLS).slice(0, 6);
  const typed = useTyped(roles);

  const reduceMotion = usePrefersReducedMotion();
  const live = useLiveInference(reduceMotion);
  const target = TARGETS[live.target];
  const confidence = Math.min(0.99, target.base - live.jitter * 0.015).toFixed(2);
  const fps = Math.round(1000 / live.latency);

  // pointer-driven tilt + crosshair (written straight to the DOM: no re-renders)
  const [photoAspect, setPhotoAspect] = useState(0.8); // width / height of your photo
  const frameRef = useRef(null);
  const coordRef = useRef(null);

  const onFrameMove = (e) => {
    if (reduceMotion || e.pointerType === 'touch' || !frameRef.current) return;
    const el = frameRef.current;
    const r = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    el.style.setProperty('--ry', `${((px - 0.5) * 10).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - py) * 8).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    el.dataset.hover = '1';
    if (coordRef.current) coordRef.current.textContent = `x ${px.toFixed(2)}  y ${py.toFixed(2)}`;
  };

  const onFrameLeave = () => {
    const el = frameRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.dataset.hover = '0';
  };

  const projectCount = siteConfig.projects?.length || 7;
  const experienceCount = siteConfig.experience?.length || 1;
  const status = siteConfig.status || 'open to work';

  const site = useSiteTheme();
  const isDark = themeOverride ? themeOverride === 'dark' : site.dark;

  // Use the page's real background so the hero blends into the rest of the site.
  // (Skipped when the theme is forced via the `theme` prop.)
  const rootStyle = {
    ...(siteConfig.accentColor ? { '--accent': siteConfig.accentColor } : {}),
  };

  const specRows = [
    ['projects', `${projectCount}+`],
    ['experience', `${experienceCount}+ yr`],
    ['status', status],
  ];

  return (
    <>
      <div
        id="hero"
        className="hero-root relative flex min-h-screen items-center overflow-hidden"
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
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-24 md:pb-20 md:pt-28 lg:pb-10 lg:pt-24">
          <div
            className={`grid items-start gap-14 lg:gap-12 ${
              PHOTO_ON_LEFT ? 'lg:grid-cols-[auto_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_auto]'
            }`}
          >
            {/* Text column */}
            <div
              className={`order-2 space-y-8 ${
                PHOTO_ON_LEFT ? 'lg:order-2' : 'lg:order-1'
              }`}
            >
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

            {/* Photo frame + model card */}
            {siteConfig.profileImage && (
              <div
                className={`hero-in hero-photo-col order-1 mx-auto flex w-full max-w-sm flex-col gap-5 lg:mx-0 lg:max-w-none lg:flex-row lg:items-stretch ${
                  PHOTO_ON_LEFT ? 'lg:order-1' : 'lg:order-2'
                }`}
                style={{ animationDelay: '0.25s', '--photo-aspect': photoAspect }}
              >
                <div
                  ref={frameRef}
                  className="hero-tilt relative"
                  data-hover="0"
                  onPointerMove={onFrameMove}
                  onPointerLeave={onFrameLeave}
                >
                  {/* rulers */}
                  <span aria-hidden="true" className="hero-ruler-y absolute -left-4 bottom-0 top-0 w-2.5" />
                  <span aria-hidden="true" className="hero-ruler-x absolute -top-4 left-0 right-0 h-2.5" />

                  <div
                    className="hx-frame relative w-full overflow-hidden rounded-[1.75rem]"
                    style={{ aspectRatio: photoAspect }}
                  >
                    <img
                      ref={(img) => {
                        if (img?.complete && img.naturalWidth) setPhotoAspect(img.naturalWidth / img.naturalHeight);
                      }}
                      src={siteConfig.profileImage}
                      alt={siteConfig.name}
                      className="h-full w-full object-cover"
                      loading="eager"
                      onLoad={(e) => setPhotoAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                    />
                    <div className="hero-photo-fade absolute inset-0" />

                    {/* tracker box: hops between targets, confidence updates live */}
                    <div
                      aria-hidden="true"
                      className="hx-box hero-track absolute rounded-sm"
                      style={{
                        left: `${target.left}%`,
                        top: `${target.top}%`,
                        width: `${target.width}%`,
                        height: `${target.height}%`,
                      }}
                    >
                      <span className="hx-box-label absolute -top-px left-[-2px] -translate-y-full whitespace-nowrap px-2 py-0.5 font-data text-[11px] font-medium tabular-nums">
                        {target.label} {confidence}
                      </span>
                    </div>

                    <div aria-hidden="true" className="hero-scan hx-scan absolute inset-x-0 h-px" />

                    {[
                      'left-3 top-3 border-l-2 border-t-2',
                      'right-3 top-3 border-r-2 border-t-2',
                      'bottom-3 left-3 border-b-2 border-l-2',
                      'bottom-3 right-3 border-b-2 border-r-2',
                    ].map((c) => (
                      <span key={c} aria-hidden="true" className={`hx-bracket absolute h-5 w-5 ${c}`} />
                    ))}

                    {/* crosshair + glare follow the pointer */}
                    <div aria-hidden="true" className="hero-cross hero-cross-x pointer-events-none absolute inset-x-0 h-px" />
                    <div aria-hidden="true" className="hero-cross hero-cross-y pointer-events-none absolute inset-y-0 w-px" />
                    <div aria-hidden="true" className="hero-glare pointer-events-none absolute inset-0" />
                    <span
                      ref={coordRef}
                      aria-hidden="true"
                      className="hero-coords hx-box-label pointer-events-none absolute bottom-3 right-10 px-2 py-0.5 font-data text-[10px] tabular-nums"
                    >
                      x 0.00  y 0.00
                    </span>
                  </div>
                </div>

                {/* model card */}
                <div className="hx-card flex flex-col overflow-hidden rounded-[1.75rem] font-data text-sm lg:w-[16.5rem] lg:shrink-0">
                  <div className="hx-card-head flex items-center justify-between px-4 py-2 text-xs">
                    <span>model_card</span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full hx-dot" />
                      ready
                    </span>
                  </div>
                  <dl className="flex flex-1 flex-col">
                    {specRows.map(([k, v]) => (
                      <div key={k} className="hx-row grid flex-1 grid-cols-[5.25rem_1fr] items-center gap-3 px-4 py-2">
                        <dt className="hx-muted">{k}</dt>
                        <dd className="hx-text break-words">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* live telemetry */}
                  <div className="hx-card-head hx-card-sep flex items-center justify-between px-4 py-2 text-xs">
                    <span>inference</span>
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 hx-dot" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full hx-dot" />
                      </span>
                      live
                    </span>
                  </div>
                  <div className="hx-row grid flex-1 grid-cols-[5.25rem_1fr] items-center gap-3 px-4 py-2">
                    <span className="hx-muted">latency</span>
                    <span className="hx-text flex items-center justify-between gap-3 tabular-nums">
                      {live.latency.toFixed(1)} ms
                      <Sparkline values={live.history} />
                    </span>
                  </div>
                  <div className="hx-row grid flex-1 grid-cols-[5.25rem_1fr] items-center gap-3 px-4 py-2">
                    <span className="hx-muted">throughput</span>
                    <span className="hx-text tabular-nums">{fps} fps</span>
                  </div>
                  <div className="hx-row grid flex-1 grid-cols-[5.25rem_1fr] items-center gap-3 px-4 py-2">
                    <span className="hx-muted">confidence</span>
                    <span className="hx-text flex items-center justify-between gap-3 tabular-nums">
                      {confidence}
                      <span className="hx-meter relative h-1.5 w-[56px] overflow-hidden rounded-full">
                        <span
                          className="hx-meter-fill absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${Number(confidence) * 100}%` }}
                        />
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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

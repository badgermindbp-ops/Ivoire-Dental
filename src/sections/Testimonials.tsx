import { useEffect, useRef } from 'react'
import { clinic, type Testimonial } from '../config/clinic'
import { gsap, useGSAP } from '../lib/gsap'
import { prefersReducedMotion } from '../lib/env'
import SplitWords from '../components/ui/SplitWords'

/** Strips the config's sample prefix for display (the card shows a "Sample" chip instead). */
const cleanQuote = (q: string) => {
  const s = q.replace(/^Sample testimonial — /, '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Card({ t, hidden }: { t: Testimonial; hidden?: boolean }) {
  const initials = t.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <figure
      aria-hidden={hidden || undefined}
      className="relative flex w-[82vw] shrink-0 flex-col justify-between border-l border-navy/12 px-6 py-2 sm:w-[56vw] lg:w-[34vw] lg:px-10"
    >
      <svg width="34" height="26" viewBox="0 0 34 26" className="mb-6 text-azure" aria-hidden>
        <path d="M0 26V14C0 5 5 0 13 0v5c-4 0-7 3-7 8h7v13Zm20 0V14C20 5 25 0 33 0v5c-4 0-7 3-7 8h7v13Z" fill="currentColor" />
      </svg>
      <blockquote className="serif-accent text-[clamp(1.45rem,2.3vw,2.2rem)] leading-[1.18] text-navy">“{cleanQuote(t.quote)}”</blockquote>
      <figcaption className="mt-8 flex items-center gap-4">
        {t.portrait ? (
          <img src={t.portrait} alt="" className="h-12 w-12 rounded-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky to-azure text-sm font-semibold text-navy" aria-hidden>
            {initials}
          </span>
        )}
        <span className="flex flex-col">
          <span className="font-medium text-navy">{t.name}</span>
          <span className="text-sm text-navy/55">{t.treatment}</span>
        </span>
        {t.verified && t.rating ? (
          <span className="ml-auto text-sm text-gold" aria-label={`Rated ${t.rating} out of 5`}>
            {'★'.repeat(t.rating)}
          </span>
        ) : (
          <span className="eyebrow ml-auto rounded-full bg-gold/15 px-2.5 py-1 text-[0.55rem] text-[#8a6d2f]">Sample</span>
        )}
      </figcaption>
    </figure>
  )
}

/** Auto-drifting editorial carousel with drag, inertia and pause-on-hover. */
export default function Testimonials() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const state = useRef({ x: 0, v: 0, hover: false, drag: false, lastX: 0, half: 1 })

  useEffect(() => {
    const el = track.current!
    const s = state.current
    const measure = () => (s.half = el.scrollWidth / 2)
    measure()
    window.addEventListener('resize', measure)
    const reduced = prefersReducedMotion()
    const tick = (_t: number, dtMs: number) => {
      const dt = Math.min(dtMs, 50) / 1000
      if (!s.drag) {
        const auto = reduced || s.hover ? 0 : -40
        s.v += (auto - s.v) * (1 - Math.exp(-dt * 2.5))
        s.x += s.v * dt
      }
      // seamless wrap
      if (s.x <= -s.half) s.x += s.half
      if (s.x > 0) s.x -= s.half
      el.style.transform = `translate3d(${s.x}px,0,0)`
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', measure)
    }
  }, [])

  useGSAP(
    () => {
      gsap.from('[data-tm-title] .word', { yPercent: 110, stagger: 0.05, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '[data-tm-title]', start: 'top 85%' } })
    },
    { scope: section },
  )

  const nudge = (dir: number) => {
    const s = state.current
    const w = (track.current?.firstElementChild as HTMLElement)?.offsetWidth ?? 400
    gsap.to(s, { x: s.x - dir * w, duration: 0.9, ease: 'expo.out' })
  }

  const items = clinic.testimonials
  return (
    <section id="testimonials" ref={section} aria-labelledby="tm-title" className="relative overflow-hidden bg-pearl py-24 lg:py-36">
      <div className="mb-14 flex flex-col gap-6 px-5 sm:px-8 lg:mb-20 lg:flex-row lg:items-end lg:justify-between lg:px-14">
        <div data-tm-title>
          <p className="eyebrow mb-5 text-navy/55">Patient stories</p>
          <SplitWords id="tm-title" as="h2" text="Smiles, in their own words." accent={['words.']} className="display text-[clamp(2.3rem,5vw,4.8rem)] text-navy" wordClassName="[&.serif-accent]:text-cobalt" />
        </div>
        <div className="flex items-center gap-3">
          <p className="mr-4 max-w-[16rem] text-xs leading-relaxed text-navy/50">
            Sample placeholders shown. Publish only verified reviews shared with patient consent.
          </p>
          {[-1, 1].map((d) => (
            <button
              key={d}
              onClick={() => nudge(d)}
              aria-label={d < 0 ? 'Previous testimonial' : 'Next testimonial'}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-navy/15 text-navy transition hover:border-navy hover:bg-navy hover:text-ivory"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className={d < 0 ? 'rotate-180' : ''}>
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" fill="none" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div
        className="cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
        onMouseEnter={() => (state.current.hover = true)}
        onMouseLeave={() => {
          state.current.hover = false
          state.current.drag = false
        }}
        onPointerDown={(e) => {
          state.current.drag = true
          state.current.lastX = e.clientX
          state.current.v = 0
        }}
        onPointerMove={(e) => {
          const s = state.current
          if (!s.drag) return
          const dx = e.clientX - s.lastX
          s.lastX = e.clientX
          s.x += dx
          s.v = dx * 60
        }}
        onPointerUp={() => (state.current.drag = false)}
        onPointerCancel={() => (state.current.drag = false)}
      >
        <div ref={track} className="flex w-max will-change-transform" role="list" aria-label="Patient testimonials">
          {[...items, ...items].map((t, i) => (
            <div role="listitem" key={`${t.id}-${i}`} className="flex" aria-hidden={i >= items.length || undefined}>
              <Card t={t} hidden={i >= items.length} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

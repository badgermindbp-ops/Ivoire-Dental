import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import { clinic, type Treatment } from '../config/clinic'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { MQ, hasWebGL } from '../lib/env'
import { store, useStore } from '../lib/store'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useInView } from '../lib/useInView'
import TreatmentArt from '../components/TreatmentArt'
import TreatmentPanel from '../components/TreatmentPanel'
import ToothFallback from '../components/ToothFallback'
import { specimenInput } from '../lib/sceneInputs'

const SceneCanvas = lazy(() => import('../three/SceneCanvas'))
const SpecimenScene = lazy(() => import('../three/SpecimenScene'))

const N = clinic.treatments.length
const pad = (n: number) => String(n).padStart(2, '0')

function Card({
  t,
  i,
  onOpen,
  onHover,
}: {
  t: Treatment
  i: number
  onOpen: (t: Treatment) => void
  onHover: (i: number | null) => void
}) {
  const reveal = useRef<HTMLDivElement>(null)
  const active = useStore((s) => s.activeTreatment === i)

  const move = (e: React.MouseEvent) => {
    const el = reveal.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <article
      data-card
      className={`group relative flex h-full w-[78vw] shrink-0 snap-center flex-col border-l border-navy/12 pl-5 transition-opacity duration-700 sm:w-[46vw] lg:w-[clamp(290px,25vw,380px)] lg:pl-6 ${
        active ? 'opacity-100' : 'lg:opacity-55 lg:hover:opacity-100'
      }`}
      onMouseEnter={() => onHover(i)}
      onMouseLeave={() => onHover(null)}
      onMouseMove={move}
    >
      <div className="mb-5 flex items-baseline justify-between">
        <span className="eyebrow text-cobalt">{pad(i + 1)}</span>
        <span className="eyebrow text-navy/40">{t.duration}</span>
      </div>

      {/* image area: light drawing + blueprint layer revealed through a cursor mask */}
      <div data-card-art className="relative aspect-[4/3.4] w-full overflow-hidden bg-porcelain lg:aspect-auto lg:min-h-0 lg:flex-1">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: `radial-gradient(90% 80% at ${30 + i * 7}% 20%, #ffffff 0%, #e8eef7 55%, #d4e0ef 100%)` }}
        />
        <TreatmentArt id={t.id} className="absolute inset-[10%] h-[80%] w-[80%] text-navy/70 transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]" />
        <div
          ref={reveal}
          aria-hidden
          className="absolute inset-0 bg-navy text-sky [clip-path:circle(0px_at_var(--mx,50%)_var(--my,50%))] transition-[clip-path] duration-[900ms] ease-[var(--ease-out-expo)] group-hover:[clip-path:circle(150%_at_var(--mx,50%)_var(--my,50%))] group-focus-within:[clip-path:circle(150%_at_50%_50%)]"
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'linear-gradient(#7fa8d8 1px, transparent 1px), linear-gradient(90deg, #7fa8d8 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          />
          <TreatmentArt id={t.id} className="absolute inset-[10%] h-[80%] w-[80%] scale-[1.06]" />
          <span className="eyebrow absolute left-4 top-4 text-sky/70">Blueprint · {pad(i + 1)}</span>
        </div>
      </div>

      <div className="pt-5">
        <h3 className="mb-2 text-[clamp(1.45rem,2.1vw,1.9rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-navy">{t.name}</h3>
        <p className="serif-accent text-lg leading-snug text-navy/70">{t.short}</p>
        {/* expands smoothly on hover / focus */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-700 ease-[var(--ease-out-expo)] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] max-lg:grid-rows-[1fr]">
          <ul className="overflow-hidden">
            {t.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2 pt-2 text-sm text-navy/65 first:pt-4">
                <span className="h-px w-3 bg-cobalt" aria-hidden />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* stretched accessible trigger */}
      <button
        className="absolute inset-0 z-10 cursor-pointer lg:cursor-none"
        aria-label={`View details: ${t.name}`}
        onClick={() => onOpen(t)}
        onFocus={() => onHover(i)}
        onBlur={() => onHover(null)}
      />
    </article>
  )
}

export default function Treatments() {
  const section = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const region = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const line = useRef<SVGPathElement>(null)
  const dot = useRef<SVGCircleElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const progressBar = useRef<HTMLDivElement>(null)
  const scrollActive = useRef(0)
  const pinned = useMediaQuery(MQ.desktop)
  const active = useStore((s) => s.activeTreatment)
  const [open, setOpen] = useState<Treatment | null>(null)
  const closePanel = useCallback(() => setOpen(null), [])
  const near = useInView(section, '120% 0px', true)
  const [webgl] = useState(hasWebGL)

  /** draws the connecting line from the specimen stage to the active card */
  const drawLine = useCallback(() => {
    if (!pinned || !pin.current || !stage.current || !line.current) return
    const cards = pin.current.querySelectorAll<HTMLElement>('[data-card-art]')
    const card = cards[store.get().activeTreatment]
    if (!card) return
    const base = pin.current.getBoundingClientRect()
    const s = stage.current.getBoundingClientRect()
    const c = card.getBoundingClientRect()
    const sx = s.right - base.left - 40
    const sy = s.top + s.height * 0.5 - base.top
    const ex = Math.max(c.left - base.left, sx + 40)
    const ey = c.top + c.height * 0.5 - base.top
    const mx = (sx + ex) / 2
    line.current.setAttribute('d', `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`)
    dot.current?.setAttribute('cx', String(ex))
    dot.current?.setAttribute('cy', String(ey))
  }, [pinned])

  useGSAP(
    () => {
      if (!pinned) return
      const distance = () => track.current!.scrollWidth - region.current!.clientWidth + 40
      const tween = gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin.current,
          start: 'top top',
          end: () => `+=${distance() * 1.15}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (st) => {
            const idx = Math.min(N - 1, Math.round(st.progress * (N - 1)))
            scrollActive.current = idx
            if (store.get().activeTreatment !== idx) store.set({ activeTreatment: idx })
            if (progressBar.current) progressBar.current.style.transform = `scaleX(${st.progress})`
            drawLine()
          },
        },
      })
      // images reveal through masks as each card enters the horizontal viewport
      gsap.utils.toArray<HTMLElement>('[data-card-art]', pin.current).forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(0% 0% 0% 100%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'power2.out',
            scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left 105%', end: 'left 60%', scrub: true },
          },
        )
      })
      requestAnimationFrame(drawLine)
      // cursor-following "view" bubble
      const xTo = gsap.quickTo(bubble.current, 'x', { duration: 0.5, ease: 'power3.out' })
      const yTo = gsap.quickTo(bubble.current, 'y', { duration: 0.5, ease: 'power3.out' })
      const onMove = (e: PointerEvent) => {
        const r = pin.current!.getBoundingClientRect()
        xTo(e.clientX - r.left)
        yTo(e.clientY - r.top)
      }
      pin.current!.addEventListener('pointermove', onMove)
      return () => pin.current?.removeEventListener('pointermove', onMove)
    },
    { dependencies: [pinned], scope: section, revertOnUpdate: true },
  )

  const onHover = (i: number | null) => {
    specimenInput.hover = i === null ? 0 : 1
    store.set({ activeTreatment: i ?? scrollActive.current })
    if (bubble.current) gsap.to(bubble.current, { scale: i === null ? 0 : 1, duration: 0.45, ease: 'power3.out' })
    requestAnimationFrame(drawLine)
  }

  // mobile rail: active card follows native horizontal scroll
  const onRailScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (pinned) return
    const el = e.currentTarget
    const cards = el.querySelectorAll<HTMLElement>('[data-card]')
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestD = Infinity
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    if (store.get().activeTreatment !== best) store.set({ activeTreatment: best })
  }

  const specimen = (
    <div className="relative h-full w-full">
      <div
        aria-hidden
        className="absolute left-1/2 top-[46%] aspect-square w-[min(78%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, #c9d8ec 0%, #dde6f2 45%, rgba(227,234,244,0) 70%)' }}
      />
      <div aria-hidden className="absolute left-1/2 top-[46%] aspect-square w-[min(62%,330px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy/10" />
      {near &&
        (webgl ? (
          <Suspense fallback={null}>
            <SceneCanvas label={`3D model illustrating ${clinic.treatments[active].name}`} className="h-full w-full" camera={{ position: [0, 0.25, 5.4], fov: 32 }}>
              <SpecimenScene />
            </SceneCanvas>
          </Suspense>
        ) : (
          <div className="flex h-full items-center justify-center">
            <ToothFallback className="h-2/3 w-auto" />
          </div>
        ))}
    </div>
  )

  return (
    <section id="treatments" ref={section} aria-labelledby="treatments-title" className="relative bg-porcelain">
      <div ref={pin} className={`relative overflow-hidden ${pinned ? 'h-[100svh] min-h-[680px]' : 'py-20'}`}>
        <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #fbfaf6 0%, #eef2f8 60%, #e3eaf4 100%)' }} />

        <header className={`relative z-10 px-5 sm:px-8 lg:px-14 ${pinned ? 'absolute left-0 top-0 pt-28' : ''}`}>
          <p className="eyebrow mb-4 text-navy/60">Treatments</p>
          <h2 id="treatments-title" className="display max-w-[11ch] text-[clamp(2.4rem,4.6vw,4.4rem)] text-navy">
            Eight ways to a <span className="serif-accent text-cobalt">better</span> smile.
          </h2>
        </header>

        {/* specimen stage */}
        <div
          ref={stage}
          className={
            pinned
              ? 'absolute bottom-[6%] left-0 top-[30%] w-[38%]'
              : 'relative mx-auto mt-6 h-[44vh] max-h-[420px] w-full max-w-[520px]'
          }
        >
          {specimen}
          <div className={`absolute bottom-2 left-5 right-5 flex items-end justify-between sm:left-8 lg:left-14 lg:right-10`}>
            <div aria-live="polite">
              <p className="eyebrow text-navy/45">
                {pad(active + 1)} / {pad(N)}
              </p>
              <p className="serif-accent text-2xl text-navy lg:text-3xl">{clinic.treatments[active].name}</p>
            </div>
            {pinned && (
              <div className="mb-2 h-px w-24 bg-navy/15">
                <div ref={progressBar} className="h-full origin-left scale-x-0 bg-cobalt" />
              </div>
            )}
          </div>
        </div>

        {/* connecting line */}
        {pinned && (
          <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full" aria-hidden>
            <path ref={line} fill="none" stroke="#2f63b5" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="4 6">
              <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="1.6s" repeatCount="indefinite" />
            </path>
            <circle ref={dot} r="4" fill="#2f63b5" />
          </svg>
        )}

        {/* horizontal track */}
        <div
          ref={region}
          className={
            pinned
              ? 'absolute bottom-[8%] left-[40%] right-0 top-[16%] overflow-hidden'
              : 'no-scrollbar relative mt-10 snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-5 sm:px-8'
          }
          onScroll={onRailScroll}
          style={pinned ? { maskImage: 'linear-gradient(90deg, transparent 0, #000 6%, #000 100%)' } : undefined}
        >
          <div ref={track} className={`flex h-full gap-8 lg:gap-12 ${pinned ? 'pl-[6%] pr-[8vw]' : 'pr-5'}`}>
            {clinic.treatments.map((t, i) => (
              <Card key={t.id} t={t} i={i} onOpen={setOpen} onHover={pinned ? onHover : () => {}} />
            ))}
          </div>
        </div>

        {pinned && (
          <div
            ref={bubble}
            aria-hidden
            style={{ transform: 'scale(0)' }}
            className="pointer-events-none absolute left-0 top-0 z-20 -ml-12 -mt-12 flex h-24 w-24 items-center justify-center rounded-full bg-navy text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ivory"
          >
            View
          </div>
        )}
        {!pinned && <p className="eyebrow mt-6 px-5 text-navy/40 sm:px-8">Swipe to explore · tap for details</p>}
      </div>
      <TreatmentPanel treatment={open} onClose={closePanel} />
    </section>
  )
}

// keep ScrollTrigger in sync once fonts settle (card heights depend on them)
if (typeof document !== 'undefined') document.fonts?.ready.then(() => ScrollTrigger.refresh())

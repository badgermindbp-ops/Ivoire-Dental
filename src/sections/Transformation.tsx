import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { prefersReducedMotion } from '../lib/env'
import SmileIllustration from '../components/SmileIllustration'
import SplitWords from '../components/ui/SplitWords'

/** Interactive before/after comparison — pointer, touch and keyboard accessible. */
export default function Transformation() {
  const section = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)
  const posObj = useRef({ v: 50 })

  const setFromClient = (clientX: number) => {
    const r = frame.current!.getBoundingClientRect()
    const v = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))
    posObj.current.v = v
    setPos(v)
  }

  useGSAP(
    () => {
      gsap.from('[data-tf-title] .word', {
        yPercent: 110,
        stagger: 0.05,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-tf-title]', start: 'top 85%' },
      })
      gsap.fromTo(frame.current, { clipPath: 'inset(12% 8% 12% 8% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: frame.current, start: 'top 95%', end: 'top 35%', scrub: true } })
      if (prefersReducedMotion()) return
      // a smooth sweep that shows off the comparison once
      posObj.current.v = 88
      setPos(88)
      gsap.to(posObj.current, {
        v: 50,
        duration: 1.8,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: frame.current, start: 'top 60%' },
        onUpdate: () => !dragging.current && setPos(posObj.current.v),
      })
    },
    { scope: section },
  )

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 5
    let v = pos
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= step
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += step
    else if (e.key === 'Home') v = 0
    else if (e.key === 'End') v = 100
    else return
    e.preventDefault()
    setPos(Math.min(100, Math.max(0, v)))
  }

  return (
    <section ref={section} aria-labelledby="tf-title" className="relative bg-ivory px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
      <div className="mb-12 grid gap-6 lg:grid-cols-2 lg:items-end">
        <div data-tf-title>
          <p className="eyebrow mb-5 text-navy/55">The smile transformation</p>
          <SplitWords id="tf-title" as="h2" text="See the difference design makes." accent={['design']} className="display text-[clamp(2.3rem,5vw,4.8rem)] text-navy" wordClassName="[&.serif-accent]:text-cobalt" />
        </div>
        <p className="max-w-md text-navy/65 lg:justify-self-end">
          Drag the handle to compare. Every plan is previewed digitally first, so you approve the destination before treatment begins.
        </p>
      </div>

      <div
        ref={frame}
        className="relative aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
          setFromClient(e.clientX)
        }}
        onPointerMove={(e) => dragging.current && setFromClient(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <SmileIllustration variant="after" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <SmileIllustration variant="before" className="absolute inset-0 h-full w-full" />
        </div>

        <span className="eyebrow pointer-events-none absolute left-4 top-4 rounded-full bg-navy/70 px-3 py-1.5 text-ivory backdrop-blur transition-opacity sm:left-6 sm:top-6" style={{ opacity: pos > 12 ? 1 : 0 }}>
          Before
        </span>
        <span className="eyebrow pointer-events-none absolute right-4 top-4 rounded-full bg-ivory/85 px-3 py-1.5 text-navy backdrop-blur transition-opacity sm:right-6 sm:top-6" style={{ opacity: pos < 88 ? 1 : 0 }}>
          After
        </span>
        <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ivory/80 px-3 py-1 text-[0.65rem] tracking-wide text-navy/70 backdrop-blur">
          Illustrative example — not a patient result
        </span>

        {/* handle */}
        <div className="pointer-events-none absolute inset-y-0 w-px bg-ivory shadow-[0_0_20px_rgba(0,0,0,0.25)]" style={{ left: `${pos}%` }}>
          <div
            role="slider"
            tabIndex={0}
            aria-label="Before and after comparison"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={`${Math.round(pos)}% before`}
            onKeyDown={onKey}
            className="pointer-events-auto absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-navy shadow-xl backdrop-blur transition-transform hover:scale-110"
          >
            <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden>
              <path d="M7 2L2 7l5 5M21 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}

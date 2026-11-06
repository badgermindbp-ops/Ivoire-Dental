import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import { prefersReducedMotion } from '../lib/env'
import { store } from '../lib/store'
import { startScroll, stopScroll } from '../lib/smoothScroll'
import { clinic } from '../config/clinic'

const TOOTH =
  'M60 18c-9-8-25-10-34-2-10 9-7 27 1 39 4 6 4 13 5 20 1 8 3 17 9 17 6 0 7-10 8-17 1-5 4-9 11-9s10 4 11 9c1 7 2 17 8 17 6 0 8-9 9-17 1-7 1-14 5-20 8-12 11-30 1-39-9-8-25-6-34 2Z'

/**
 * Opening sequence: the tooth mascot draws itself, blinks awake, the wordmark
 * reveals, and a curtain lifts once the 3D hero has rendered its first frame.
 */
export default function Loader({ until }: { until: Promise<void> }) {
  const root = useRef<HTMLDivElement>(null)
  const pct = useRef<HTMLSpanElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    stopScroll()
    const reduced = prefersReducedMotion()
    const q = (s: string) => root.current!.querySelectorAll(s)
    const counter = { v: 0 }
    const minTime = reduced ? 0.3 : 2.2
    const ready = Promise.all([
      until,
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((r) => setTimeout(r, minTime * 1000)),
    ])
    // never trap visitors behind the loader
    const timeout = new Promise((r) => setTimeout(r, 7000))

    const tl = gsap.timeline()
    if (!reduced) {
      tl.fromTo(q('[data-ld-outline]'), { strokeDashoffset: 420 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' })
        .to(q('[data-ld-fill]'), { opacity: 1, duration: 0.6 }, '-=0.4')
        .fromTo(q('[data-ld-eye]'), { scaleY: 0 }, { scaleY: 1, duration: 0.25, stagger: 0.05, transformOrigin: 'center', ease: 'back.out(3)' }, '-=0.2')
        .fromTo(q('[data-ld-smile]'), { strokeDashoffset: 40 }, { strokeDashoffset: 0, duration: 0.4 }, '-=0.1')
        .fromTo(q('[data-ld-letter]'), { yPercent: 110 }, { yPercent: 0, stagger: 0.04, duration: 0.9, ease: 'expo.out' }, 0.5)
        .fromTo(q('[data-ld-tag]'), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.1)
    } else {
      gsap.set(q('[data-ld-fill],[data-ld-tag]'), { opacity: 1 })
      gsap.set(q('[data-ld-outline],[data-ld-smile]'), { strokeDashoffset: 0 })
    }
    const count = gsap.to(counter, {
      v: 90,
      duration: minTime + 0.6,
      ease: 'power1.out',
      onUpdate: () => pct.current && (pct.current.textContent = String(Math.round(counter.v)).padStart(3, '0')),
    })

    let cancelled = false
    Promise.race([ready, timeout]).then(() => {
      if (cancelled) return
      count.kill()
      gsap
        .timeline({
          onComplete: () => {
            setDone(true)
          },
        })
        .to(counter, {
          v: 100,
          duration: 0.4,
          onUpdate: () => pct.current && (pct.current.textContent = String(Math.round(counter.v)).padStart(3, '0')),
        })
        .add(() => {
          startScroll()
          store.set({ ready: true })
        })
        .to(q('[data-ld-inner]'), { y: -40, opacity: 0, duration: reduced ? 0.2 : 0.7, ease: 'power3.in' })
        .to(root.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: reduced ? 0.3 : 1.1, ease: 'expo.inOut' }, '-=0.3')
    })
    return () => {
      cancelled = true
      tl.kill()
    }
  }, [until])

  if (done) return null
  return (
    <div
      ref={root}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-ivory"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${clinic.name}`}
    >
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 50% 45%, #ffffff 0%, #eef2f8 60%, #e3eaf4 100%)' }} />
      <div data-ld-inner className="relative flex flex-col items-center">
        <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
          <defs>
            <radialGradient id="ld-g" cx="40%" cy="30%" r="80%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#dfe6f0" />
            </radialGradient>
          </defs>
          <path data-ld-fill d={TOOTH} fill="url(#ld-g)" opacity="0" />
          <path data-ld-outline d={TOOTH} fill="none" stroke="#0b1a33" strokeWidth="1.6" strokeDasharray="420" strokeLinejoin="round" />
          <ellipse data-ld-eye cx="47" cy="45" rx="3.4" ry="4.6" fill="#0b1a33" />
          <ellipse data-ld-eye cx="73" cy="45" rx="3.4" ry="4.6" fill="#0b1a33" />
          <path data-ld-smile d="M51 56c6 5 12 5 18 0" stroke="#0b1a33" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeDasharray="40" />
        </svg>
        <p className="mt-6 flex overflow-hidden text-[2.1rem] font-semibold tracking-[-0.04em] text-navy">
          {clinic.shortName.split('').map((c, i) => (
            <span key={i} data-ld-letter className="inline-block">
              {c}
            </span>
          ))}
        </p>
        <p data-ld-tag className="eyebrow mt-2 text-navy/50 opacity-0">
          {clinic.tagline}
        </p>
      </div>
      <span ref={pct} className="eyebrow absolute bottom-8 right-8 text-navy/40" aria-hidden>
        000
      </span>
    </div>
  )
}

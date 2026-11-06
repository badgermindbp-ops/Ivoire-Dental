import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { prefersReducedMotion } from '../../lib/env'

/** Scroll-triggered counter. Values must come from verified config data. */
export default function Counter({ to, suffix = '', className = '' }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useGSAP(() => {
    const el = ref.current!
    if (prefersReducedMotion()) {
      el.textContent = `${to}${suffix}`
      return
    }
    const o = { v: 0 }
    gsap.to(o, {
      v: to,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = `${Math.round(o.v)}${suffix}`),
    })
  })
  return (
    <span ref={ref} className={className} aria-label={`${to}${suffix}`}>
      0{suffix}
    </span>
  )
}

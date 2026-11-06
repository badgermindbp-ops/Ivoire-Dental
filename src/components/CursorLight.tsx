import { useEffect, useRef } from 'react'
import { isTouch, prefersReducedMotion } from '../lib/env'
import { pointer } from '../lib/pointer'
import { gsap } from '../lib/gsap'

/** Soft light that trails the cursor, blended over the page for a lit-glass feel. */
export default function CursorLight() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isTouch() || prefersReducedMotion()) return
    const el = ref.current!
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' })
    const tick = () => {
      xTo(pointer.px)
      yTo(pointer.py)
      el.style.opacity = pointer.active ? '1' : '0'
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[45] -ml-[300px] -mt-[300px] h-[600px] w-[600px] rounded-full opacity-0 mix-blend-soft-light transition-opacity duration-700"
      style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(160,200,255,0.18) 35%, transparent 65%)' }}
    />
  )
}

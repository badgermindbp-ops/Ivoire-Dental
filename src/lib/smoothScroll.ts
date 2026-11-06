import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './env'

let lenis: Lenis | null = null

/** Lenis smooth scrolling driven by the GSAP ticker so ScrollTrigger stays in lock-step. */
export function initSmoothScroll() {
  if (lenis || prefersReducedMotion()) return lenis
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function getLenis() {
  return lenis
}

export function stopScroll() {
  lenis?.stop()
  document.documentElement.style.overflow = 'hidden'
}
export function startScroll() {
  lenis?.start()
  document.documentElement.style.overflow = ''
}

/** Smooth anchor navigation that respects reduced motion and the fixed nav height. */
export function scrollToTarget(target: string | number | HTMLElement, offset = 0) {
  const el =
    typeof target === 'string' ? (document.querySelector(target) as HTMLElement | null) : target
  if (el === null) return
  if (lenis) {
    lenis.scrollTo(el as HTMLElement | number, { offset, duration: 1.6 })
  } else {
    const top =
      typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }
  if (typeof target === 'string' && target.startsWith('#')) {
    const focusEl = el as HTMLElement
    if (typeof focusEl !== 'number') {
      focusEl.setAttribute('tabindex', '-1')
      focusEl.focus({ preventScroll: true })
    }
  }
}

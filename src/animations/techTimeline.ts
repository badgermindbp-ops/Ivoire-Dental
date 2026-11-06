import { gsap } from '../lib/gsap'
import { MQ } from '../lib/env'

export const techState = { progress: 0 }

export const TECH_PHASES = [
  { at: 0, key: 'scan' },
  { at: 0.36, key: 'plan' },
  { at: 0.64, key: 'diagnose' },
  { at: 0.84, key: 'deliver' },
] as const

/** Camera, laser and phase changes are all scrubbed from scroll progress. */
export function createTechTimeline(r: { pin: HTMLElement; onPhase: (i: number) => void; onProgress: (p: number) => void }) {
  const mm = gsap.matchMedia()
  let last = -1
  const update = (p: number) => {
    techState.progress = p
    let idx = 0
    TECH_PHASES.forEach((ph, i) => p >= ph.at && (idx = i))
    if (idx !== last) {
      last = idx
      r.onPhase(idx)
    }
    r.onProgress(p)
  }

  mm.add(MQ.motion, () => {
    const st = { p: 0 }
    gsap.to(st, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: r.pin,
        start: 'top top',
        end: () => (window.innerWidth < 768 ? '+=220%' : '+=300%'),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
      onUpdate: () => update(st.p),
    })
  })

  // Reduced motion: show the finished plan with no scrubbing.
  mm.add(MQ.reduced, () => update(0.5))

  return () => mm.revert()
}

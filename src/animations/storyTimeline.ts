import { gsap } from '../lib/gsap'
import { MQ } from '../lib/env'
import { createMascotState } from '../three/mascotState'

export const storyState = { enter: 0, tilt: 0, leave: 0, progress: 0, elements: 0 }
export const storyMascot = createMascotState({ smile: 0.35, follow: 0.6, lookX: -1.6, lookY: 0.4 })

type Refs = {
  section: HTMLElement
  pin: HTMLElement
  words: HTMLElement[]
  lines: HTMLElement[]
  pillars: HTMLElement[]
  bgShift: HTMLElement
  heading: HTMLElement[]
}

/** Word-by-word scrubbed reveal; the mascot reacts as the sentence completes. */
export function createStoryTimeline(r: Refs) {
  const mm = gsap.matchMedia()

  mm.add({ desktop: MQ.desktop, tablet: MQ.tablet, mobile: MQ.mobile }, (ctx) => {
    const { mobile } = ctx.conditions as Record<string, boolean>

    gsap.set(r.words, { opacity: 0.12 })

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: r.pin,
        start: 'top top',
        end: mobile ? '+=120%' : '+=170%',
        pin: true,
        scrub: 0.8,
        onUpdate: (st) => (storyState.progress = st.progress),
      },
    })

    tl.fromTo(r.heading, { yPercent: 100 }, { yPercent: 0, duration: 0.08, stagger: 0.02, ease: 'power3.out' }, 0)
      .to(storyState, { enter: 1, elements: 1, duration: 0.18, ease: 'power2.out' }, 0)
      .to(r.words, { opacity: 1, duration: 0.05, stagger: 0.045 }, 0.06)
      .to(storyState, { tilt: 1, duration: 0.3, ease: 'sine.inOut' }, 0.08)
      // lines drift subtly with progress for editorial depth
      .fromTo(r.lines, { x: (i) => (i % 2 ? 40 : -20) }, { x: (i) => (i % 2 ? -20 : 30), duration: 0.8 }, 0)
      .to(storyMascot, { smile: 1, squint: 0.8, lookX: -0.4, lookY: 0, duration: 0.12 }, 0.5)
      .to(storyState, { tilt: -0.4, duration: 0.15 }, 0.5)
      .fromTo(r.pillars, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, stagger: 0.05, ease: 'power3.out' }, 0.62)
      .to(r.bgShift, { opacity: 1, duration: 0.4 }, 0.45)
      .to(storyMascot, { smile: 0.55, squint: 0, duration: 0.1 }, 0.82)
      .to(storyState, { leave: 1, duration: 0.18 }, 0.82)
  })

  mm.add(MQ.reduced, () => {
    Object.assign(storyState, { enter: 1, tilt: 0.3, elements: 1 })
    gsap.set(r.words, { opacity: 1 })
    gsap.set(r.pillars, { opacity: 1, y: 0 })
  })

  return () => mm.revert()
}

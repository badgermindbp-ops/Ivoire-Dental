import { gsap, ScrollTrigger } from '../lib/gsap'
import { MQ } from '../lib/env'
import { createMascotState } from '../three/mascotState'

/**
 * Hero scene state. GSAP tweens these plain numbers with a scrubbed
 * ScrollTrigger; the R3F scene damps toward them every frame.
 */
export const heroState = {
  intro: 0, // 0 → 1 entrance after the loader
  rotY: -0.55, // starts turned three-quarters, rotates to face the viewer
  x: 0,
  y: 0.02,
  scale: 1,
  camZ: 7,
  env: 0, // dental environment reveal
  streaks: 0, // light streak intensity
  exit: 0, // final hand-off to the story section
}
export const heroMascot = createMascotState({ smile: 0.3 })

type Refs = {
  section: HTMLElement
  words: HTMLElement[]
  support: HTMLElement[]
  supportWrap: HTMLElement[]
  bg: HTMLElement
  envBg: HTMLElement
  chapter: HTMLElement
}

/** Entrance played once the loader lifts. */
export function playHeroIntro(refs: Pick<Refs, 'words' | 'support'>, reduced: boolean) {
  if (reduced) {
    heroState.intro = 1
    gsap.set([...refs.words, ...refs.support], { opacity: 1, yPercent: 0, y: 0 })
    return
  }
  const tl = gsap.timeline()
  tl.to(heroState, { intro: 1, duration: 2.2, ease: 'expo.out' }, 0)
    .fromTo(refs.words, { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.07, ease: 'expo.out' }, 0.15)
    .fromTo(refs.support, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.08 }, 0.6)
    .to(heroMascot, { smile: 0.85, squint: 0.6, duration: 0.5, yoyo: true, repeat: 1, repeatDelay: 0.5 }, 1)
  return tl
}

/**
 * The pinned, scroll-scrubbed hero sequence. Scroll progress drives every
 * value — nothing is time-triggered.
 */
export function createHeroTimeline(refs: Refs) {
  const mm = gsap.matchMedia()

  mm.add(
    { desktop: MQ.desktop, tablet: MQ.tablet, mobile: MQ.mobile },
    (ctx) => {
      const { desktop, mobile } = ctx.conditions as Record<string, boolean>
      // mobile art direction: the character sits in the top half, above the headline
      if (mobile) Object.assign(heroState, { y: 0.62, scale: 0.78 })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: refs.section,
          start: 'top top',
          end: mobile ? '+=130%' : '+=240%',
          pin: true,
          scrub: mobile ? 0.6 : 1.1,
          anticipatePin: 1,
        },
      })

      // 1–2. rotate toward the viewer
      tl.to(heroState, { rotY: 0, duration: 0.25, ease: 'power1.inOut' }, 0)
      // 8. headline separates into words and leaves
      refs.words.forEach((w, i) => {
        const dir = i % 2 === 0 ? -1 : 1
        tl.to(
          w.parentElement!,
          {
            yPercent: -120 - i * 12,
            xPercent: dir * (18 + i * 6),
            rotate: dir * (4 + i),
            opacity: 0,
            filter: 'blur(8px)',
            duration: 0.28,
            ease: 'power2.in',
          },
          0.02 + i * 0.025,
        )
      })
      tl.to(refs.supportWrap, { y: -30, opacity: 0, duration: 0.14, stagger: 0.02 }, 0)
      // 3. camera dolly
      tl.to(heroState, { camZ: mobile ? 5.6 : 4.7, duration: 0.42, ease: 'power2.inOut' }, 0.12)
      // 4. move to the right side
      tl.to(
        heroState,
        {
          x: desktop ? 1.15 : mobile ? 0 : 0.8,
          y: mobile ? 0.15 : -0.12,
          scale: mobile ? 0.95 : 1,
          duration: 0.4,
          ease: 'power2.inOut',
        },
        0.42,
      )
      tl.to(heroMascot, { smile: 0.75, lookX: -1.4, duration: 0.3 }, 0.5)
      // 5. environment transforms
      tl.to(heroState, { env: 1, duration: 0.45, ease: 'power1.inOut' }, 0.3)
      tl.to(refs.bg, { opacity: 0, duration: 0.45 }, 0.3)
      tl.to(refs.envBg, { opacity: 1, duration: 0.45 }, 0.3)
      // 6. particles & light streaks
      tl.to(heroState, { streaks: 1, duration: 0.35 }, 0.5)
      // 7. hand-off: chapter teaser + mascot settles for the story section
      tl.fromTo(refs.chapter, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.72)
      tl.to(heroState, { exit: 1, duration: 0.2 }, 0.8)
      tl.to(refs.section.querySelector('[data-hero-fade]'), { opacity: 1, duration: 0.3 }, 0.7)
      tl.to(heroMascot, { lookX: 0, smile: 0.5, duration: 0.15 }, 0.85)

      return () => {
        // reset shared state when breakpoint changes
        Object.assign(heroState, { rotY: -0.55, x: 0, y: 0.02, scale: 1, camZ: 7, env: 0, streaks: 0, exit: 0 })
      }
    },
  )

  // Reduced motion: a calm, static composition — no pinning, no scrub.
  mm.add(MQ.reduced, () => {
    Object.assign(heroState, { rotY: -0.2, x: window.innerWidth >= 1024 ? 1.1 : 0, camZ: 6, env: 0.22 })
    gsap.set(refs.chapter, { opacity: 0 })
  })

  return () => {
    mm.revert()
    ScrollTrigger.refresh()
  }
}

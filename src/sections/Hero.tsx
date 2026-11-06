import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { createHeroTimeline, playHeroIntro } from '../animations/heroTimeline'
import MagneticButton from '../components/ui/MagneticButton'
import ToothFallback from '../components/ToothFallback'
import { hasWebGL, prefersReducedMotion } from '../lib/env'
import { useStore } from '../lib/store'
import { clinic } from '../config/clinic'
import { heroReady } from '../lib/heroReady'

const SceneCanvas = lazy(() => import('../three/SceneCanvas'))
const HeroScene = lazy(() => import('../three/HeroScene'))


const LINE_1 = ['Your', 'Smile.']
const LINE_2 = ['Our', 'Masterpiece.']

export default function Hero() {
  const section = useRef<HTMLElement>(null)
  const bg = useRef<HTMLDivElement>(null)
  const envBg = useRef<HTMLDivElement>(null)
  const chapter = useRef<HTMLDivElement>(null)
  const ready = useStore((s) => s.ready)
  const [webgl] = useState(hasWebGL)

  useEffect(() => {
    if (!webgl) heroReady.resolve()
  }, [webgl])

  useGSAP(
    () => {
      const q = (s: string) => Array.from(section.current!.querySelectorAll<HTMLElement>(s))
      gsap.set(q('[data-hero-word]'), { yPercent: 110 })
      return createHeroTimeline({
        section: section.current!,
        words: q('[data-hero-word]'),
        support: q('[data-hero-support]'),
        supportWrap: q('[data-hero-support-wrap]'),
        bg: bg.current!,
        envBg: envBg.current!,
        chapter: chapter.current!,
      })
    },
    { scope: section },
  )

  useGSAP(
    () => {
      if (!ready) return
      const q = (s: string) => Array.from(section.current!.querySelectorAll<HTMLElement>(s))
      playHeroIntro({ words: q('[data-hero-word]'), support: q('[data-hero-support]') }, prefersReducedMotion())
    },
    { dependencies: [ready], scope: section },
  )

  const word = (w: string, accent = false) => (
    <span key={w} className="word-mask mr-[0.18em] last:mr-0">
      <span data-hero-word className={`word ${accent ? 'serif-accent normal-case' : ''}`}>
        {w}
      </span>
    </span>
  )

  return (
    <section
      id="home"
      ref={section}
      aria-labelledby="hero-title"
      className="relative h-[100svh] min-h-[620px] w-full overflow-hidden"
    >
      {/* base pearl studio backdrop */}
      <div
        ref={bg}
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 38%, #ffffff 0%, #f3f5f9 38%, #e4ebf5 70%, #d6e1ef 100%)',
        }}
      />
      {/* transformed "dental environment" backdrop */}
      <div
        ref={envBg}
        aria-hidden
        className="absolute inset-0 opacity-0"
        style={{
          background:
            'radial-gradient(70% 70% at 70% 45%, #dbe8fa 0%, #b5cbe8 35%, #6f8fbf 70%, #2a426d 100%)',
        }}
      />
      <div aria-hidden className="grain absolute inset-0" />

      {/* Headline sits *behind* the 3D character for depth */}
      <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col justify-end px-5 pb-[max(17.5rem,37svh)] pt-16 sm:justify-center sm:px-8 sm:pb-0 lg:px-14">
        <h1 id="hero-title" className="display text-navy" aria-label="Your smile. Our masterpiece.">
          <span aria-hidden className="block text-[clamp(3.4rem,13.5vw,12.5rem)]">
            {LINE_1.map((w) => word(w))}
          </span>
          <span aria-hidden className="block text-right text-[clamp(3.4rem,13.5vw,12.5rem)]">
            {word(LINE_2[0])}
            {word(LINE_2[1], true)}
          </span>
        </h1>
      </div>

      {/* 3D character */}
      <div className="absolute inset-0 z-[2]">
        {webgl ? (
          <Suspense fallback={null}>
            <SceneCanvas
              label="A friendly 3D tooth character floating in a softly lit studio"
              className="h-full w-full"
              camera={{ position: [0, 0, 7], fov: 30 }}
              onReady={() => setTimeout(() => heroReady.resolve(), 150)}
            >
              <HeroScene />
            </SceneCanvas>
          </Suspense>
        ) : (
          <div className="flex h-full items-center justify-center">
            <ToothFallback className="h-[46vh] w-auto drop-shadow-xl" />
          </div>
        )}
      </div>

      {/* fades the environment into the story section's palette */}
      <div data-hero-fade aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[38%] opacity-0" style={{ background: 'linear-gradient(180deg, rgba(47,74,120,0) 0%, rgba(47,74,120,0.85) 70%, #2f4a78 100%)' }} />

      {/* Supporting copy + CTAs sit above the character */}
      <div className="absolute inset-x-0 bottom-0 z-[3] px-5 pb-8 sm:px-8 lg:px-14 lg:pb-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div data-hero-support-wrap className="max-w-md">
            <p data-hero-support className="text-[1.02rem] leading-relaxed text-navy/75 opacity-0 sm:text-lg">
              Exceptional dental care, thoughtfully designed around you. Discover a better experience in modern
              dentistry.
            </p>
          </div>
          <div data-hero-support-wrap className="flex flex-wrap items-center gap-3">
            <span data-hero-support className="opacity-0">
              <MagneticButton href="#contact">Book Your Appointment</MagneticButton>
            </span>
            <span data-hero-support className="opacity-0">
              <MagneticButton href="#treatments" variant="glass">
                Explore Our Treatments
              </MagneticButton>
            </span>
          </div>
        </div>
        <div data-hero-support-wrap className="mt-8 hidden items-center justify-between text-navy/50 lg:flex">
          <span data-hero-support className="eyebrow opacity-0">
            {clinic.tagline}
          </span>
          <span data-hero-support className="eyebrow flex items-center gap-3 opacity-0">
            <span className="scroll-hint inline-block h-6 w-[1px] bg-navy/40" aria-hidden />
            Scroll to explore
          </span>
        </div>
      </div>

      {/* Chapter teaser revealed at the end of the scrubbed sequence */}
      <div
        ref={chapter}
        className="pointer-events-none absolute left-5 top-1/2 z-[3] -translate-y-1/2 opacity-0 sm:left-8 lg:left-14 max-md:top-auto max-md:bottom-24 max-md:translate-y-0"
      >
        <p className="eyebrow mb-5 text-navy/70">Chapter 01 — The Art of Smiling</p>
        <p className="display text-[clamp(2.4rem,5.4vw,5rem)] text-navy">
          <span className="block whitespace-nowrap">
            Crafted with <span className="serif-accent">care.</span>
          </span>
          <span className="block whitespace-nowrap">
            Designed for <span className="serif-accent">you.</span>
          </span>
        </p>
      </div>
    </section>
  )
}

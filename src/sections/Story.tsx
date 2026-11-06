import { lazy, Suspense, useRef, useState } from 'react'
import { useGSAP } from '../lib/gsap'
import { createStoryTimeline } from '../animations/storyTimeline'
import Counter from '../components/ui/Counter'
import ToothFallback from '../components/ToothFallback'
import { hasWebGL } from '../lib/env'
import { useInView } from '../lib/useInView'
import { clinic } from '../config/clinic'

const SceneCanvas = lazy(() => import('../three/SceneCanvas'))
const StoryScene = lazy(() => import('../three/StoryScene'))

const SENTENCE = [
  ['Your', 'smile'],
  ['deserves', 'more'],
  ['than', 'routine', 'care.'],
]
const ACCENT = new Set(['more', 'care.'])

const pillars = [
  { n: '01', t: 'Comfort-first', d: 'Unhurried appointments, clear explanations and gentle techniques at every step.' },
  { n: '02', t: 'Precision-led', d: 'Digital scans and 3D planning turn guesswork into a plan you can see.' },
  { n: '03', t: 'Built to last', d: 'Treatments designed for function, longevity and a smile that still feels like you.' },
]

export default function Story() {
  const section = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const bgShift = useRef<HTMLDivElement>(null)
  const near = useInView(section, '100% 0px', true)
  const [webgl] = useState(hasWebGL)

  useGSAP(
    () => {
      const q = (s: string) => Array.from(section.current!.querySelectorAll<HTMLElement>(s))
      return createStoryTimeline({
        section: section.current!,
        pin: pin.current!,
        words: q('[data-story-word]'),
        lines: q('[data-story-line]'),
        pillars: q('[data-story-pillar]'),
        heading: q('[data-story-heading]'),
        bgShift: bgShift.current!,
      })
    },
    { scope: section },
  )

  return (
    <section id="about" ref={section} aria-labelledby="story-title" className="relative">
      <div ref={pin} className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #2f4a78 0%, #6f8fbf 14%, #c3d4ec 42%, #eef2f8 100%)' }}
        />
        <div ref={bgShift} aria-hidden className="absolute inset-0 bg-ivory opacity-0" />
        <div aria-hidden className="grain absolute inset-0" />

        {/* the mascot returns */}
        <div className="absolute bottom-0 right-0 z-0 h-[34%] w-[48%] sm:h-[60%] sm:w-[52%] lg:inset-y-0 lg:h-full lg:w-[44%]">
          {near &&
            (webgl ? (
              <Suspense fallback={null}>
                <SceneCanvas label="The tooth character tilting its head as it reads along" className="h-full w-full" camera={{ position: [0, 0, 6.2], fov: 30 }}>
                  <StoryScene />
                </SceneCanvas>
              </Suspense>
            ) : (
              <div className="flex h-full items-center justify-center">
                <ToothFallback className="h-[60%] w-auto" />
              </div>
            ))}
        </div>

        <div className="relative z-10 flex h-full flex-col justify-center px-5 pt-20 pb-10 sm:px-8 lg:w-[66%] lg:px-14">
          <div className="mb-8 flex items-center gap-4 lg:mb-12">
            <span className="eyebrow text-navy/60">About the studio</span>
            <span className="h-px w-16 bg-navy/25" aria-hidden />
          </div>
          <h2 id="story-title" className="display mb-8 text-[clamp(1.6rem,3.2vw,2.8rem)] text-navy lg:mb-12">
            <span className="word-mask">
              <span data-story-heading className="word">More than just</span>
            </span>{' '}
            <span className="word-mask">
              <span data-story-heading className="word">
                a <span className="serif-accent">dental</span> visit.
              </span>
            </span>
          </h2>

          <p
            className="display text-[clamp(2.7rem,7.4vw,7.4rem)] leading-[0.92] text-navy"
            aria-label="Your smile deserves more than routine care."
          >
            {SENTENCE.map((line, li) => (
              <span key={li} data-story-line className="block will-change-transform" aria-hidden>
                {line.map((w) => (
                  <span key={w} data-story-word className={`mr-[0.2em] inline-block ${ACCENT.has(w) ? 'serif-accent text-cobalt' : ''}`}>
                    {w}
                  </span>
                ))}
              </span>
            ))}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 max-sm:w-[64%] max-sm:grid-cols-1 max-sm:gap-3 lg:mt-16 lg:gap-10">
            {pillars.map((p) => (
              <div key={p.n} data-story-pillar className="border-t border-navy/15 pt-4 max-sm:flex max-sm:items-baseline max-sm:gap-3 max-sm:pt-2">
                <p className="eyebrow mb-2 text-cobalt max-sm:mb-0">{p.n}</p>
                <h3 className="mb-1.5 text-lg font-semibold tracking-tight text-navy max-sm:text-base">{p.t}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-navy/65 max-sm:hidden">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* counters derived from config — they stay truthful as the clinic edits its data */}
      <div className="relative bg-ivory px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
        <dl className="grid grid-cols-3 gap-4 border-y border-navy/10 py-10 lg:gap-10">
          {[
            { v: clinic.treatments.length, l: 'Specialties under one roof' },
            { v: clinic.doctors.length, l: 'Dedicated clinicians' },
            { v: clinic.daysOpenPerWeek, l: 'Days a week, by appointment' },
          ].map((s) => (
            <div key={s.l} className="flex flex-col gap-2">
              <dt className="order-2 text-xs leading-snug text-navy/60 sm:text-sm">{s.l}</dt>
              <dd className="order-1 text-[clamp(2.6rem,7vw,6rem)] font-[560] leading-none tracking-[-0.05em] text-navy">
                <Counter to={s.v} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

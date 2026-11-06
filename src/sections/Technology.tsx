import { lazy, Suspense, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGSAP } from '../lib/gsap'
import { createTechTimeline } from '../animations/techTimeline'
import { hasWebGL } from '../lib/env'
import { useInView } from '../lib/useInView'
import SplitWords from '../components/ui/SplitWords'

const SceneCanvas = lazy(() => import('../three/SceneCanvas'))
const ScanScene = lazy(() => import('../three/ScanScene'))

const FEATURES = [
  {
    k: 'Digital dental scanning',
    d: 'A handheld intraoral scanner captures your teeth as a precise 3D model — no messy impression trays.',
    hud: 'SCAN',
  },
  {
    k: '3D treatment planning',
    d: 'We plan each movement, implant or restoration virtually, so you can see the outcome before we begin.',
    hud: 'PLAN',
  },
  {
    k: 'Modern diagnostics',
    d: 'Low-dose digital imaging reveals what the eye can’t — roots, bone and early changes.',
    hud: 'DIAGNOSE',
  },
  {
    k: 'Advanced dental technology',
    d: 'Guided procedures and digitally crafted restorations bring the plan to life with care.',
    hud: 'DELIVER',
  },
]

export default function Technology() {
  const section = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const hudPct = useRef<HTMLSpanElement>(null)
  const hudPts = useRef<HTMLSpanElement>(null)
  const hudBar = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0)
  const near = useInView(section, '100% 0px', true)
  const [webgl] = useState(hasWebGL)

  useGSAP(
    () =>
      createTechTimeline({
        pin: pin.current!,
        onPhase: setPhase,
        onProgress: (p) => {
          const scan = Math.min(1, Math.max(0, (p - 0.02) / 0.32))
          if (hudPct.current) hudPct.current.textContent = `${(scan * 100).toFixed(1)}%`
          if (hudPts.current) hudPts.current.textContent = Math.round(scan * 26000).toLocaleString('en-US')
          if (hudBar.current) hudBar.current.style.transform = `scaleX(${p})`
        },
      }),
    { scope: section },
  )

  return (
    <section id="technology" data-theme="dark" ref={section} aria-labelledby="tech-title" className="relative bg-abyss text-ivory">
      <div ref={pin} className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'radial-gradient(90% 70% at 65% 50%, #13305e 0%, #0a1a38 45%, #050b18 100%)' }}
        />
        {/* scan canvas */}
        <div className="absolute inset-0 lg:left-[30%]">
          {near && webgl && (
            <Suspense fallback={null}>
              <SceneCanvas
                label="A 3D dental arch being digitally scanned, planned and analysed"
                className="h-full w-full"
                camera={{ position: [0, 3, 4.5], fov: 34 }}
              >
                <ScanScene />
              </SceneCanvas>
            </Suspense>
          )}
        </div>
        {/* scanning scan-lines overlay */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #9cc4ff 0 1px, transparent 1px 4px)' }} />

        <div className="relative z-10 flex h-full flex-col justify-between px-5 pb-8 pt-24 sm:px-8 lg:w-[44%] lg:px-14 lg:pb-14 lg:pt-28">
          <div>
            <p className="eyebrow mb-5 text-azure">Technology</p>
            <SplitWords
              id="tech-title"
              as="h2"
              text="Precision meets innovation."
              accent={['innovation']}
              className="display text-[clamp(2.5rem,5.4vw,5.2rem)]"
              wordClassName="[&.serif-accent]:text-azure"
            />
          </div>

          <ol className="flex flex-col gap-1 max-lg:rounded-2xl max-lg:p-4 max-lg:glass-dark">
            {FEATURES.map((f, i) => {
              const on = i === phase
              return (
                <li key={f.k} className="border-t border-sky/10 py-3 first:border-t-0 lg:py-4" aria-current={on ? 'step' : undefined}>
                  <div className="flex items-center gap-4">
                    <span className={`eyebrow transition-colors duration-500 ${on ? 'text-azure' : 'text-sky/30'}`}>0{i + 1}</span>
                    <h3 className={`text-lg font-medium tracking-tight transition-colors duration-500 lg:text-xl ${on ? 'text-ivory' : 'text-sky/35'}`}>{f.k}</h3>
                  </div>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden pl-10 text-sm leading-relaxed text-sky/70 lg:text-base"
                      >
                        <span className="block pt-2">{f.d}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ol>
        </div>

        {/* HUD readouts — describe this visualisation, not clinical performance */}
        <div aria-hidden className="pointer-events-none absolute right-5 top-24 z-10 hidden font-mono text-[0.68rem] uppercase tracking-[0.18em] text-sky/60 sm:block lg:right-14 lg:top-28">
          <div className="glass-dark flex flex-col gap-2 rounded-xl px-4 py-3">
            <div className="flex justify-between gap-8">
              <span>Mode</span>
              <span className="text-azure">{FEATURES[phase].hud}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span>Surface</span>
              <span ref={hudPct} className="text-ivory">0.0%</span>
            </div>
            <div className="flex justify-between gap-8">
              <span>Points</span>
              <span ref={hudPts} className="text-ivory">0</span>
            </div>
          </div>
          <p className="mt-2 text-right text-[0.58rem] text-sky/35">Visualisation</p>
        </div>
        <div className="absolute inset-x-5 bottom-4 z-10 h-px bg-sky/10 sm:inset-x-8 lg:inset-x-14">
          <div ref={hudBar} className="h-full origin-left scale-x-0 bg-azure" />
        </div>
      </div>

      {/* smooth dark → light transition */}
      <div aria-hidden className="h-[28vh]" style={{ background: 'linear-gradient(180deg, #050b18 0%, #1b2d4d 30%, #a9bad3 70%, #fbfaf6 100%)' }} />
    </section>
  )
}

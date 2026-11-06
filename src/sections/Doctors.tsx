import { useCallback, useRef, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { clinic, type Doctor } from '../config/clinic'
import { gsap, useGSAP } from '../lib/gsap'
import { MQ } from '../lib/env'
import PortraitPlaceholder from '../components/PortraitPlaceholder'
import SplitWords from '../components/ui/SplitWords'
import MagneticButton from '../components/ui/MagneticButton'
import { startScroll, stopScroll } from '../lib/smoothScroll'

const ease = [0.16, 1, 0.3, 1] as const

function Portrait({ d, i, className = '' }: { d: Doctor; i: number; className?: string }) {
  return d.portrait ? (
    <img src={d.portrait} alt={`Portrait of ${d.name}`} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />
  ) : (
    <PortraitPlaceholder hue={i} className={`h-full w-full ${className}`} />
  )
}

function Profile({ d, i, onClose }: { d: Doctor; i: number; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement
    stopScroll()
    close.current?.focus()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => {
      window.removeEventListener('keydown', k)
      startScroll()
      prev?.focus({ preventScroll: true })
    }
  }, [onClose])
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.5 } }}
    >
      <button aria-label="Close profile" tabIndex={-1} className="absolute inset-0 bg-navy/40 backdrop-blur-md" onClick={onClose} />
      <motion.div
        layoutId={`doc-${d.id}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`doc-title-${d.id}`}
        className="relative grid max-h-[92svh] w-full max-w-4xl overflow-y-auto bg-ivory sm:grid-cols-[0.9fr_1.1fr]"
        transition={{ duration: 0.8, ease }}
        data-lenis-prevent
      >
        <motion.div layoutId={`doc-img-${d.id}`} className="relative aspect-[4/3] overflow-hidden sm:aspect-auto" transition={{ duration: 0.8, ease }}>
          <Portrait d={d} i={i} />
        </motion.div>
        <motion.div
          className="flex flex-col gap-5 p-6 sm:p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.7, ease } }}
          exit={{ opacity: 0 }}
        >
          {d.placeholder && <span className="eyebrow w-fit rounded-full bg-gold/15 px-3 py-1 text-[0.6rem] text-[#8a6d2f]">Sample profile — replace</span>}
          <h3 id={`doc-title-${d.id}`} className="text-3xl font-semibold tracking-[-0.035em] text-navy sm:text-4xl">
            {d.name}
          </h3>
          <p className="serif-accent text-xl text-cobalt">{d.specialization}</p>
          <dl className="grid grid-cols-1 gap-4 border-y border-navy/10 py-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="eyebrow mb-1 text-navy/45">Qualification</dt>
              <dd className="text-navy">{d.qualification}</dd>
            </div>
            <div>
              <dt className="eyebrow mb-1 text-navy/45">Experience</dt>
              <dd className="text-navy">{d.experience}</dd>
            </div>
          </dl>
          <p className="leading-relaxed text-navy/70">{d.intro}</p>
          <div className="mt-auto flex gap-3 pt-2">
            <MagneticButton href="#contact" onClick={onClose}>
              Book a consultation
            </MagneticButton>
            <button ref={close} onClick={onClose} className="rounded-full border border-navy/20 px-6 text-sm text-navy transition hover:border-navy/50">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default function Doctors() {
  const section = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<number | null>(null)
  const close = useCallback(() => setOpen(null), [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        gsap.from('[data-doc-title] .word', {
          yPercent: 110,
          stagger: 0.06,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-doc-title]', start: 'top 85%' },
        })
        gsap.utils.toArray<HTMLElement>('[data-doc]').forEach((el, i) => {
          // image mask reveal
          gsap.fromTo(
            el.querySelector('[data-doc-mask]'),
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', delay: i * 0.12, scrollTrigger: { trigger: el, start: 'top 85%' } },
          )
          // staggered parallax columns
          gsap.to(el, {
            yPercent: [-6, 8, -12][i % 3],
            ease: 'none',
            scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom top', scrub: true },
          })
        })
      })
    },
    { scope: section },
  )

  return (
    <section id="doctors" ref={section} aria-labelledby="doctors-title" className="relative overflow-hidden bg-ivory px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
      <div className="mb-14 grid gap-8 lg:mb-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div data-doc-title>
          <p className="eyebrow mb-5 text-navy/55">Meet our dentists</p>
          <SplitWords id="doctors-title" as="h2" text="The hands behind your smile." accent={['smile']} className="display text-[clamp(2.4rem,5.6vw,5.4rem)] text-navy" wordClassName="[&.serif-accent]:text-cobalt" />
        </div>
        <p className="max-w-md text-navy/65 lg:justify-self-end">
          A small, specialist team that plans together — so every treatment benefits from more than one expert eye.
        </p>
      </div>

      <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
        {clinic.doctors.map((d, i) => (
          <li key={d.id} data-doc className={i === 1 ? 'lg:mt-24' : i === 2 ? 'lg:mt-10' : ''}>
            <motion.button
              layoutId={`doc-${d.id}`}
              onClick={() => setOpen(i)}
              className="group block w-full text-left"
              aria-label={`Open profile: ${d.name}, ${d.specialization}`}
              transition={{ duration: 0.8, ease }}
            >
              <div data-doc-mask className="relative overflow-hidden">
                <motion.div layoutId={`doc-img-${d.id}`} className="aspect-[3/4] overflow-hidden" transition={{ duration: 0.8, ease }}>
                  <Portrait d={d} i={i} className="transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.07]" />
                </motion.div>
                {d.placeholder && (
                  <span className="eyebrow absolute left-4 top-4 rounded-full bg-ivory/80 px-3 py-1 text-[0.58rem] text-navy/70 backdrop-blur">Portrait placeholder</span>
                )}
                <span className="absolute bottom-4 right-4 flex h-12 w-12 translate-y-3 items-center justify-center rounded-full bg-navy text-ivory opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-navy">{d.name}</h3>
                  <p className="mt-1 text-sm text-navy/60">{d.specialization}</p>
                </div>
                <span className="eyebrow pt-1 text-cobalt">0{i + 1}</span>
              </div>
            </motion.button>
          </li>
        ))}
      </ul>

      <AnimatePresence>{open !== null && <Profile d={clinic.doctors[open]} i={open} onClose={close} />}</AnimatePresence>
    </section>
  )
}

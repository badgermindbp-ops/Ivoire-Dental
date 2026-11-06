import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { clinic, type Treatment } from '../config/clinic'
import TreatmentArt from './TreatmentArt'
import MagneticButton from './ui/MagneticButton'
import { store } from '../lib/store'
import { scrollToTarget, startScroll, stopScroll } from '../lib/smoothScroll'

const ease = [0.16, 1, 0.3, 1] as const

/** Slide-in detail panel for a treatment. Esc / backdrop close, focus is trapped and restored. */
export default function TreatmentPanel({ treatment, onClose }: { treatment: Treatment | null; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!treatment) return
    lastFocus.current = document.activeElement as HTMLElement
    stopScroll()
    const t = setTimeout(() => closeBtn.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      startScroll()
      lastFocus.current?.focus({ preventScroll: true })
    }
  }, [treatment, onClose])

  const index = treatment ? clinic.treatments.findIndex((t) => t.id === treatment.id) : 0

  return (
    <AnimatePresence>
      {treatment && (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial="hidden"
          animate="show"
          exit="hidden"
          variants={{ hidden: { pointerEvents: 'none' }, show: { pointerEvents: 'auto' } }}
        >
          <motion.button
            aria-label="Close treatment details"
            className="absolute inset-0 h-full w-full cursor-default bg-navy/30 backdrop-blur-sm"
            variants={{ hidden: { opacity: 0, transition: { duration: 0.45 } }, show: { opacity: 1, transition: { duration: 0.5 } } }}
            onClick={onClose}
            tabIndex={-1}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="treatment-panel-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col overflow-y-auto bg-ivory shadow-2xl"
            variants={{ hidden: { x: '100%', transition: { duration: 0.6, ease: [0.7, 0, 0.84, 0] } }, show: { x: 0, transition: { duration: 0.9, ease } } }}
            data-lenis-prevent
          >
            <div className="relative h-[38vh] min-h-[240px] shrink-0 overflow-hidden bg-navy text-sky">
              <motion.div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(80% 90% at 70% 30%, #2f63b5 0%, #0b1a33 70%)' }}
                variants={{
                  hidden: { clipPath: 'inset(100% 0 0 0)', transition: { duration: 0.3 } },
                  show: { clipPath: 'inset(0% 0 0 0)', transition: { duration: 1.1, ease, delay: 0.15 } },
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-25"
                style={{ backgroundImage: 'linear-gradient(#7fa8d8 1px, transparent 1px), linear-gradient(90deg, #7fa8d8 1px, transparent 1px)', backgroundSize: '32px 32px' }}
              />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                variants={{
                  hidden: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
                  show: { opacity: 1, scale: 1, transition: { duration: 1, ease, delay: 0.35 } },
                }}
              >
                <TreatmentArt id={treatment.id} className="h-[80%] w-auto text-sky" />
              </motion.div>
              <button
                ref={closeBtn}
                onClick={onClose}
                className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-ivory/10 text-ivory backdrop-blur transition hover:bg-ivory/20"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <p className="eyebrow absolute bottom-5 left-6 text-sky/70">
                Treatment {String(index + 1).padStart(2, '0')} / {String(clinic.treatments.length).padStart(2, '0')}
              </p>
            </div>

            <motion.div
              className="flex flex-1 flex-col gap-8 p-6 sm:p-10"
              variants={{
                hidden: { opacity: 0, y: 30, transition: { duration: 0.25 } },
                show: { opacity: 1, y: 0, transition: { duration: 0.9, ease, delay: 0.3 } },
              }}
            >
              <div>
                <h3 id="treatment-panel-title" className="display mb-4 text-[clamp(2.2rem,6vw,3.6rem)] text-navy">
                  {treatment.name}
                </h3>
                <p className="serif-accent text-2xl text-cobalt">{treatment.short}</p>
              </div>
              <p className="text-[1.05rem] leading-relaxed text-navy/75">{treatment.description}</p>
              <ul className="flex flex-col divide-y divide-navy/10 border-y border-navy/10">
                {treatment.highlights.map((h, i) => (
                  <li key={h} className="flex items-center gap-4 py-3.5 text-navy">
                    <span className="eyebrow w-8 text-cobalt">0{i + 1}</span>
                    {h}
                  </li>
                ))}
              </ul>
              <dl className="grid grid-cols-2 gap-6">
                <div>
                  <dt className="eyebrow mb-1 text-navy/50">Typical duration</dt>
                  <dd className="text-navy">{treatment.duration}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-1 text-navy/50">Visits</dt>
                  <dd className="text-navy">{treatment.visits}</dd>
                </div>
              </dl>
              <p className="text-xs text-navy/50">
                Timelines are indicative. Your clinician will confirm a personalised plan after consultation.
              </p>
              <div className="mt-auto flex flex-wrap gap-3 pt-2">
                <MagneticButton
                  onClick={() => {
                    store.set({ selectedTreatment: treatment.id })
                    onClose()
                    setTimeout(() => scrollToTarget('#contact'), 350)
                  }}
                >
                  Book this treatment
                </MagneticButton>
                <MagneticButton variant="ghost" icon={false} onClick={onClose}>
                  Back to treatments
                </MagneticButton>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

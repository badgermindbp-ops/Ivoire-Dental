import { lazy, Suspense, useRef, useState } from 'react'
import { clinic, nav, telHref, whatsappHref } from '../config/clinic'
import { gsap, useGSAP } from '../lib/gsap'
import { hasWebGL } from '../lib/env'
import { useInView } from '../lib/useInView'
import { scrollToTarget } from '../lib/smoothScroll'
import { footerInput } from '../lib/sceneInputs'
import { store } from '../lib/store'
import Logo from '../components/ui/Logo'
import MagneticButton from '../components/ui/MagneticButton'
import ToothFallback from '../components/ToothFallback'

const SceneCanvas = lazy(() => import('../three/SceneCanvas'))
const FooterScene = lazy(() => import('../three/FooterScene'))

export default function Footer() {
  const ref = useRef<HTMLElement>(null)
  const near = useInView(ref, '50% 0px', true)
  const [webgl] = useState(hasWebGL)

  useGSAP(
    () => {
      gsap.from('[data-ft-word]', {
        yPercent: 100,
        stagger: 0.04,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-ft-mark]', start: 'top 95%' },
      })
    },
    { scope: ref },
  )

  const link = 'nav-link text-ivory/70 transition-colors hover:text-ivory'
  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToTarget(href)
  }

  return (
    <footer ref={ref} data-theme="dark" className="relative overflow-hidden bg-abyss text-ivory" aria-labelledby="footer-title">
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(70% 60% at 80% 0%, #13305e 0%, transparent 70%)' }} />
      <h2 id="footer-title" className="sr-only">
        {clinic.name} — contact and information
      </h2>

      <div className="relative grid gap-12 px-5 pb-10 pt-24 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:px-14 lg:pt-32">
        <div className="flex flex-col gap-8">
          <p className="display max-w-[14ch] text-[clamp(2.2rem,4.6vw,4.2rem)]">
            Ready when <span className="serif-accent text-azure">you</span> are.
          </p>
          <div
            className="flex flex-wrap gap-3"
            onMouseEnter={() => (footerInput.excited = true)}
            onMouseLeave={() => (footerInput.excited = false)}
            onFocus={() => (footerInput.excited = true)}
            onBlur={() => (footerInput.excited = false)}
          >
            <MagneticButton href="#contact" variant="light">
              Book Appointment
            </MagneticButton>
            <MagneticButton href={whatsappHref()} target="_blank" rel="noopener noreferrer" variant="ghost" className="!border-ivory/25 !text-ivory">
              WhatsApp us
            </MagneticButton>
          </div>
          <p className="max-w-md text-ivory/55">{clinic.statement}</p>
        </div>

        {/* signature mascot */}
        <div className="relative h-[260px] lg:h-[340px]">
          {near &&
            (webgl ? (
              <Suspense fallback={null}>
                <SceneCanvas label="The tooth mascot waving goodbye" className="h-full w-full" camera={{ position: [0, 0.1, 5.2], fov: 30 }}>
                  <FooterScene />
                </SceneCanvas>
              </Suspense>
            ) : (
              <ToothFallback className="mx-auto h-full w-auto" />
            ))}
        </div>
      </div>

      <div className="relative grid gap-10 border-t border-ivory/10 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-14">
        <div className="flex flex-col gap-4">
          <Logo className="text-ivory [&_.eyebrow]:text-ivory/60" />
          <address className="not-italic leading-relaxed text-ivory/60">
            {clinic.address.line1}
            <br />
            {clinic.address.line2}, {clinic.address.city}
            <br />
            {clinic.address.region} {clinic.address.postalCode}
          </address>
          <a href={clinic.address.mapUrl} target="_blank" rel="noopener noreferrer" className={`${link} w-fit text-sm`}>
            Get directions ↗
          </a>
        </div>

        <nav aria-label="Footer">
          <p className="eyebrow mb-4 text-ivory/40">Explore</p>
          <ul className="flex flex-col gap-2.5">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={go(n.href)} className={link}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="eyebrow mb-4 text-ivory/40">Treatments</p>
          <ul className="flex flex-col gap-2.5">
            {clinic.treatments.map((t) => (
              <li key={t.id}>
                <a
                  href="#contact"
                  onClick={(e) => {
                    store.set({ selectedTreatment: t.id })
                    go('#contact')(e)
                  }}
                  className={link}
                >
                  {t.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <p className="eyebrow mb-4 text-ivory/40">Contact</p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a href={telHref} className={link}>
                  {clinic.contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${clinic.contact.email}`} className={link}>
                  {clinic.contact.email}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4 text-ivory/40">Hours</p>
            <dl className="flex flex-col gap-1.5 text-sm">
              {clinic.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4">
                  <dt className="text-ivory/50">{h.days}</dt>
                  <dd className="text-ivory/80">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Social media">
            {clinic.social.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="block rounded-full border border-ivory/15 px-3.5 py-1.5 text-xs text-ivory/70 transition hover:border-ivory/50 hover:text-ivory">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* oversized wordmark */}
      <div data-ft-mark aria-hidden className="relative select-none overflow-hidden px-3 leading-none">
        <p className="display flex justify-between text-[23vw] text-ivory/[0.06]">
          {clinic.shortName.split('').map((c, i) => (
            <span key={i} className="inline-block overflow-hidden">
              <span data-ft-word className="inline-block">
                {c}
              </span>
            </span>
          ))}
        </p>
      </div>

      <div className="relative flex flex-col gap-4 border-t border-ivory/10 px-5 py-6 text-xs text-ivory/40 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14">
        <p>
          © {new Date().getFullYear()} {clinic.name}. All rights reserved.
        </p>
        <button
          onClick={() => scrollToTarget(0)}
          className="group flex items-center gap-3 self-start text-ivory/60 transition hover:text-ivory sm:self-auto"
          aria-label="Back to top"
        >
          Back to top
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/20 transition group-hover:-translate-y-1 group-hover:border-ivory/60">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="M6 10V2M2 5.5L6 2l4 3.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
            </svg>
          </span>
        </button>
      </div>
    </footer>
  )
}

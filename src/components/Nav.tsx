import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { clinic, nav, telHref, whatsappHref } from '../config/clinic'
import { scrollToTarget, startScroll, stopScroll } from '../lib/smoothScroll'
import { useStore } from '../lib/store'
import Logo from './ui/Logo'
import MagneticButton from './ui/MagneticButton'

const ease = [0.76, 0, 0.24, 1] as const

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('#home')
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const ready = useStore((s) => s.ready)
  const toggle = useRef<HTMLButtonElement>(null)

  // scrolled state, active section and nav theme — rect checks are robust to pin spacers
  useEffect(() => {
    if (!ready) return
    const outer = (el: Element) => (el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el)
    let raf = 0
    const update = () => {
      raf = 0
      setScrolled(window.scrollY > 40)
      const line = window.innerHeight * 0.45
      let current = '#home'
      for (const n of nav) {
        const el = document.querySelector(n.href)
        if (!el) continue
        // the last section whose top has passed the reading line wins
        if (outer(el)!.getBoundingClientRect().top <= line) current = n.href
      }
      setActive(current)
      // dark theme while a [data-theme="dark"] block sits under the bar
      let isDark = false
      document.querySelectorAll('[data-theme="dark"]').forEach((el) => {
        const r = outer(el)!.getBoundingClientRect()
        if (r.top <= 48 && r.bottom > 48) isDark = true
      })
      setDark(isDark)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [ready])

  useEffect(() => {
    if (!open) return
    const toggleEl = toggle.current
    stopScroll()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => {
      window.removeEventListener('keydown', k)
      startScroll()
      toggleEl?.focus({ preventScroll: true })
    }
  }, [open])

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (open) {
      setOpen(false)
      setTimeout(() => scrollToTarget(href), 650)
    } else scrollToTarget(href)
  }

  return (
    <>
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[120] rounded-full bg-navy px-5 py-3 text-ivory">
        Skip to content
      </a>
      <motion.header
        className="fixed inset-x-0 top-0 z-[60] px-3 pt-3 sm:px-5 sm:pt-4"
        initial={{ y: -100, opacity: 0 }}
        animate={ready ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      >
        <div
          className={`mx-auto flex max-w-[1500px] items-center justify-between rounded-full px-4 py-2.5 transition-all duration-700 sm:px-6 ${
            open ? 'glass' : scrolled ? (dark ? 'glass-dark text-ivory' : 'glass') : 'border border-transparent bg-transparent'
          } ${dark && !open ? 'nav-dark' : ''}`}
        >
          <a href="#home" onClick={go('#home')} aria-label={`${clinic.name} — home`} className={`relative z-[2] transition-colors duration-500 ${dark && !open ? 'text-ivory' : 'text-navy'}`}>
            <Logo />
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className={`flex items-center gap-7 text-[0.9rem] transition-colors duration-500 ${dark ? 'text-ivory/75' : 'text-navy/80'}`}>
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} onClick={go(n.href)} aria-current={active === n.href ? 'true' : undefined} className={`nav-link transition-colors ${dark ? 'hover:text-ivory' : 'hover:text-navy'} ${active === n.href ? (dark ? 'text-ivory' : 'text-navy') : ''}`}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="relative z-[2] flex items-center gap-2">
            <MagneticButton href="#contact" variant={dark && !open ? 'light' : 'solid'} className="!px-5 !py-3 !text-[0.85rem] max-sm:!px-4" strength={0.25}>
              <span className="max-sm:hidden">Book Appointment</span>
              <span className="sm:hidden">Book</span>
            </MagneticButton>
            <button
              ref={toggle}
              className={`flex h-11 w-11 items-center justify-center rounded-full lg:hidden ${dark && !open ? 'text-ivory' : 'text-navy'}`}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              <span className="relative block h-3 w-6" aria-hidden>
                <span className={`absolute left-0 h-[1.5px] w-full bg-current transition-all duration-500 ${open ? 'top-1/2 rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 h-[1.5px] w-full bg-current transition-all duration-500 ${open ? 'top-1/2 -rotate-45' : 'top-full'}`} />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[55] flex flex-col bg-ivory px-6 pb-8 pt-28"
            initial={{ clipPath: 'circle(0% at 92% 4%)' }}
            animate={{ clipPath: 'circle(150% at 92% 4%)' }}
            exit={{ clipPath: 'circle(0% at 92% 4%)' }}
            transition={{ duration: 0.9, ease }}
          >
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(80% 50% at 100% 0%, #dbe8fa 0%, transparent 70%)' }} />
            <nav aria-label="Mobile" className="relative flex-1">
              <ul className="flex flex-col gap-1">
                {nav.map((n, i) => (
                  <li key={n.href} className="overflow-hidden">
                    <motion.a
                      href={n.href}
                      onClick={go(n.href)}
                      className="flex items-baseline gap-4 py-1.5 text-[clamp(2.2rem,10vw,3.5rem)] font-semibold uppercase leading-none tracking-[-0.045em] text-navy"
                      initial={{ y: '110%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '110%' }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.05 }}
                    >
                      <span className="eyebrow text-cobalt">0{i + 1}</span>
                      {n.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </nav>
            <motion.div
              className="relative grid grid-cols-2 gap-3 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.6 } }}
              exit={{ opacity: 0 }}
            >
              <a href={telHref} className="rounded-2xl bg-navy p-4 text-ivory">
                <span className="eyebrow block text-ivory/50">Call</span>
                {clinic.contact.phoneDisplay}
              </a>
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-[#1f9d55] p-4 text-white">
                <span className="eyebrow block text-white/60">Message</span>
                WhatsApp
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

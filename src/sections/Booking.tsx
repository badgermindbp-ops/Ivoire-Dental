import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { clinic, telHref, whatsappHref } from '../config/clinic'
import { submitBooking, bookingWhatsappText, type BookingPayload, type BookingResult } from '../lib/booking'
import { gsap, useGSAP } from '../lib/gsap'
import { store, useStore } from '../lib/store'
import MagneticButton from '../components/ui/MagneticButton'
import SplitWords from '../components/ui/SplitWords'

type Errors = Partial<Record<keyof BookingPayload, string>>
const empty: BookingPayload = { name: '', phone: '', email: '', treatment: '', date: '', message: '' }
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

function validate(v: BookingPayload): Errors {
  const e: Errors = {}
  if (v.name.trim().length < 2) e.name = 'Please enter your full name.'
  if (v.phone.replace(/\D/g, '').length < 7) e.phone = 'Please enter a valid phone number.'
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'That email doesn’t look quite right.'
  if (v.date && v.date < today()) e.date = 'Please choose today or a future date.'
  return e
}

const ease = [0.16, 1, 0.3, 1] as const

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="field" data-invalid={!!error}>
      {children}
      <label htmlFor={id}>{label}</label>
      <span className="bar" aria-hidden />
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pt-1.5 text-xs text-[#b03a2e]"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Result({ result, values, onReset }: { result: BookingResult; values: BookingPayload; onReset: () => void }) {
  const treatmentName = clinic.treatments.find((t) => t.id === values.treatment)?.name ?? ''
  const wa = whatsappHref(bookingWhatsappText(values, treatmentName))
  const copy = {
    confirmed: { t: 'You’re booked.', d: 'Your appointment is confirmed. We’ve sent the details to you.' },
    received: { t: 'Request received.', d: 'Thank you. Our team will contact you shortly to confirm a time that suits you.' },
    handoff: {
      t: 'Almost there.',
      d: 'Online booking isn’t connected yet, so nothing has been sent. Tap WhatsApp to send your prefilled request, or call us directly.',
    },
    error: { t: 'Something went wrong.', d: 'Your request was not sent. Please reach us on WhatsApp or by phone instead.' },
  }[result.status]
  const ok = result.status === 'confirmed' || result.status === 'received'

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease }}
      className="flex min-h-[460px] flex-col items-start justify-center gap-6"
      role="status"
      aria-live="polite"
    >
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden>
        <motion.circle cx="38" cy="38" r="36" fill="none" stroke={ok ? '#2f63b5' : '#c8a96a'} strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease }} />
        {ok ? (
          <motion.path d="M24 39l10 10 19-21" fill="none" stroke="#2f63b5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.6, ease }} />
        ) : (
          <motion.path d="M38 22v20M38 52v1" fill="none" stroke="#c8a96a" strokeWidth="2.6" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.6 }} />
        )}
      </svg>
      <h3 className="display text-[clamp(2rem,4vw,3.2rem)] text-navy">{copy.t}</h3>
      <p className="max-w-md leading-relaxed text-navy/70">
        {copy.d}
        {'reference' in result && result.reference && (
          <>
            {' '}
            Reference: <strong className="font-semibold text-navy">{result.reference}</strong>
          </>
        )}
        {result.status === 'error' && <span className="mt-2 block text-sm text-navy/50">{result.message}</span>}
      </p>
      <div className="flex flex-wrap gap-3">
        {!ok && (
          <MagneticButton href={wa} target="_blank" rel="noopener noreferrer">
            Send on WhatsApp
          </MagneticButton>
        )}
        {!ok && (
          <MagneticButton href={telHref} variant="ghost" icon={false}>
            Call {clinic.contact.phoneDisplay}
          </MagneticButton>
        )}
        <button onClick={onReset} className="px-2 text-sm text-navy/60 underline-offset-4 hover:underline">
          {ok ? 'Make another request' : 'Edit details'}
        </button>
      </div>
    </motion.div>
  )
}

export default function Booking() {
  const section = useRef<HTMLElement>(null)
  const selected = useStore((s) => s.selectedTreatment)
  const [values, setValues] = useState<BookingPayload>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof BookingPayload, boolean>>>({})
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<BookingResult | null>(null)

  useEffect(() => {
    if (selected) setValues((v) => ({ ...v, treatment: selected }))
  }, [selected])

  useGSAP(
    () => {
      gsap.from('[data-bk-title] .word', { yPercent: 110, stagger: 0.04, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '[data-bk-title]', start: 'top 85%' } })
      gsap.from('[data-bk-field]', { y: 30, opacity: 0, stagger: 0.07, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '[data-bk-form]', start: 'top 80%' } })
    },
    { scope: section },
  )

  const set = (k: keyof BookingPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const next = { ...values, [k]: e.target.value }
    setValues(next)
    if (touched[k]) setErrors(validate(next))
  }
  const blur = (k: keyof BookingPayload) => () => {
    setTouched((t) => ({ ...t, [k]: true }))
    setErrors(validate(values))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    setTouched({ name: true, phone: true, email: true, date: true })
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0]
      document.getElementById(`bk-${first}`)?.focus()
      return
    }
    setSending(true)
    try {
      setResult(await submitBooking(values))
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    if (result?.status === 'confirmed' || result?.status === 'received') {
      setValues(empty)
      store.set({ selectedTreatment: '' })
    }
    setResult(null)
    setTouched({})
  }

  const err = (k: keyof BookingPayload) => (touched[k] ? errors[k] : undefined)
  const aria = (k: keyof BookingPayload) => ({ 'aria-invalid': !!err(k), 'aria-describedby': err(k) ? `bk-${k}-error` : undefined })

  return (
    <section id="contact" ref={section} aria-labelledby="bk-title" className="relative overflow-hidden bg-porcelain px-5 py-24 sm:px-8 lg:px-14 lg:py-36">
      {/* animated gradient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora absolute -left-1/4 -top-1/3 h-[80vh] w-[80vw] rounded-full opacity-60 blur-3xl" style={{ background: 'radial-gradient(circle, #c9daef 0%, transparent 65%)' }} />
        <div className="aurora absolute -bottom-1/3 right-[-20%] h-[70vh] w-[70vw] rounded-full opacity-50 blur-3xl [animation-delay:-9s]" style={{ background: 'radial-gradient(circle, #e9e3da 0%, transparent 65%)' }} />
      </div>

      <div className="relative grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div className="flex flex-col justify-between gap-12">
          <div data-bk-title>
            <p className="eyebrow mb-5 text-navy/55">Book an appointment</p>
            <SplitWords
              id="bk-title"
              as="h2"
              text="Your journey to a better smile starts here."
              accent={['better']}
              className="display text-[clamp(2.3rem,4.8vw,4.6rem)] text-navy"
              wordClassName="[&.serif-accent]:text-cobalt"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a href={telHref} className="glass group flex items-center gap-4 rounded-2xl p-5 transition hover:-translate-y-0.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-ivory" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                </svg>
              </span>
              <span>
                <span className="eyebrow block text-navy/50">Call the studio</span>
                <span className="font-medium text-navy">{clinic.contact.phoneDisplay}</span>
              </span>
            </a>
            <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="glass group flex items-center gap-4 rounded-2xl p-5 transition hover:-translate-y-0.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f9d55] text-white" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
                </svg>
              </span>
              <span>
                <span className="eyebrow block text-navy/50">Message us</span>
                <span className="font-medium text-navy">WhatsApp</span>
              </span>
            </a>
            <div className="sm:col-span-2">
              <p className="eyebrow mb-3 text-navy/50">Studio hours</p>
              <dl className="divide-y divide-navy/10 border-y border-navy/10 text-sm">
                {clinic.hours.map((h) => (
                  <div key={h.days} className="flex justify-between py-2.5">
                    <dt className="text-navy/65">{h.days}</dt>
                    <dd className="font-medium text-navy">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div data-bk-form className="glass rounded-[28px] p-6 sm:p-10">
          <AnimatePresence mode="wait">
            {result ? (
              <Result result={result} values={values} onReset={reset} />
            ) : (
              <motion.form key="form" onSubmit={onSubmit} noValidate className="grid gap-x-8 gap-y-7 sm:grid-cols-2" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} aria-describedby="bk-note">
                <div data-bk-field className="sm:col-span-2">
                  <Field id="bk-name" label="Full name *" error={err('name')}>
                    <input id="bk-name" name="name" autoComplete="name" placeholder=" " value={values.name} onChange={set('name')} onBlur={blur('name')} required {...aria('name')} />
                  </Field>
                </div>
                <div data-bk-field>
                  <Field id="bk-phone" label="Phone number *" error={err('phone')}>
                    <input id="bk-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder=" " value={values.phone} onChange={set('phone')} onBlur={blur('phone')} required {...aria('phone')} />
                  </Field>
                </div>
                <div data-bk-field>
                  <Field id="bk-email" label="Email" error={err('email')}>
                    <input id="bk-email" name="email" type="email" autoComplete="email" placeholder=" " value={values.email} onChange={set('email')} onBlur={blur('email')} {...aria('email')} />
                  </Field>
                </div>
                <div data-bk-field>
                  <Field id="bk-treatment" label="Preferred treatment">
                    <select id="bk-treatment" name="treatment" value={values.treatment} onChange={set('treatment')}>
                      <option value="">Not sure yet — general consultation</option>
                      {clinic.treatments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div data-bk-field>
                  <Field id="bk-date" label="Preferred date" error={err('date')}>
                    <input id="bk-date" name="date" type="date" min={today()} placeholder=" " value={values.date} onChange={set('date')} onBlur={blur('date')} {...aria('date')} />
                  </Field>
                </div>
                <div data-bk-field className="sm:col-span-2">
                  <Field id="bk-message" label="Anything we should know?">
                    <textarea id="bk-message" name="message" rows={3} placeholder=" " value={values.message} onChange={set('message')} />
                  </Field>
                </div>
                <div data-bk-field className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <p id="bk-note" className="max-w-xs text-xs leading-relaxed text-navy/50">
                    This is a request, not a confirmed booking. We’ll contact you to confirm your time.
                  </p>
                  <MagneticButton type="submit" disabled={sending} className="min-w-[13rem]">
                    {sending ? 'Sending…' : 'Request appointment'}
                  </MagneticButton>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

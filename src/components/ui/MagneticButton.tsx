import { useRef, type ReactNode, type MouseEvent } from 'react'
import { gsap } from '../../lib/gsap'
import { isTouch } from '../../lib/env'
import { scrollToTarget } from '../../lib/smoothScroll'

type Variant = 'solid' | 'ghost' | 'light' | 'glass'

const styles: Record<Variant, string> = {
  solid: 'bg-navy text-ivory hover:bg-ink',
  ghost: 'border border-navy/20 text-navy hover:border-navy/50',
  light: 'bg-ivory text-navy hover:bg-white',
  glass: 'glass text-navy',
}

/**
 * Magnetic CTA: the button drifts toward the cursor and its label follows a
 * little further, giving depth. Anchors starting with # use smooth scrolling.
 */
export default function MagneticButton({
  children,
  href,
  onClick,
  variant = 'solid',
  className = '',
  strength = 0.35,
  icon = true,
  type = 'button',
  ...rest
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: Variant
  className?: string
  strength?: number
  icon?: boolean
  type?: 'button' | 'submit'
  target?: string
  rel?: string
  'aria-label'?: string
  disabled?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  const move = (e: MouseEvent) => {
    if (isTouch() || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    gsap.to(ref.current, { x: x * strength, y: y * strength, duration: 0.6, ease: 'power3.out' })
    gsap.to(label.current, { x: x * strength * 0.4, y: y * strength * 0.4, duration: 0.6, ease: 'power3.out' })
  }
  const leave = () => {
    gsap.to([ref.current, label.current], { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
  }

  const cls = `group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-7 py-4 text-[0.95rem] font-medium tracking-tight transition-colors duration-500 will-change-transform disabled:opacity-60 ${styles[variant]} ${className}`

  const inner = (
    <>
      <span
        aria-hidden
        className="absolute inset-0 -z-0 translate-y-full rounded-full bg-gradient-to-r from-cobalt to-azure transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-y-0"
      />
      <span ref={label} className="relative z-10 inline-flex items-center gap-3 group-hover:text-white transition-colors duration-500">
        {children}
        {icon && (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <path d="M3 11L11 3M11 3H4.5M11 3V9.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </>
  )

  if (href) {
    const internal = href.startsWith('#')
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={cls}
        onMouseMove={move}
        onMouseLeave={leave}
        onClick={(e) => {
          if (internal) {
            e.preventDefault()
            scrollToTarget(href)
          }
          onClick?.()
        }}
        {...rest}
      >
        {inner}
      </a>
    )
  }
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      className={cls}
      onMouseMove={move}
      onMouseLeave={leave}
      onClick={onClick}
      {...rest}
    >
      {inner}
    </button>
  )
}

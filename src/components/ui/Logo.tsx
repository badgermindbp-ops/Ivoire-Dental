import { clinic } from '../../config/clinic'

export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fa8d8" />
          <stop offset="1" stopColor="#0b1a33" />
        </linearGradient>
      </defs>
      <path
        d="M16 7.2c-2.2-2-6.2-2.6-8.4-.6-2.6 2.4-1.8 7 .2 10.2.9 1.5 1.1 3.3 1.4 5.1.3 2 .9 4.3 2.4 4.3 1.6 0 1.8-2.6 2.2-4.6.3-1.4.9-2.6 2.2-2.6s1.9 1.2 2.2 2.6c.4 2 .6 4.6 2.2 4.6 1.5 0 2.1-2.3 2.4-4.3.3-1.8.5-3.6 1.4-5.1 2-3.2 2.8-7.8.2-10.2-2.2-2-6.2-1.4-8.4.6Z"
        fill="none"
        stroke="url(#lm)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12.4 11.6c1.2.9 2.4 1.3 3.6 1.3s2.4-.4 3.6-1.3" stroke="url(#lm)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[1.05rem] font-semibold tracking-[-0.03em]">{clinic.shortName}</span>
        <span className="eyebrow !text-[0.55rem] !tracking-[0.3em] opacity-60">Dental Studio</span>
      </span>
    </span>
  )
}

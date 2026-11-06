/**
 * Illustrative smile used by the before/after slider. Clearly labelled as
 * illustrative in the UI until clinic-approved, consented photography exists.
 */
type Variant = 'before' | 'after'

const UPPER = [
  { w: 44, h: 70 }, // premolar
  { w: 50, h: 80 }, // canine
  { w: 56, h: 92 }, // lateral
  { w: 70, h: 104 }, // central
  { w: 70, h: 104 },
  { w: 56, h: 92 },
  { w: 50, h: 80 },
  { w: 44, h: 70 },
]
// per-tooth "before" irregularities: rotation, vertical offset, x offset
const MESSY = [
  { r: -6, y: 4, x: 2 },
  { r: 8, y: -2, x: 4 },
  { r: -10, y: 8, x: 6 },
  { r: 4, y: 0, x: -8 },
  { r: -3, y: 6, x: 10 },
  { r: 12, y: -4, x: 6 },
  { r: -4, y: 6, x: 2 },
  { r: 6, y: 2, x: 0 },
]

function toothPath(w: number, h: number) {
  const r = w * 0.32
  return `M${-w / 2} 0 L${-w / 2} ${h - r} Q${-w / 2} ${h} ${-w / 2 + r} ${h} Q0 ${h + 4} ${w / 2 - r} ${h} Q${w / 2} ${h} ${w / 2} ${h - r} L${w / 2} 0 Z`
}

export default function SmileIllustration({ variant, className = '' }: { variant: Variant; className?: string }) {
  const after = variant === 'after'
  const id = `smile-${variant}`
  const total = UPPER.reduce((a, t) => a + t.w, 0) + 2 * (UPPER.length - 1)
  let cursor = 400 - total / 2
  const teeth = UPPER.map((t, i) => {
    const cx = cursor + t.w / 2
    cursor += t.w + 2
    const arc = Math.pow((cx - 400) / 210, 2) * 26 // teeth rise toward the corners
    const m = after ? { r: 0, y: 0, x: 0 } : MESSY[i]
    return { ...t, cx: cx + m.x, top: 196 + arc + m.y - 10, rot: m.r + (cx - 400) * 0.03 }
  })
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-skin`} cx="50%" cy="40%" r="75%">
          <stop offset="0" stopColor="#f3dfd2" />
          <stop offset="1" stopColor="#d7b3a0" />
        </radialGradient>
        <linearGradient id={`${id}-lip`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c97b7f" />
          <stop offset="1" stopColor="#a65560" />
        </linearGradient>
        <linearGradient id={`${id}-tooth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={after ? '#ffffff' : '#ecdcae'} />
          <stop offset="0.7" stopColor={after ? '#f6f4ef' : '#dcc58c'} />
          <stop offset="1" stopColor={after ? '#e7eaf0' : '#c9ad6e'} />
        </linearGradient>
        <radialGradient id={`${id}-mouth`} cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="#5a1f2b" />
          <stop offset="1" stopColor="#2a0c14" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d="M150 210 Q400 150 650 210 Q560 380 400 384 Q240 380 150 210 Z" />
        </clipPath>
      </defs>
      <rect width="800" height="500" fill={`url(#${id}-skin)`} />
      {/* mouth cavity */}
      <path d="M150 210 Q400 150 650 210 Q560 380 400 384 Q240 380 150 210 Z" fill={`url(#${id}-mouth)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {/* gums */}
        <path d="M120 150 Q400 150 680 150 L680 214 Q400 196 120 214 Z" fill={after ? '#e58d97' : '#c96f78'} />
        {/* lower teeth hint */}
        {UPPER.slice(1, 7).map((t, i) => (
          <path
            key={`l${i}`}
            d={toothPath(t.w * 0.82, 60)}
            transform={`translate(${400 + (i - 2.5) * 56} ${380}) scale(1 -1)`}
            fill={`url(#${id}-tooth)`}
            opacity="0.85"
          />
        ))}
        {/* upper teeth */}
        {teeth.map((t, i) => (
          <g key={i} transform={`translate(${t.cx} ${t.top}) rotate(${t.rot})`}>
            <path d={toothPath(t.w, t.h)} fill={`url(#${id}-tooth)`} stroke={after ? '#dfe3ea' : '#b99a5c'} strokeWidth="1" />
            <path d={`M${-t.w * 0.28} 14 Q${-t.w * 0.32} ${t.h * 0.5} ${-t.w * 0.18} ${t.h * 0.82}`} stroke="#fff" strokeOpacity={after ? 0.9 : 0.35} strokeWidth="5" fill="none" strokeLinecap="round" />
          </g>
        ))}
        {!after && <rect x="397" y="190" width="6" height="110" fill="#2a0c14" opacity="0.9" />}
      </g>
      {/* lips */}
      <path d="M120 212 Q260 130 400 160 Q540 130 680 212 Q600 196 400 190 Q200 196 120 212 Z" fill={`url(#${id}-lip)`} />
      <path d="M150 214 Q240 380 400 386 Q560 380 650 214 Q600 430 400 440 Q200 430 150 214 Z" fill={`url(#${id}-lip)`} />
      <path d="M300 410 Q400 424 500 410" stroke="#fff" strokeOpacity="0.35" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

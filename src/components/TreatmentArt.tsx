import type { TreatmentId } from '../config/clinic'

/** Fine-line technical drawings for each treatment (no stock imagery needed). */
const TOOTH =
  'M0 -34c-6-5-17-6-22 0-6 7-3 18 1 25 2 4 2 9 3 15 1 8 3 16 8 16s5-10 6-15c1-3 2-5 4-5s3 2 4 5c1 5 1 15 6 15s7-8 8-16c1-6 1-11 3-15 4-7 7-18 1-25-5-6-16-5-22 0Z'
const INCISOR = 'M-12 -30c0-4 4-6 12-6s12 2 12 6l-1 28c0 4-3 6-5 6l-2 30c0 3-2 4-4 4s-4-1-4-4l-2-30c-2 0-5-2-5-6Z'

const T = ({ x = 0, y = 0, s = 1, d = TOOTH, dash = false }: { x?: number; y?: number; s?: number; d?: string; dash?: boolean }) => (
  <path d={d} transform={`translate(${x} ${y}) scale(${s})`} strokeDasharray={dash ? '3 3' : undefined} />
)

const art: Record<TreatmentId, React.ReactNode> = {
  'smile-makeover': (
    <>
      <path d="M30 92c22 34 118 34 140 0" />
      {[-2, -1, 0, 1, 2].map((i) => (
        <T key={i} d={INCISOR} x={100 + i * 26} y={98 + Math.abs(i) * -6 + (i === 0 ? 4 : 0)} s={0.62} />
      ))}
      <path d="M150 46l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
      <circle cx="46" cy="52" r="2.5" />
    </>
  ),
  implants: (
    <>
      <path d="M72 74c0-14 12-22 28-22s28 8 28 22c0 10-4 14-8 16H80c-4-2-8-6-8-16Z" />
      <path d="M86 92h28l-3 72c-1 6-5 10-11 10s-10-4-11-10Z" />
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} d={`M${84 + i * 0.4} ${102 + i * 8}l${32 - i * 0.8} 6`} />
      ))}
      <path d="M100 30v12M86 34l4 8M114 34l-4 8" />
    </>
  ),
  whitening: (
    <>
      <T x={100} y={108} s={1.55} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <path key={i} d={`M${100 + Math.cos(a) * 70} ${100 + Math.sin(a) * 70}L${100 + Math.cos(a) * 84} ${100 + Math.sin(a) * 84}`} />
      })}
      <path d="M78 76c4-8 10-11 16-12" />
    </>
  ),
  'root-canal': (
    <>
      <T x={100} y={104} s={1.7} />
      <path d="M100 74c-4 14-10 34-14 64M100 74c4 14 10 34 14 64" strokeDasharray="2 4" />
      <circle cx="100" cy="72" r="6" />
      <path d="M100 20v30" />
      <path d="M95 50h10" />
    </>
  ),
  orthodontics: (
    <>
      {[-1, 0, 1].map((i) => (
        <T key={i} d={INCISOR} x={100 + i * 44} y={104} s={1.15} />
      ))}
      {[-1, 0, 1].map((i) => (
        <rect key={i} x={92 + i * 44} y={84} width="16" height="12" rx="2" />
      ))}
      <path d="M30 90c30-4 110-4 140 0" />
    </>
  ),
  aligners: (
    <>
      {[-1, 0, 1].map((i) => (
        <T key={i} d={INCISOR} x={100 + i * 44} y={104} s={1.15} />
      ))}
      <path d="M44 66c0-8 6-12 14-12h84c8 0 14 4 14 12v34c0 6-4 10-10 10H54c-6 0-10-4-10-10Z" strokeDasharray="4 4" />
      <path d="M40 132h120" strokeDasharray="1 5" />
    </>
  ),
  cosmetic: (
    <>
      <T d={INCISOR} x={92} y={110} s={1.9} />
      <path d="M128 52c8 2 12 8 12 16l-2 50c0 6-4 10-8 10" />
      <path d="M150 40l5 12 12 5-12 5-5 12-5-12-12-5 12-5Z" />
      <path d="M40 160h50" strokeDasharray="1 4" />
    </>
  ),
  pediatric: (
    <>
      <T x={100} y={110} s={1.35} />
      <circle cx="90" cy="96" r="2.8" />
      <circle cx="110" cy="96" r="2.8" />
      <path d="M92 108c5 4 11 4 16 0" />
      <path d="M150 50l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z" />
      <circle cx="48" cy="60" r="8" />
    </>
  ),
}

export default function TreatmentArt({ id, className = '' }: { id: TreatmentId; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {art[id]}
    </svg>
  )
}

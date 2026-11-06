/**
 * Studio-portrait placeholder: an out-of-focus silhouette under a soft key light,
 * so the layout reads like photography without inventing a real person.
 * Replaced automatically when a doctor's `portrait` is set in the clinic config.
 */
export default function PortraitPlaceholder({ hue = 0, className = '' }: { hue?: number; className?: string }) {
  const id = `pp${hue}`
  const bgA = ['#e4ecf6', '#efe9e1', '#e2eaf1'][hue % 3]
  const bgB = ['#8ea6c6', '#b39f86', '#869db5'][hue % 3]
  const tone = ['#cdbfb3', '#bfa894', '#d6c6b8'][hue % 3]
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}bg`} cx="30%" cy="22%" r="95%">
          <stop offset="0" stopColor={bgA} />
          <stop offset="1" stopColor={bgB} />
        </radialGradient>
        <linearGradient id={`${id}coat`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#eef2f7" />
          <stop offset="1" stopColor="#9fb0c6" />
        </linearGradient>
        <linearGradient id={`${id}skin`} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#f6efe8" />
          <stop offset="1" stopColor={tone} />
        </linearGradient>
        <filter id={`${id}blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${id}grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0" />
        </filter>
        <linearGradient id={`${id}vig`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#0b1a33" stopOpacity="0" />
          <stop offset="1" stopColor="#0b1a33" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#${id}bg)`} />
      <ellipse cx="80" cy="60" rx="150" ry="120" fill="#ffffff" opacity="0.35" filter={`url(#${id}blur)`} />
      <g filter={`url(#${id}blur)`}>
        <path d="M10 400c8-86 58-124 140-124s132 38 140 124Z" fill={`url(#${id}coat)`} />
        <path d="M126 280l24 52 24-52c-8-3-16-4-24-4s-16 1-24 4Z" fill="#2f4f7f" opacity="0.9" />
        <path d="M130 222h40v54c-6 8-13 12-20 12s-14-4-20-12Z" fill={`url(#${id}skin)`} />
        <path d="M150 104c-34 0-56 26-56 66 0 44 24 80 56 80s56-36 56-80c0-40-22-66-56-66Z" fill={`url(#${id}skin)`} />
        <path d="M94 168c-4-46 20-74 58-74 36 0 60 26 56 70-8-26-26-42-56-42-30 0-48 18-58 46Z" fill="#2a2f3a" opacity="0.75" />
      </g>
      <rect width="300" height="400" fill={`url(#${id}vig)`} />
      <rect width="300" height="400" filter={`url(#${id}grain)`} />
    </svg>
  )
}

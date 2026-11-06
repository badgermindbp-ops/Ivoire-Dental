/**
 * Illustrated SVG mascot used when WebGL is unavailable (or before 3D loads
 * in reduced-motion mode). Shaded with gradients to stay on-brand.
 */
export default function ToothFallback({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 340" className={className} role="img" aria-label="Smiling tooth mascot">
      <defs>
        <radialGradient id="tf-body" cx="38%" cy="28%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f3f1ec" />
          <stop offset="1" stopColor="#d9d4ca" />
        </radialGradient>
        <linearGradient id="tf-rim" x1="0" x2="1">
          <stop offset="0" stopColor="#9cc4ff" stopOpacity="0.55" />
          <stop offset="0.3" stopColor="#9cc4ff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="tf-shadow">
          <stop offset="0" stopColor="#0b1a33" stopOpacity="0.25" />
          <stop offset="1" stopColor="#0b1a33" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="322" rx="90" ry="12" fill="url(#tf-shadow)" />
      <path
        d="M150 52c-26-22-78-26-100 2-24 30-10 74 6 104 10 18 8 40 12 66 5 34 14 66 36 66 22 0 22-42 28-64 4-14 10-22 18-22s14 8 18 22c6 22 6 64 28 64s31-32 36-66c4-26 2-48 12-66 16-30 30-74 6-104-22-28-74-24-100-2Z"
        fill="url(#tf-body)"
      />
      <path
        d="M150 52c-26-22-78-26-100 2-24 30-10 74 6 104 10 18 8 40 12 66 5 34 14 66 36 66 22 0 22-42 28-64 4-14 10-22 18-22s14 8 18 22c6 22 6 64 28 64s31-32 36-66c4-26 2-48 12-66 16-30 30-74 6-104-22-28-74-24-100-2Z"
        fill="url(#tf-rim)"
      />
      <ellipse cx="116" cy="136" rx="12" ry="16" fill="#050a14" />
      <ellipse cx="184" cy="136" rx="12" ry="16" fill="#050a14" />
      <circle cx="120" cy="130" r="4" fill="#fff" />
      <circle cx="188" cy="130" r="4" fill="#fff" />
      <ellipse cx="94" cy="166" rx="14" ry="8" fill="#ff9fb2" opacity="0.45" />
      <ellipse cx="206" cy="166" rx="14" ry="8" fill="#ff9fb2" opacity="0.45" />
      <path d="M128 168c8 4 15 6 22 6s14-2 22-6c-2 14-11 24-22 24s-20-10-22-24Z" fill="#3b1424" />
      <path d="M140 184c4-4 7-5 10-5s6 1 10 5c-3 4-6 6-10 6s-7-2-10-6Z" fill="#ee8a9c" />
    </svg>
  )
}

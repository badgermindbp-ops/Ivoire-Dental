import { Fragment, type ElementType } from 'react'

/**
 * Splits text into masked words for GSAP reveals while keeping the full
 * sentence available to assistive tech via aria-label.
 */
export default function SplitWords({
  text,
  as: Tag = 'span',
  className = '',
  wordClassName = '',
  mask = true,
  accent = [],
  id,
}: {
  id?: string
  text: string
  as?: ElementType
  className?: string
  wordClassName?: string
  mask?: boolean
  /** words (exact match, punctuation-insensitive) rendered in the serif accent */
  accent?: string[]
}) {
  const words = text.split(' ')
  const norm = (w: string) => w.replace(/[.,!?]/g, '').toLowerCase()
  const accents = accent.map((a) => a.toLowerCase())
  return (
    <Tag id={id} className={className} aria-label={text}>
      {words.map((w, i) => {
        const isAccent = accents.includes(norm(w))
        const word = (
          <span aria-hidden className={`word ${isAccent ? 'serif-accent' : ''} ${wordClassName}`}>
            {w}
          </span>
        )
        return (
          <Fragment key={i}>
            {mask ? <span className="word-mask" aria-hidden>{word}</span> : word}
            {i < words.length - 1 && ' '}
          </Fragment>
        )
      })}
    </Tag>
  )
}

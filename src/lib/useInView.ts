import { useEffect, useState, type RefObject } from 'react'

/** Tracks viewport visibility. `once` keeps it true after the first intersection. */
export function useInView<T extends Element>(ref: RefObject<T | null>, rootMargin = '0px', once = false) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.disconnect()
        } else if (!once) setInView(false)
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin, once])
  return inView
}

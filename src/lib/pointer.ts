/** Global normalized pointer (-1..1), shared by 3D scenes and DOM effects without re-renders. */
export const pointer = { x: 0, y: 0, px: 0, py: 0, active: false }

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.px = e.clientX
      pointer.py = e.clientY
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
      pointer.active = true
    },
    { passive: true },
  )
}

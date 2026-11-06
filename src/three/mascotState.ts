/**
 * Mutable mood/state object. Animation timelines write into it, the mascot
 * damps toward it every frame — no React re-renders involved.
 */
export interface MascotState {
  /** 0 = gentle closed smile, 1 = big open smile */
  smile: number
  /** how strongly the head follows the cursor (0..1) */
  follow: number
  /** gaze offset in mascot space (-1..1) added to the cursor gaze */
  lookX: number
  lookY: number
  /** idle float amplitude multiplier */
  float: number
  /** extra happy squint (0..1) */
  squint: number
}

export const createMascotState = (p: Partial<MascotState> = {}): MascotState => ({
  smile: 0.35,
  follow: 1,
  lookX: 0,
  lookY: 0,
  float: 1,
  squint: 0,
  ...p,
})

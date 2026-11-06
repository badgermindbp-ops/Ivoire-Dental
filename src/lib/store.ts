import { useSyncExternalStore } from 'react'
import type { TreatmentId } from '../config/clinic'

/** Tiny global store for cross-section UI state (no extra dependency). */
type State = {
  ready: boolean
  selectedTreatment: TreatmentId | ''
  activeTreatment: number
  menuOpen: boolean
}
let state: State = { ready: false, selectedTreatment: '', activeTreatment: 0, menuOpen: false }
const listeners = new Set<() => void>()

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => sel(state), () => sel(state))
}

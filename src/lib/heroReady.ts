/** Resolved when the hero's 3D scene has rendered (or WebGL is unavailable) — the loader waits on it. */
export const heroReady = { resolve: () => {} }
export const heroReadyPromise = new Promise<void>((r) => (heroReady.resolve = r))

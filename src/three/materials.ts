import * as THREE from 'three'

/** Ceramic enamel: clear-coated, softly sheened, faintly warm toward the roots (vertex colour). */
export function createEnamel(opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    sheen: 0.55,
    sheenColor: new THREE.Color('#dce8fb'),
    sheenRoughness: 0.45,
    ior: 1.55,
    specularIntensity: 0.9,
    envMapIntensity: 1.15,
    ...opts,
  })
}

/** Adds an enamel gradient (bright crown → warm ivory root) as vertex colours. */
export function paintEnamel(geo: THREE.BufferGeometry, top = '#ffffff', bottom = '#efe3cf', split = 0) {
  if (geo.getAttribute('color')) return geo
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const a = new THREE.Color(top)
  const b = new THREE.Color(bottom)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const t = THREE.MathUtils.smoothstep(y, split - 0.55, split + 0.15)
    c.copy(b).lerp(a, t)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

let blushTex: THREE.Texture | null = null
export function getBlushTexture() {
  if (blushTex) return blushTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.55, 'rgba(255,255,255,0.45)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  blushTex = new THREE.CanvasTexture(c)
  blushTex.colorSpace = THREE.SRGBColorSpace
  return blushTex
}

let glowTex: THREE.Texture | null = null
/** Soft round sprite used by particle systems. */
export function getGlowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.6)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  glowTex = new THREE.CanvasTexture(c)
  return glowTex
}

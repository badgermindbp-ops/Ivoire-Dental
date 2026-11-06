import * as THREE from 'three'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'

/**
 * Procedural tooth geometry built from signed distance fields and polygonized
 * with marching cubes. Produces smooth, organic enamel forms without any
 * external model files. Results are cached per variant.
 */

type V3 = [number, number, number]

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const mix = (a: number, b: number, t: number) => a + (b - a) * t

function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}
function smax(a: number, b: number, k: number) {
  return -smin(-a, -b, k)
}
function sdRoundBox(x: number, y: number, z: number, bx: number, by: number, bz: number, r: number) {
  const qx = Math.abs(x) - bx + r
  const qy = Math.abs(y) - by + r
  const qz = Math.abs(z) - bz + r
  const ox = Math.max(qx, 0)
  const oy = Math.max(qy, 0)
  const oz = Math.max(qz, 0)
  return Math.hypot(ox, oy, oz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r
}
function sdSphere(x: number, y: number, z: number, c: V3, r: number) {
  return Math.hypot(x - c[0], y - c[1], z - c[2]) - r
}
/** Capsule with linearly interpolated radius — a soft tapered root. */
function sdTaper(x: number, y: number, z: number, a: V3, b: V3, r1: number, r2: number) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2]
  const pax = x - a[0], pay = y - a[1], paz = z - a[2]
  const t = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1)
  return Math.hypot(pax - bax * t, pay - bay * t, paz - baz * t) - mix(r1, r2, t)
}

export type ToothVariant = 'mascot' | 'molar' | 'incisor'

/** Friendly, slightly stylised molar with two bumps and two roots. */
function sdfMascot(x: number, y: number, z: number) {
  // gentle taper: crown wider at the top
  const taper = 1 + 0.1 * (y - 0.15)
  const cx = x / taper
  let d = sdRoundBox(cx, y - 0.2, z, 0.5, 0.36, 0.4, 0.3)
  // two soft cusps
  d = smin(d, sdSphere(x, y, z, [-0.25, 0.42, 0], 0.3), 0.18)
  d = smin(d, sdSphere(x, y, z, [0.25, 0.42, 0], 0.3), 0.18)
  // central groove between cusps
  const groove = Math.hypot(x, y - 0.8) - 0.17
  d = smax(d, -groove, 0.16)
  // belly
  d = smin(d, sdSphere(x, y, z, [0, 0.1, 0.06], 0.42), 0.12)
  // two roots
  d = smin(d, sdTaper(x, y, z, [-0.26, -0.05, 0], [-0.3, -0.74, 0.02], 0.22, 0.1), 0.2)
  d = smin(d, sdTaper(x, y, z, [0.26, -0.05, 0], [0.3, -0.74, 0.02], 0.22, 0.1), 0.2)
  return d
}

/** Anatomically-inspired molar: four cusps, fissures, cervical waist, three roots. */
function sdfMolar(x: number, y: number, z: number) {
  const waist = 1 - 0.18 * Math.exp(-((y - 0.02) ** 2) / 0.02)
  const cx = x / waist
  const cz = z / waist
  let d = sdRoundBox(cx, y - 0.24, cz, 0.46, 0.3, 0.42, 0.2)
  const cusps: V3[] = [
    [-0.2, 0.48, -0.18],
    [0.2, 0.48, -0.18],
    [-0.2, 0.47, 0.19],
    [0.21, 0.46, 0.18],
  ]
  for (const c of cusps) d = smin(d, sdSphere(x, y, z, c, 0.21), 0.12)
  // fissures
  const fx = Math.hypot(y - 0.66, z) - 0.06
  const fz = Math.hypot(y - 0.66, x) - 0.06
  d = smax(d, -smin(fx, fz, 0.05), 0.07)
  // three roots with a slight distal curve
  d = smin(d, sdTaper(x, y, z, [-0.22, -0.02, 0.14], [-0.28, -0.84, 0.18], 0.17, 0.05), 0.12)
  d = smin(d, sdTaper(x, y, z, [0.22, -0.02, 0.14], [0.27, -0.86, 0.2], 0.17, 0.05), 0.12)
  d = smin(d, sdTaper(x, y, z, [0, -0.02, -0.18], [0.02, -0.8, -0.3], 0.18, 0.05), 0.12)
  // micro surface variation
  d += 0.006 * Math.sin(x * 23 + z * 7) * Math.sin(y * 19 + x * 5)
  return d
}

function sdEllipsoid(x: number, y: number, z: number, rx: number, ry: number, rz: number) {
  const k0 = Math.hypot(x / rx, y / ry, z / rz)
  const k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz))
  return (k0 * (k0 - 1)) / k1
}

/** Incisor: shovel-shaped crown with a flat incisal edge and a single tapered root. */
function sdfIncisor(x: number, y: number, z: number) {
  // crown flares toward the incisal edge and thins labio-lingually
  const t = clamp((y - 0.05) / 0.6, 0, 1)
  let d = sdEllipsoid(x / mix(0.85, 1.05, t), y - 0.3, z / mix(1, 0.62, t), 0.3, 0.46, 0.22)
  d = smax(d, y - 0.66, 0.07) // incisal edge
  d = smax(d, -sdSphere(x, y, z, [0, 0.4, -0.34], 0.2), 0.08) // lingual fossa
  d = smin(d, sdTaper(x, y, z, [0, 0.02, -0.01], [0, -0.82, -0.06], 0.19, 0.05), 0.16)
  return d
}

const SDFS: Record<ToothVariant, (x: number, y: number, z: number) => number> = {
  mascot: sdfMascot,
  molar: sdfMolar,
  incisor: sdfIncisor,
}

export function toothSDF(variant: ToothVariant) {
  return SDFS[variant]
}

const cache = new Map<string, THREE.BufferGeometry>()

/**
 * Builds (and caches) a static BufferGeometry for the variant.
 * `resolution` trades quality for build time (≈ res³ field samples).
 */
export function getToothGeometry(variant: ToothVariant, resolution = 72): THREE.BufferGeometry {
  const key = `${variant}:${resolution}`
  const hit = cache.get(key)
  if (hit) return hit

  const sdf = SDFS[variant]
  const mc = new MarchingCubes(resolution, new THREE.MeshBasicMaterial(), false, false, 120000)
  mc.isolation = 80
  const size = mc.size
  const half = mc.halfsize
  const field = mc.field
  for (let k = 0; k < size; k++) {
    const z = (k - half) / half
    for (let j = 0; j < size; j++) {
      const y = (j - half) / half
      const off = k * size * size + j * size
      for (let i = 0; i < size; i++) {
        const x = (i - half) / half
        field[off + i] = 80 - sdf(x, y, z) * 900
      }
    }
  }
  mc.update()

  const count = mc.count
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(mc.positionArray.slice(0, count * 3), 3))
  geo.setAttribute('normal', new THREE.BufferAttribute(mc.normalArray.slice(0, count * 3), 3))
  geo.computeBoundingSphere()
  geo.computeBoundingBox()
  mc.geometry.dispose()
  ;(mc.material as THREE.Material).dispose()

  cache.set(key, geo)
  return geo
}

/** Projects a front-facing (x, y) onto the surface of the SDF and returns point + normal. */
export function projectToSurface(variant: ToothVariant, x: number, y: number, inset = 0) {
  const sdf = SDFS[variant]
  let z = 1
  let prev = sdf(x, y, z)
  for (let i = 0; i < 400; i++) {
    const nz = z - 0.004
    const d = sdf(x, y, nz)
    if (d < 0) {
      // linear refine
      z = nz + (0.004 * d) / (d - prev)
      break
    }
    prev = d
    z = nz
  }
  const e = 0.002
  const n = new THREE.Vector3(
    sdf(x + e, y, z) - sdf(x - e, y, z),
    sdf(x, y + e, z) - sdf(x, y - e, z),
    sdf(x, y, z + e) - sdf(x, y, z - e),
  ).normalize()
  const p = new THREE.Vector3(x, y, z).addScaledVector(n, -inset)
  return { position: p, normal: n }
}

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getToothGeometry, projectToSurface } from './toothGeometry'
import { createEnamel, getBlushTexture, paintEnamel } from './materials'
import { pointer } from '../lib/pointer'
import type { MascotState } from './mascotState'

/** Conform a flat XY geometry onto the mascot surface (decal-like). */
function conform(geo: THREE.BufferGeometry, lift: number) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const { position, normal } = projectToSurface('mascot', pos.getX(i), pos.getY(i))
    position.addScaledVector(normal, lift)
    pos.setXYZ(i, position.x, position.y, position.z)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

function mouthShape(w: number, top: number, depth: number, cy: number) {
  const s = new THREE.Shape()
  s.moveTo(-w, cy)
  s.bezierCurveTo(-w * 0.5, cy + top, w * 0.5, cy + top, w, cy)
  s.bezierCurveTo(w * 0.55, cy - depth, -w * 0.55, cy - depth, -w, cy)
  return s
}

function buildMouth() {
  const segs = 24
  const closed = conform(new THREE.ShapeGeometry(mouthShape(0.11, -0.012, 0.045, -0.02), segs), 0.004)
  const open = conform(new THREE.ShapeGeometry(mouthShape(0.15, -0.03, 0.2, -0.0), segs), 0.004)
  closed.morphAttributes.position = [open.getAttribute('position').clone()]
  const tongueClosed = conform(new THREE.ShapeGeometry(mouthShape(0.05, 0.01, 0.02, -0.055), segs), 0.006)
  const tongueOpen = conform(new THREE.ShapeGeometry(mouthShape(0.085, 0.04, 0.07, -0.115), segs), 0.006)
  tongueClosed.morphAttributes.position = [tongueOpen.getAttribute('position').clone()]
  return { mouth: closed, tongue: tongueClosed }
}

type Built = ReturnType<typeof buildMascot>
let built: Built | null = null
function buildMascot() {
  const body = paintEnamel(getToothGeometry('mascot', 80), '#ffffff', '#efe2cc', 0.05)
  const eyes = [-1, 1].map((s) => projectToSurface('mascot', s * 0.19, 0.19))
  const cheeks = [-1, 1].map((s) => {
    const g = new THREE.CircleGeometry(0.075, 24)
    g.translate(s * 0.33, 0.04, 0)
    return conform(g, 0.003)
  })
  return { body, eyes, cheeks, ...buildMouth() }
}

const q = new THREE.Quaternion()
const Z = new THREE.Vector3(0, 0, 1)

export default function ToothMascot({
  state,
  interactive = true,
  ...props
}: { state: MascotState; interactive?: boolean } & React.JSX.IntrinsicElements['group']) {
  const geo = useMemo(() => (built ??= buildMascot()), [])
  const mats = useMemo(
    () => ({
      enamel: createEnamel(),
      eye: new THREE.MeshPhysicalMaterial({ color: '#04070f', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.45 }),
      shine: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
      mouth: new THREE.MeshStandardMaterial({ color: '#3b1424', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }),
      tongue: new THREE.MeshStandardMaterial({ color: '#ee8a9c', roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -4 }),
      blush: new THREE.MeshBasicMaterial({
        color: '#ff9fb2',
        map: getBlushTexture(),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    }),
    [],
  )

  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const eyeRefs = useRef<(THREE.Group | null)[]>([])
  const shineRefs = useRef<(THREE.Group | null)[]>([])
  const mouth = useRef<THREE.Mesh>(null)
  const tongue = useRef<THREE.Mesh>(null)
  const live = useRef({ smile: state.smile, rx: 0, ry: 0, gx: 0, gy: 0, blink: 1, nextBlink: 2.5, squint: 0 })

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const L = live.current
    const k = 1 - Math.exp(-dt * 5)

    // cursor follow
    const fx = interactive ? pointer.x * state.follow : 0
    const fy = interactive ? pointer.y * state.follow : 0
    L.ry += (fx * 0.5 - L.ry) * k
    L.rx += (-fy * 0.28 - L.rx) * k
    if (head.current) {
      head.current.rotation.y = L.ry + Math.sin(t * 0.6) * 0.04 * state.float
      head.current.rotation.x = L.rx + Math.sin(t * 0.8) * 0.02 * state.float
      head.current.rotation.z = Math.sin(t * 0.7) * 0.03 * state.float - L.ry * 0.08
    }
    // float + breathing
    if (body.current) {
      body.current.position.y = Math.sin(t * 1.1) * 0.06 * state.float
      const br = Math.sin(t * 1.7) * 0.012 * state.float
      body.current.scale.set(1 - br * 0.5, 1 + br, 1 - br * 0.5)
    }
    // blink
    if (t > L.nextBlink) {
      L.blink = 0
      L.nextBlink = t + 2.2 + Math.random() * 3.2
    }
    L.blink += (1 - L.blink) * (1 - Math.exp(-dt * 14))
    L.squint += (state.squint - L.squint) * k
    const eyeY = Math.max(0.08, Math.min(1, L.blink * 1.25 - 0.25)) * (1 - L.squint * 0.45)
    // gaze
    L.gx += ((fx + state.lookX) * 0.022 - L.gx) * k
    L.gy += ((fy + state.lookY) * 0.02 - L.gy) * k
    eyeRefs.current.forEach((e) => {
      if (!e) return
      e.scale.y = eyeY
    })
    shineRefs.current.forEach((s) => s?.position.set(L.gx, L.gy, 0))
    // smile morph
    L.smile += (state.smile - L.smile) * k
    if (mouth.current?.morphTargetInfluences) mouth.current.morphTargetInfluences[0] = L.smile
    if (tongue.current?.morphTargetInfluences) tongue.current.morphTargetInfluences[0] = L.smile
  })

  return (
    <group ref={root} {...props}>
      <group ref={body}>
        <group ref={head}>
          <mesh geometry={geo.body} material={mats.enamel} castShadow receiveShadow />
          {geo.eyes.map((e, i) => (
            <group
              key={i}
              position={e.position}
              quaternion={q.setFromUnitVectors(Z, e.normal).clone()}
              ref={(el) => {
                eyeRefs.current[i] = el
              }}
            >
              <mesh material={mats.eye} scale={[0.068, 0.092, 0.04]}>
                <sphereGeometry args={[1, 32, 24]} />
              </mesh>
              <group
                ref={(el) => {
                  shineRefs.current[i] = el
                }}
              >
                <mesh material={mats.shine} position={[0.022, 0.034, 0.034]} scale={0.02}>
                  <sphereGeometry args={[1, 12, 8]} />
                </mesh>
                <mesh material={mats.shine} position={[-0.02, -0.03, 0.035]} scale={0.009}>
                  <sphereGeometry args={[1, 10, 6]} />
                </mesh>
              </group>
            </group>
          ))}
          <mesh ref={mouth} geometry={geo.mouth} material={mats.mouth} morphTargetInfluences={[0]} />
          <mesh ref={tongue} geometry={geo.tongue} material={mats.tongue} morphTargetInfluences={[0]} />
          {geo.cheeks.map((c, i) => (
            <mesh key={i} geometry={c} material={mats.blush} renderOrder={2} />
          ))}
        </group>
      </group>
    </group>
  )
}

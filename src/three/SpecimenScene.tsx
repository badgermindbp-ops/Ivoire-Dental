import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { Studio } from './Studio'
import ToothMascot from './ToothMascot'
import { createMascotState } from './mascotState'
import { getToothGeometry, projectToSurface, type ToothVariant } from './toothGeometry'
import { createEnamel, paintEnamel } from './materials'
import { store } from '../lib/store'
import { pointer } from '../lib/pointer'
import { specimenInput } from '../lib/sceneInputs'

const damp = THREE.MathUtils.damp


function useAssets() {
  return useMemo(() => {
    const molar = paintEnamel(getToothGeometry('molar', 72), '#ffffff', '#ecdcc2', 0.1)
    const incisor = paintEnamel(getToothGeometry('incisor', 60), '#ffffff', '#ecdcc2', 0.05)
    const enamel = createEnamel()
    const crownClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.02)
    const crown = createEnamel({ clippingPlanes: [crownClip], clipShadows: true, side: THREE.DoubleSide })
    const metal = new THREE.MeshPhysicalMaterial({ color: '#c9d2de', metalness: 1, roughness: 0.22, clearcoat: 0.4 })
    const ghost = createEnamel({ transparent: true, opacity: 0.28, depthWrite: false, roughness: 0.1 })
    const shell = new THREE.MeshPhysicalMaterial({
      color: '#e8f2ff',
      roughness: 0.04,
      transmission: 1,
      thickness: 0.15,
      ior: 1.35,
      clearcoat: 1,
      transparent: true,
      opacity: 0.85,
    })
    const canal = new THREE.MeshStandardMaterial({ color: '#2f63b5', emissive: '#4f86e0', emissiveIntensity: 1.6, toneMapped: false })
    const glow = new THREE.MeshBasicMaterial({ color: '#cfe2ff', transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false })
    const veneer = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.3, sheen: 0.4 })

    // implant screw: tapered core + helical thread
    const thread = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        Array.from({ length: 160 }, (_, i) => {
          const t = i / 159
          const a = t * Math.PI * 2 * 7
          const r = 0.17 - t * 0.07
          return new THREE.Vector3(Math.cos(a) * r, -t * 0.9, Math.sin(a) * r)
        }),
      ),
      400,
      0.022,
      8,
    )
    const core = new THREE.CylinderGeometry(0.15, 0.08, 0.95, 32)
    core.translate(0, -0.47, 0)

    // root canal paths inside the molar
    const canals = [
      [[0, 0.3, 0], [-0.12, -0.2, 0.1], [-0.26, -0.78, 0.17]],
      [[0, 0.3, 0], [0.12, -0.2, 0.1], [0.25, -0.8, 0.19]],
      [[0, 0.3, 0], [0.01, -0.25, -0.15], [0.02, -0.74, -0.28]],
    ].map(
      (pts) =>
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...(p as [number, number, number])))), 48, 0.025, 8),
    )
    const chamber = new THREE.SphereGeometry(0.12, 24, 16)
    chamber.scale(1.4, 0.7, 1.2)
    chamber.translate(0, 0.3, 0)

    // bracket + archwire
    const bracket = new THREE.BoxGeometry(0.2, 0.17, 0.07, 2, 2, 1)

    // veneer shell: thin front slice of the incisor
    const veneerGeo = new THREE.SphereGeometry(1, 40, 24, -Math.PI / 2.4, Math.PI / 1.2, Math.PI / 5, Math.PI / 2.1)
    veneerGeo.scale(0.36, 0.5, 0.18)
    veneerGeo.translate(0, 0.28, 0.08)

    return { molar, incisor, enamel, crown, crownClip, metal, ghost, shell, canal, glow, veneer, thread, core, canals, chamber, bracket, veneerGeo }
  }, [])
}

type A = ReturnType<typeof useAssets>

/** Arc of teeth used by several variants. Brackets and the archwire sit on the real enamel surface. */
function Arch({ a, n = 5, shell = false, brackets = false }: { a: A; n?: number; shell?: boolean; brackets?: boolean }) {
  const layout = useMemo(() => {
    const S = 0.62
    const teeth = Array.from({ length: n }, (_, i) => {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5
      const variant: ToothVariant = Math.abs(t) < 0.3 ? 'incisor' : 'molar'
      const pos = new THREE.Vector3(t * (n > 3 ? 2.4 : 1.6), 0, -Math.abs(t) * (n > 3 ? 1.2 : 0.5))
      const ry = -t * 0.9
      // bracket pad on the labial surface, mid-crown
      const surf = projectToSurface(variant, 0, 0.3)
      const local = surf.position.clone().multiplyScalar(S).addScaledVector(surf.normal, 0.03)
      const world = local.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(pos)
      return { variant, pos, ry, local, normal: surf.normal, world }
    })
    const wire = brackets
      ? new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            teeth[0].world.clone().add(new THREE.Vector3(-0.25, 0, -0.18)),
            ...teeth.map((t) => t.world.clone().add(new THREE.Vector3(0, 0, 0.035))),
            teeth[n - 1].world.clone().add(new THREE.Vector3(0.25, 0, -0.18)),
          ]),
          96,
          0.011,
          8,
        )
      : null
    return { teeth, wire, S }
  }, [n, brackets])

  return (
    <group position-y={-0.1}>
      {layout.teeth.map((t, i) => {
        const geo = t.variant === 'incisor' ? a.incisor : a.molar
        return (
          <group key={i} position={t.pos} rotation-y={t.ry}>
            <mesh geometry={geo} material={a.enamel} scale={layout.S} />
            {shell && <mesh geometry={geo} material={a.shell} scale={[0.66, 0.64, 0.68]} position-y={0.01} />}
            {brackets && (
              <mesh
                geometry={a.bracket}
                material={a.metal}
                position={t.local}
                quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), t.normal)}
                scale={0.62}
              />
            )}
          </group>
        )
      })}
      {layout.wire && <mesh geometry={layout.wire} material={a.metal} />}
    </group>
  )
}

const pediatricMood = createMascotState({ smile: 0.9, squint: 0.4, follow: 0.6 })

function Variant({ index, children }: { index: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const active = store.get().activeTreatment === index
    const s = damp(g.scale.x, active ? 1 : 0.001, active ? 6 : 9, dt)
    g.scale.setScalar(s)
    g.visible = s > 0.01
    g.position.y = damp(g.position.y, active ? 0 : -0.6, 6, dt)
  })
  return (
    <group ref={ref} scale={0.001}>
      {children}
    </group>
  )
}

function Specimens() {
  const a = useAssets()
  const turn = useRef<THREE.Group>(null)
  const veneerRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const { gl } = useThree()
  gl.localClippingEnabled = true

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    if (turn.current) {
      turn.current.rotation.y += dt * (0.25 + specimenInput.hover * 1.4)
      turn.current.rotation.x = damp(turn.current.rotation.x, -pointer.y * 0.15 + 0.08, 3, dt)
    }
    if (veneerRef.current) veneerRef.current.position.z = 0.02 + Math.max(0, Math.sin(t * 0.9)) * 0.35
    if (glowRef.current) {
      const p = 1 + Math.sin(t * 2) * 0.06
      glowRef.current.scale.setScalar(p)
      a.glow.opacity = 0.18 + Math.sin(t * 2) * 0.08
    }
  })

  return (
    <>
    <group ref={turn}>
      {/* 0 smile makeover */}
      <Variant index={0}>
        <group scale={0.72}>
          <Arch a={a} n={5} />
        </group>
      </Variant>
      {/* 1 implants */}
      <Variant index={1}>
        <group position-y={0.35}>
          <mesh geometry={a.molar} material={a.crown} scale={0.9} />
          <mesh geometry={a.core} material={a.metal} position-y={-0.05} />
          <mesh geometry={a.thread} material={a.metal} position-y={-0.05} />
          <mesh material={a.metal} position-y={0.0}>
            <cylinderGeometry args={[0.12, 0.15, 0.12, 32]} />
          </mesh>
        </group>
      </Variant>
      {/* 2 whitening */}
      <Variant index={2}>
        <mesh geometry={a.molar} material={a.enamel} />
        <mesh ref={glowRef} material={a.glow}>
          <sphereGeometry args={[1.05, 32, 24]} />
        </mesh>
      </Variant>
      {/* 3 root canal */}
      <Variant index={3}>
        <mesh geometry={a.molar} material={a.ghost} renderOrder={2} />
        {a.canals.map((g, i) => (
          <mesh key={i} geometry={g} material={a.canal} />
        ))}
        <mesh geometry={a.chamber} material={a.canal} />
      </Variant>
      {/* 4 orthodontics */}
      <Variant index={4}>
        <group scale={0.9}>
          <Arch a={a} n={3} brackets />
        </group>
      </Variant>
      {/* 5 aligners */}
      <Variant index={5}>
        <group scale={0.9}>
          <Arch a={a} n={3} shell />
        </group>
      </Variant>
      {/* 6 cosmetic — veneer floats onto the incisor */}
      <Variant index={6}>
        <group scale={1.3}>
          <mesh geometry={a.incisor} material={a.enamel} />
          <mesh ref={veneerRef} geometry={a.veneerGeo} material={a.veneer} />
        </group>
      </Variant>
    </group>
      {/* 7 pediatric — a small, happy mascot that keeps facing you */}
      <Variant index={7}>
        <ToothMascot state={pediatricMood} scale={0.85} />
      </Variant>
    </>
  )
}

export default function SpecimenScene() {
  return (
    <>
      <Studio />
      <Specimens />
      <ContactShadows position={[0, -1.25, 0]} opacity={0.3} scale={6} blur={2.4} far={2.5} color="#0b1a33" />
    </>
  )
}

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import ToothMascot from './ToothMascot'
import { Studio } from './Studio'
import { getToothGeometry } from './toothGeometry'
import { createEnamel, paintEnamel } from './materials'
import { storyMascot, storyState } from '../animations/storyTimeline'

const damp = THREE.MathUtils.damp

/** Floating dental elements: mini specimens, a pearl, a floss loop and sparkle stars. */
function FloatingElements() {
  const group = useRef<THREE.Group>(null)
  const molar = useMemo(() => paintEnamel(getToothGeometry('molar', 56), '#ffffff', '#efe4d2'), [])
  const incisor = useMemo(() => paintEnamel(getToothGeometry('incisor', 48), '#ffffff', '#efe4d2'), [])
  const enamel = useMemo(() => createEnamel(), [])
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#cfe0f7',
        roughness: 0.05,
        transmission: 1,
        thickness: 0.6,
        ior: 1.4,
        clearcoat: 1,
        envMapIntensity: 1.4,
      }),
    [],
  )
  const floss = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#7fa8d8', roughness: 0.3, clearcoat: 1 }), [])
  const star = useMemo(() => {
    const s = new THREE.Shape()
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? 0.035 : 0.13
      const a = (i / 8) * Math.PI * 2
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    return new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 2 })
  }, [])
  const starMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#bcd6ff', emissiveIntensity: 0.6, roughness: 0.2 }), [])

  useFrame((_, dt) => {
    if (!group.current) return
    // elements drift in with scroll progress, parallaxed by depth
    group.current.children.forEach((c, i) => {
      const depth = 0.4 + (i % 3) * 0.3
      c.position.y = damp(c.position.y, (c.userData.baseY as number) + (storyState.progress - 0.5) * 2.2 * depth, 3, dt)
    })
    group.current.visible = storyState.elements > 0.01
    group.current.scale.setScalar(damp(group.current.scale.x, 0.6 + storyState.elements * 0.4, 4, dt))
  })

  const items: { el: React.ReactNode; p: [number, number, number] }[] = [
    { el: <mesh geometry={molar} material={enamel} scale={0.32} rotation={[0.4, 0.6, 0.2]} />, p: [-1.7, 1.1, -0.6] },
    { el: <mesh geometry={incisor} material={enamel} scale={0.3} rotation={[0.2, -0.5, -0.4]} />, p: [1.5, -1.25, -0.2] },
    { el: <mesh material={glass} scale={0.22}><sphereGeometry args={[1, 48, 32]} /></mesh>, p: [1.35, 1.25, -0.4] },
    { el: <mesh material={floss} rotation={[1.1, 0.3, 0]}><torusGeometry args={[0.2, 0.025, 16, 64]} /></mesh>, p: [-1.45, -1.05, 0.2] },
    { el: <mesh geometry={star} material={starMat} />, p: [-0.95, 1.6, 0.3] },
    { el: <mesh geometry={star} material={starMat} scale={0.7} />, p: [1.05, 0.35, 0.6] },
    { el: <mesh material={glass} scale={0.12}><sphereGeometry args={[1, 32, 24]} /></mesh>, p: [-1.9, 0.1, -1] },
  ]

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <group key={i} position={it.p} userData={{ baseY: it.p[1] }}>
          <Float speed={1.4 + i * 0.2} rotationIntensity={0.8} floatIntensity={0.6}>
            {it.el}
          </Float>
        </group>
      ))}
    </group>
  )
}

function Rig() {
  const ref = useRef<THREE.Group>(null)
  const { size } = useThree()
  const narrow = size.width < 640
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    // the mascot rises into frame, tilts its head toward the text, then settles
    g.position.y = damp(g.position.y, -2.6 + storyState.enter * 2.6 - storyState.leave * 0.6, 4, dt)
    g.rotation.z = damp(g.rotation.z, storyState.tilt * 0.22, 4, dt)
    g.rotation.y = damp(g.rotation.y, -0.35 + storyState.tilt * -0.2, 4, dt)
    const s = narrow ? 0.85 : 1
    g.scale.setScalar(damp(g.scale.x, s * (0.85 + storyState.enter * 0.15), 4, dt))
  })
  return (
    <group ref={ref} position={[0, -2.6, 0]}>
      <ToothMascot state={storyMascot} />
    </group>
  )
}

export default function StoryScene() {
  return (
    <>
      <Studio />
      <Rig />
      <FloatingElements />
    </>
  )
}

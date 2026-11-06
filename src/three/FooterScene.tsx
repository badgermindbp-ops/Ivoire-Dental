import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import ToothMascot from './ToothMascot'
import { createMascotState } from './mascotState'
import { Studio } from './Studio'
import { footerInput } from '../lib/sceneInputs'

const mood = createMascotState({ smile: 0.6, follow: 1 })

/** Small sign-off mascot: hops and beams when the visitor hovers the CTA. */
export default function FooterScene() {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const excited = footerInput.excited
    mood.smile = excited ? 1 : 0.6
    mood.squint = excited ? 0.8 : 0
    const hop = excited ? Math.abs(Math.sin(clock.elapsedTime * 6)) * 0.18 : 0
    g.position.y = THREE.MathUtils.damp(g.position.y, hop, 12, dt)
  })
  return (
    <>
      <Studio mood="night" />
      <group ref={ref}>
        <ToothMascot state={mood} />
      </group>
      <ContactShadows position={[0, -1.2, 0]} opacity={0.5} scale={4} blur={2.4} far={2} color="#000000" />
    </>
  )
}

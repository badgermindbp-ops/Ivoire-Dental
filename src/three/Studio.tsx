import { Environment, Lightformer } from '@react-three/drei'

/**
 * Procedural studio environment built from Lightformers — gives the enamel
 * soft-box reflections and coloured rims without downloading an HDR.
 */
export function Studio({ mood = 'pearl' }: { mood?: 'pearl' | 'night' }) {
  const night = mood === 'night'
  return (
    <>
      <Environment resolution={256} frames={1}>
        <color attach="background" args={[night ? '#0a1730' : '#eef2f8']} />
        {/* key softbox */}
        <Lightformer form="rect" intensity={night ? 2.2 : 3.2} position={[0, 4, 3]} scale={[8, 3, 1]} rotation-x={Math.PI / 2.6} />
        {/* front fill */}
        <Lightformer form="rect" intensity={night ? 0.8 : 1.6} position={[0, 0.5, 6]} scale={[6, 4, 1]} />
        {/* cool rim */}
        <Lightformer form="rect" color="#9cc4ff" intensity={night ? 4 : 2.4} position={[-5, 1, -2]} scale={[2, 6, 1]} rotation-y={Math.PI / 2.4} />
        {/* warm rim */}
        <Lightformer form="rect" color="#ffe6cc" intensity={night ? 1.2 : 1.8} position={[5, 0.5, -1]} scale={[2, 5, 1]} rotation-y={-Math.PI / 2.4} />
        {/* ring reflection — reads as a dental lamp in the enamel */}
        <Lightformer form="ring" intensity={night ? 3 : 2} position={[1.5, 2.5, 4]} scale={1.4} />
      </Environment>
      <ambientLight intensity={night ? 0.15 : 0.35} />
      <directionalLight
        position={[2.5, 5, 4]}
        intensity={night ? 0.8 : 1.4}
        color={night ? '#cfe0ff' : '#ffffff'}
      />
      <directionalLight position={[-4, 1, -3]} intensity={night ? 1.6 : 0.6} color="#8fb6ff" />
    </>
  )
}

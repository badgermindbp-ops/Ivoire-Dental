import { Canvas, type CanvasProps } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { useInView } from '../lib/useInView'
import { isMobileViewport } from '../lib/env'

/**
 * Shared Canvas wrapper:
 *  - renders only while near the viewport (frameloop toggling)
 *  - caps DPR on mobile
 *  - tone mapping / colour space tuned for ceramic materials
 */
export default function SceneCanvas({
  children,
  className,
  onReady,
  camera,
  label,
  ...rest
}: {
  children: ReactNode
  className?: string
  onReady?: () => void
  label: string
} & Omit<CanvasProps, 'children'>) {
  const wrap = useRef<HTMLDivElement>(null)
  const visible = useInView(wrap, '25% 0px')
  const [mobile] = useState(isMobileViewport)

  useEffect(() => {
    // when a canvas becomes visible again make sure it's sized correctly
    if (visible) window.dispatchEvent(new Event('resize'))
  }, [visible])

  return (
    <div ref={wrap} className={className} role="img" aria-label={label}>
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={mobile ? [1, 1.5] : [1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.98,
        }}
        camera={camera ?? { position: [0, 0, 6], fov: 30 }}
        onCreated={() => onReady?.()}
        style={{ pointerEvents: 'none' }}
        {...rest}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  )
}

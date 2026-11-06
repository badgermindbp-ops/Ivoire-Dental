import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import ToothMascot from './ToothMascot'
import { Studio } from './Studio'
import { getToothGeometry } from './toothGeometry'
import { createEnamel, getGlowTexture, paintEnamel } from './materials'
import { heroMascot, heroState } from '../animations/heroTimeline'
import { pointer } from '../lib/pointer'
import { isMobileViewport } from '../lib/env'

const damp = THREE.MathUtils.damp

/** Particles drifting through the environment — additive glowing sprites. */
function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(count * 3)
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 14
      p[i * 3 + 1] = (Math.random() - 0.5) * 8
      p[i * 3 + 2] = -Math.random() * 9 + 1.5
      s[i] = Math.random()
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    g.setAttribute('seed', new THREE.BufferAttribute(s, 1))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uMap: { value: getGlowTexture() }, uPx: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float seed;
        uniform float uTime; uniform float uPx;
        varying float vSeed;
        void main(){
          vSeed = seed;
          vec3 p = position;
          p.y += sin(uTime*0.3 + seed*20.0)*0.25;
          p.x += cos(uTime*0.2 + seed*12.0)*0.2;
          vec4 mv = modelViewMatrix * vec4(p,1.0);
          gl_PointSize = (1.2 + seed*seed*5.0) * uPx / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; uniform float uOpacity; uniform float uTime;
        varying float vSeed;
        void main(){
          float a = texture2D(uMap, gl_PointCoord).a;
          float tw = 0.55 + 0.45*sin(uTime*1.5 + vSeed*40.0);
          vec3 col = mix(vec3(0.62,0.78,1.0), vec3(1.0), vSeed);
          gl_FragColor = vec4(col, a * uOpacity * tw);
        }`,
    })
    return { geo: g, mat: m }
  }, [count])
  useFrame(({ clock, gl }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    mat.uniforms.uOpacity.value = 0.1 + heroState.env * 0.6
    mat.uniforms.uPx.value = gl.getPixelRatio() * 45
  })
  return <points ref={ref} geometry={geo} material={mat} />
}

/** Thin additive light streaks racing past — speed and opacity tied to scroll. */
function Streaks({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const data = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 16,
        y: (Math.random() - 0.5) * 6,
        z: -1 - Math.random() * 6,
        len: 1 + Math.random() * 3,
        speed: 0.6 + Math.random() * 1.6,
      })),
    [count],
  )
  const mat = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 4
    const g = c.getContext('2d')!
    const grd = g.createLinearGradient(0, 0, 256, 0)
    grd.addColorStop(0, 'rgba(160,200,255,0)')
    grd.addColorStop(0.8, 'rgba(200,225,255,0.9)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 256, 4)
    return new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame((_, dt) => {
    const m = ref.current
    if (!m) return
    mat.opacity = heroState.streaks * 0.85
    data.forEach((d, i) => {
      d.x += d.speed * dt * (0.4 + heroState.streaks * 2.2)
      if (d.x > 9) d.x = -9
      dummy.position.set(d.x, d.y, d.z)
      dummy.scale.set(d.len, 0.012, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={mat} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  )
}

/** Perspective floor grid that fades in with the environment. */
function Grid() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uOpacity: { value: 0 } },
        vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
        fragmentShader: /* glsl */ `
          uniform float uOpacity; varying vec3 vW;
          void main(){
            vec2 g = abs(fract(vW.xz*1.25 - 0.5) - 0.5) / fwidth(vW.xz*1.25);
            float line = 1.0 - min(min(g.x, g.y), 1.0);
            float fade = smoothstep(9.0, 1.5, length(vW.xz - vec2(0.0,-2.0)));
            gl_FragColor = vec4(0.45,0.6,0.85, line * fade * uOpacity * 0.55);
          }`,
      }),
    [],
  )
  useFrame(() => {
    mat.uniforms.uOpacity.value = heroState.env
  })
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -1.32, -2]} material={mat}>
      <planeGeometry args={[30, 20]} />
    </mesh>
  )
}

/** Translucent ghost specimens drifting in the depth of the environment. */
function GhostTeeth() {
  const group = useRef<THREE.Group>(null)
  const geo = useMemo(() => paintEnamel(getToothGeometry('molar', 56), '#ffffff', '#e8eef8'), [])
  const mat = useMemo(() => createEnamel({ transparent: true, opacity: 0, roughness: 0.15 }), [])
  const items = useMemo(
    () => [
      { p: [-4.8, 2.1, -5.5], s: 0.55, r: 0.4 },
      { p: [-4.6, -1.5, -6.5], s: 0.7, r: -0.3 },
      { p: [3.6, 1.6, -7], s: 0.8, r: 0.2 },
      { p: [-4.8, 0.2, -9], s: 0.9, r: 0.6 },
      { p: [5.2, -0.6, -5.5], s: 0.6, r: -0.5 },
      { p: [0.4, 2.2, -8.5], s: 0.7, r: 0.1 },
    ],
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    mat.opacity = heroState.env * 0.75
    mat.visible = heroState.env > 0.01
    group.current?.children.forEach((c, i) => {
      c.rotation.y = t * 0.15 * (i % 2 ? 1 : -1) + items[i].r
      c.rotation.x = Math.sin(t * 0.3 + i) * 0.3
      c.position.y = items[i].p[1] + Math.sin(t * 0.5 + i * 2) * 0.2 - (1 - heroState.env) * 1.5
    })
  })
  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} geometry={geo} material={mat} position={it.p as [number, number, number]} scale={it.s} />
      ))}
    </group>
  )
}

/** Halo ring behind the character — reads as a dental operatory lamp. */
function Halo({ target }: { target: React.RefObject<THREE.Group | null> }) {
  const ref = useRef<THREE.Group>(null)
  const matA = useMemo(() => new THREE.MeshBasicMaterial({ color: '#a9c9f5', transparent: true, opacity: 0, toneMapped: false }), [])
  const matB = useMemo(() => new THREE.MeshBasicMaterial({ color: '#dbe8ff', transparent: true, opacity: 0, toneMapped: false }), [])
  useFrame(({ clock }) => {
    if (!ref.current || !target.current) return
    ref.current.position.x = target.current.position.x
    ref.current.position.y = target.current.position.y + 0.05
    ref.current.rotation.z = clock.elapsedTime * 0.08
    const s = 0.8 + heroState.env * 0.25
    ref.current.scale.setScalar(s)
    matA.opacity = heroState.env * 0.75
    matB.opacity = heroState.env * 0.3
  })
  return (
    <group ref={ref} position={[0, 0, -1.2]}>
      <mesh material={matA}>
        <torusGeometry args={[1.55, 0.006, 8, 160]} />
      </mesh>
      <mesh material={matB} rotation-x={0.25}>
        <torusGeometry args={[1.9, 0.003, 8, 160, Math.PI * 1.4]} />
      </mesh>
    </group>
  )
}

/** Soft contact shadow that tracks the character and fades as it floats higher. */
function BlobShadow({ target }: { target: React.RefObject<THREE.Group | null> }) {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grd.addColorStop(0, 'rgba(11,26,51,0.55)')
    grd.addColorStop(0.5, 'rgba(11,26,51,0.18)')
    grd.addColorStop(1, 'rgba(11,26,51,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 128, 128)
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
  }, [])
  useFrame(() => {
    const t = target.current
    const m = ref.current
    if (!t || !m) return
    m.position.x = t.position.x
    const lift = THREE.MathUtils.clamp(t.position.y + 0.3, 0, 2)
    const s = t.scale.x * (1.9 - lift * 0.3)
    m.scale.set(s, s * 0.5, 1)
    mat.opacity = THREE.MathUtils.clamp(1 - lift * 0.35, 0, 1) * heroState.intro
  })
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position={[0, -1.3, 0]} material={mat}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}

function Rig() {
  const { camera, size } = useThree()
  const mascot = useRef<THREE.Group>(null)
  const narrow = size.width < 768
  useFrame((_, dt) => {
    const g = mascot.current
    if (!g) return
    const intro = heroState.intro
    // entrance: rises from below with a spin
    const introY = (1 - intro) * -2.4
    const introSpin = (1 - intro) * -2.2
    g.position.x = damp(g.position.x, heroState.x, 4, dt)
    g.position.y = damp(g.position.y, heroState.y + introY + heroState.exit * 0.1, 4, dt)
    g.rotation.y = damp(g.rotation.y, heroState.rotY + introSpin, 4, dt)
    const s = heroState.scale * (0.55 + intro * 0.45) * (narrow ? 0.82 : 1)
    g.scale.setScalar(damp(g.scale.x, s, 5, dt))
    // camera dolly + subtle pointer parallax
    camera.position.z = damp(camera.position.z, heroState.camZ, 4, dt)
    camera.position.x = damp(camera.position.x, pointer.x * 0.18, 2, dt)
    camera.position.y = damp(camera.position.y, pointer.y * 0.12 + 0.05, 2, dt)
    camera.lookAt(0, 0, 0)
  })
  return (
    <>
      <group ref={mascot}>
        <ToothMascot state={heroMascot} />
      </group>
      <Halo target={mascot} />
      <BlobShadow target={mascot} />
    </>
  )
}

export default function HeroScene() {
  const mobile = isMobileViewport()
  return (
    <>
      <Studio />
      <Rig />
      <Particles count={mobile ? 140 : 420} />
      <Streaks count={mobile ? 8 : 18} />
      <Grid />
      {!mobile && <GhostTeeth />}
    </>
  )
}

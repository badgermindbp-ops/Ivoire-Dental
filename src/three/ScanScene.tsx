import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Studio } from './Studio'
import { getToothGeometry } from './toothGeometry'
import { createEnamel } from './materials'
import { techState } from '../animations/techTimeline'
import { isMobileViewport } from '../lib/env'
import { pointer } from '../lib/pointer'

const damp = THREE.MathUtils.damp
const smooth = (a: number, b: number, v: number) => THREE.MathUtils.smoothstep(v, a, b)

/** Builds a 14-tooth arch (incisors → molars) along a parabola. */
function useArch() {
  return useMemo(() => {
    const molar = getToothGeometry('molar', 48)
    const incisor = getToothGeometry('incisor', 44)
    const teeth: { geo: THREE.BufferGeometry; matrix: THREE.Matrix4; isPlan: boolean }[] = []
    const half = 7
    for (let side = -1; side <= 1; side += 2) {
      for (let k = 0; k < half; k++) {
        const t = (k + 0.5) / half // 0 front → 1 back
        const ang = side * t * 1.25
        const x = Math.sin(ang) * 1.55
        const z = -Math.cos(ang) * 1.05 + 0.9 - t * t * 0.9
        const isIncisor = k < 3
        const s = isIncisor ? 0.3 : k < 5 ? 0.28 : 0.33
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(x, 0, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -ang, 0)),
          new THREE.Vector3(isIncisor ? s * 0.85 : s, s, s),
        )
        teeth.push({ geo: isIncisor ? incisor : molar, matrix: m, isPlan: side === 1 && k === 1 })
      }
    }
    // merged geometry for surface sampling (positions only)
    const parts = teeth.map(({ geo, matrix }) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', geo.getAttribute('position').clone())
      g.applyMatrix4(matrix)
      return g
    })
    const merged = mergeGeometries(parts)!
    return { teeth, merged }
  }, [])
}

function PointCloud({ merged, count }: { merged: THREE.BufferGeometry; count: number }) {
  const { geo, mat } = useMemo(() => {
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build()
    const pos = new Float32Array(count * 3)
    const rnd = new Float32Array(count)
    const v = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      sampler.sample(v)
      pos.set([v.x, v.y, v.z], i * 3)
      rnd[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uScan: { value: -3 }, uFade: { value: 1 }, uTime: { value: 0 }, uPx: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float rnd; uniform float uScan; uniform float uTime; uniform float uPx;
        varying float vLit; varying float vEdge; varying float vRnd;
        void main(){
          vRnd = rnd;
          float d = position.x - uScan;
          vLit = step(d, 0.0);
          vEdge = exp(-abs(d) * 14.0);
          vec3 p = position;
          // unscanned points hover slightly displaced, settling as the laser passes
          p.y += (1.0 - vLit) * (rnd - 0.5) * 0.08 + vEdge * 0.03 * sin(uTime*20.0 + rnd*30.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.3 + vEdge * 3.2) * uPx * clamp(5.0 / -mv.z, 0.6, 1.6);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uFade; varying float vLit; varying float vEdge; varying float vRnd;
        void main(){
          vec2 c = gl_PointCoord - 0.5; if (dot(c,c) > 0.25) discard;
          vec3 lit = mix(vec3(0.35,0.7,1.0), vec3(0.75,0.9,1.0), vRnd);
          vec3 col = mix(vec3(0.25,0.4,0.7), lit, vLit) + vEdge * vec3(0.9,1.0,1.0);
          float a = (0.18 + vLit * 0.62 + vEdge) * uFade;
          gl_FragColor = vec4(col, a);
        }`,
    })
    return { geo: g, mat: m }
  }, [merged, count])
  useFrame(({ clock, gl }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    mat.uniforms.uScan.value = -2.1 + smooth(0.02, 0.34, techState.progress) * 4.3
    mat.uniforms.uFade.value = 1 - smooth(0.4, 0.55, techState.progress) * 0.75 - smooth(0.84, 0.95, techState.progress) * 0.25
    mat.uniforms.uPx.value = gl.getPixelRatio()
  })
  return <points geometry={geo} material={mat} />
}

/** Fresnel "x-ray" shader for the diagnostics phase. */
function useXray() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uOpacity: { value: 0 }, uTime: { value: 0 } },
        vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
          void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vY = position.y; gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `uniform float uOpacity; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY;
          void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2);
            float band = smoothstep(0.02, 0.0, abs(fract(vY*1.5 - uTime*0.25) - 0.5) - 0.47);
            vec3 col = mix(vec3(0.2,0.45,0.9), vec3(0.8,0.92,1.0), f) ;
            gl_FragColor = vec4(col, (f*0.9 + 0.06 + band*0.35) * uOpacity); }`,
      }),
    [],
  )
}

function Arch() {
  const { teeth, merged } = useArch()
  const solid = useMemo(() => createEnamel({ vertexColors: false, transparent: true, opacity: 0 }), [])
  const plan = useMemo(() => createEnamel({ vertexColors: false, color: '#bcd6ff', emissive: '#2f63b5', emissiveIntensity: 0.6, transparent: true, opacity: 0 }), [])
  const xray = useXray()
  const planRef = useRef<THREE.Group>(null)
  const mobile = isMobileViewport()

  const planTooth = teeth.find((t) => t.isPlan)!
  const target = useMemo(() => new THREE.Vector3().setFromMatrixPosition(planTooth.matrix), [planTooth])
  const trailGeo = useMemo(() => {
    const from = target.clone().add(new THREE.Vector3(0.05, 0, 0.32))
    return new THREE.BufferGeometry().setFromPoints([from, target.clone().add(new THREE.Vector3(0, 0.02, 0))])
  }, [target])
  const trailMat = useMemo(() => new THREE.LineDashedMaterial({ color: '#7fb0ff', dashSize: 0.04, gapSize: 0.03, transparent: true, opacity: 0 }), [])
  const trailLine = useMemo(() => {
    const l = new THREE.Line(trailGeo, trailMat)
    l.computeLineDistances()
    return l
  }, [trailGeo, trailMat])

  useFrame(({ clock }) => {
    const p = techState.progress
    const solidO = smooth(0.38, 0.52, p) * (1 - smooth(0.68, 0.78, p)) + smooth(0.84, 0.96, p)
    solid.opacity = solidO
    solid.visible = solidO > 0.01
    const planO = smooth(0.45, 0.55, p) * (1 - smooth(0.7, 0.78, p))
    plan.opacity = planO
    plan.visible = planO > 0.01
    trailMat.opacity = planO
    xray.uniforms.uOpacity.value = smooth(0.66, 0.78, p) * (1 - smooth(0.86, 0.96, p))
    xray.uniforms.uTime.value = clock.elapsedTime
    xray.visible = xray.uniforms.uOpacity.value > 0.01
    // the planned tooth glides from crowded position into alignment
    if (planRef.current) {
      const move = smooth(0.5, 0.66, p)
      planRef.current.position.set(0.05 * (1 - move), 0.02 * Math.sin(move * Math.PI), 0.32 * (1 - move))
      planRef.current.rotation.y = (1 - move) * 0.5
    }
  })

  return (
    <group>
      <PointCloud merged={merged} count={mobile ? 9000 : 26000} />
      {teeth.map((t, i) => (
        <group key={i} matrixAutoUpdate={false} matrix={t.matrix}>
          {t.isPlan ? (
            <group ref={planRef}>
              <mesh geometry={t.geo} material={plan} />
            </group>
          ) : (
            <mesh geometry={t.geo} material={solid} />
          )}
          <mesh geometry={t.geo} material={xray} />
        </group>
      ))}
      <primitive object={trailLine} />
    </group>
  )
}

/** Vertical laser sheet sweeping across the arch during the scan phase. */
function Laser() {
  const ref = useRef<THREE.Group>(null)
  const mat = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 4
    const g = c.getContext('2d')!
    const grd = g.createLinearGradient(0, 0, 64, 0)
    grd.addColorStop(0, 'rgba(120,190,255,0)')
    grd.addColorStop(0.5, 'rgba(220,240,255,1)')
    grd.addColorStop(1, 'rgba(120,190,255,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 64, 4)
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  }, [])
  useFrame(() => {
    const p = techState.progress
    if (!ref.current) return
    ref.current.position.x = -2.1 + smooth(0.02, 0.34, p) * 4.3
    mat.opacity = smooth(0.0, 0.04, p) * (1 - smooth(0.32, 0.38, p))
    ref.current.visible = mat.opacity > 0.01
  })
  return (
    <group ref={ref}>
      <mesh material={mat} rotation-y={Math.PI / 2} scale={[0.01, 1, 1]}>
        <planeGeometry args={[3, 1.6]} />
      </mesh>
      <mesh material={mat} scale={[0.12, 1.6, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  )
}

/** Measurement rings & grid that frame the model like a CAD viewport. */
function Viewport() {
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: '#3d6fbf', transparent: true, opacity: 0.35 }), [])
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(8, 32, '#2b4f8f', '#1a3462')
    ;(g.material as THREE.Material).transparent = true
    ;(g.material as THREE.Material).opacity = 0.35
    g.position.y = -0.3
    return g
  }, [])
  const ring = useMemo(() => {
    const pts = Array.from({ length: 129 }, (_, i) => {
      const a = (i / 128) * Math.PI * 2
      return new THREE.Vector3(Math.cos(a) * 2.4, -0.29, Math.sin(a) * 2.4)
    })
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)
  }, [mat])
  return (
    <>
      <primitive object={grid} />
      <primitive object={ring} />
    </>
  )
}

function CameraRig() {
  const { camera, size } = useThree()
  const narrow = size.width < 768
  useFrame((_, dt) => {
    const p = techState.progress
    // orbit from a high frontal view toward a low three-quarter view
    const theta = -0.3 + p * 0.75 + pointer.x * 0.08
    const phi = 0.92 - p * 0.32
    const r = (narrow ? 7.4 : 5.6) - p * 0.5
    const tx = Math.sin(theta) * Math.sin(phi) * r
    const ty = Math.cos(phi) * r
    const tz = Math.cos(theta) * Math.sin(phi) * r
    camera.position.x = damp(camera.position.x, tx, 3, dt)
    camera.position.y = damp(camera.position.y, ty, 3, dt)
    camera.position.z = damp(camera.position.z, tz, 3, dt)
    camera.lookAt(0, 0, 0.1)
  })
  return null
}

export default function ScanScene() {
  return (
    <>
      <Studio mood="night" />
      <CameraRig />
      <Viewport />
      <Arch />
      <Laser />
    </>
  )
}

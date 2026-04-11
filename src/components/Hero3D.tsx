'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'

/* ── Floating particle field ──────────────────────────────────────── */
function ParticleField({ count = 600 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!)

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10
      vel[i * 3] = (Math.random() - 0.5) * 0.003
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.003
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002
    }
    return [pos, vel]
  }, [count])

  useFrame(() => {
    const pos = mesh.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3]
      arr[i * 3 + 1] += velocities[i * 3 + 1]
      arr[i * 3 + 2] += velocities[i * 3 + 2]
      // Wrap around
      if (Math.abs(arr[i * 3]) > 10) velocities[i * 3] *= -1
      if (Math.abs(arr[i * 3 + 1]) > 6) velocities[i * 3 + 1] *= -1
      if (Math.abs(arr[i * 3 + 2]) > 5) velocities[i * 3 + 2] *= -1
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#00F5FF"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ── Glowing ring ─────────────────────────────────────────────────── */
function GlowRing({
  radius,
  color,
  speed,
  tilt,
  offset,
}: {
  radius: number
  color: string
  speed: number
  tilt: [number, number, number]
  offset: number
}) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset
    ref.current.rotation.x = tilt[0] + Math.sin(t) * 0.15
    ref.current.rotation.y = tilt[1] + t * 0.3
    ref.current.rotation.z = tilt[2] + Math.cos(t) * 0.1
  })

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.015, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  )
}

/* ── Central portal core ──────────────────────────────────────────── */
function PortalCore() {
  const ref = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    ref.current.rotation.x = t * 0.15
    ref.current.rotation.y = t * 0.2
    ref.current.rotation.z = t * 0.1
    const s = 1 + Math.sin(t * 1.5) * 0.05
    ref.current.scale.setScalar(s)
    if (glowRef.current) {
      glowRef.current.scale.setScalar(s * 1.6)
      ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.06 + Math.sin(t * 2) * 0.03
    }
  })

  return (
    <group>
      {/* Inner glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#00F5FF" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      {/* Core shape  */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color="#0B0F1A"
          emissive="#00F5FF"
          emissiveIntensity={0.3}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  )
}

/* ── Mouse parallax controller ────────────────────────────────────── */
function MouseParallax() {
  const { camera } = useThree()
  const target = useRef({ x: 0, y: 0 })

  const handlePointerMove = useCallback((e: { clientX: number; clientY: number }) => {
    target.current.x = ((e.clientX / window.innerWidth) - 0.5) * 1.2
    target.current.y = ((e.clientY / window.innerHeight) - 0.5) * -0.8
  }, [])

  // Register global listener
  useMemo(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handlePointerMove)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handlePointerMove)
      }
    }
  }, [handlePointerMove])

  useFrame(() => {
    camera.position.x += (target.current.x - camera.position.x) * 0.03
    camera.position.y += (target.current.y - camera.position.y) * 0.03
    camera.lookAt(0, 0, 0)
  })

  return null
}

/* ── Main scene ───────────────────────────────────────────────────── */
function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#00F5FF" />
      <pointLight position={[-5, -3, 3]} intensity={0.4} color="#6366F1" />

      <ParticleField />
      <PortalCore />

      {/* Multi-layer orbital rings */}
      <GlowRing radius={2.0} color="#00F5FF" speed={0.4} tilt={[0.3, 0, 0.1]} offset={0} />
      <GlowRing radius={2.5} color="#6366F1" speed={0.3} tilt={[0.8, 0.2, 0]} offset={1} />
      <GlowRing radius={3.0} color="#00F5FF" speed={0.2} tilt={[1.2, 0.5, 0.3]} offset={2} />
      <GlowRing radius={3.5} color="#8B5CF6" speed={0.15} tilt={[0.5, 1.0, 0.6]} offset={3} />

      <MouseParallax />

      {/* Soft fog */}
      <fog attach="fog" args={['#0B0F1A', 5, 18]} />
    </>
  )
}

/* ── Exported component ───────────────────────────────────────────── */
export function Hero3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}

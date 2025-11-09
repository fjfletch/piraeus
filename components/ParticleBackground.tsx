// @ts-nocheck
"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Piraeus color palette
const COLORS = ['#033f63', '#28666e', '#7c9885', '#b5b682', '#fedc97'];

function Particles({ count = 5000, scrollY }: { count?: number; scrollY: number }) {
  const mesh = useRef<THREE.Points>(null);
  const colorRef = useRef<Float32Array | null>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute particles in a larger space
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      // Random scale
      scales[i] = Math.random() * 0.5 + 0.5;

      // Initial color
      const colorIndex = Math.floor(Math.random() * COLORS.length);
      const color = new THREE.Color(COLORS[colorIndex]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    colorRef.current = colors;

    return { positions, colors, scales };
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;

    const time = state.clock.getElapsedTime();
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    const colors = mesh.current.geometry.attributes.color.array as Float32Array;

    // Calculate color transition based on scroll
    const colorProgress = Math.min(scrollY / 2000, 1);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Wave motion
      const x = positions[i3];
      const z = positions[i3 + 2];
      positions[i3 + 1] += Math.sin(time * 0.5 + x * 0.01 + z * 0.01) * 0.02;

      // Rotation
      const angle = Math.atan2(z, x) + time * 0.05;
      const radius = Math.sqrt(x * x + z * z);
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Color transition through palette based on scroll
      const baseColorIndex = Math.floor((i / count + colorProgress) * COLORS.length) % COLORS.length;
      const nextColorIndex = (baseColorIndex + 1) % COLORS.length;
      const localProgress = ((i / count + colorProgress) * COLORS.length) % 1;

      const baseColor = new THREE.Color(COLORS[baseColorIndex]);
      const nextColor = new THREE.Color(COLORS[nextColorIndex]);

      colors[i3] = baseColor.r + (nextColor.r - baseColor.r) * localProgress;
      colors[i3 + 1] = baseColor.g + (nextColor.g - baseColor.g) * localProgress;
      colors[i3 + 2] = baseColor.b + (nextColor.b - baseColor.b) * localProgress;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.geometry.attributes.color.needsUpdate = true;

    // Rotate entire particle system slowly
    mesh.current.rotation.y = time * 0.05;
  });

  return (
    <points ref={mesh as any}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={count}
          array={particles.scales}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.8}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleBackground({ scrollY }: { scrollY: number }) {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        style={{ background: '#f8f9fa' }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Particles count={5000} scrollY={scrollY} />
      </Canvas>
    </div>
  );
}

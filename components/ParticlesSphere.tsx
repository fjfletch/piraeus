// @ts-nocheck
"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Piraeus color palette
const COLORS = ['#033f63', '#28666e', '#7c9885', '#b5b682', '#fedc97'];

function ParticleSphere({ count = 5000, scrollY }: { count?: number; scrollY: number }) {
  const mesh = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Create particles in a sphere distribution
    for (let i = 0; i < count; i++) {
      // Sphere distribution using spherical coordinates
      const radius = 15 + Math.random() * 10; // Vary radius for depth
      const theta = Math.random() * Math.PI * 2; // Angle around Y axis
      const phi = Math.acos((Math.random() * 2) - 1); // Angle from Y axis
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random scale
      scales[i] = Math.random() * 0.8 + 0.3;

      // Initial color based on position in sphere
      const colorIndex = Math.floor((i / count) * COLORS.length) % COLORS.length;
      const color = new THREE.Color(COLORS[colorIndex]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors, scales };
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;

    // Scroll-based rotation
    const scrollRotation = scrollY * 0.001; // Control rotation speed with scroll
    
    // Rotate based on scroll
    mesh.current.rotation.y = scrollRotation;
    mesh.current.rotation.x = scrollRotation * 0.5;
    
    // Add subtle continuous rotation
    mesh.current.rotation.z = state.clock.getElapsedTime() * 0.05;

    // Update colors based on scroll
    const colors = mesh.current.geometry.attributes.color.array as Float32Array;
    const colorProgress = (scrollY / 2000) % 1;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
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

    mesh.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
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
        size={0.5}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function ParticlesSphere3D({ scrollY }: { scrollY: number }) {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 50], fov: 60 }}
        style={{ background: '#f8f9fa' }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <ParticleSphere count={5000} scrollY={scrollY} />
      </Canvas>
    </div>
  );
}

// @ts-nocheck
"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleSphere({ scrollProgress }: { scrollProgress: number }) {
  const pointsRef = useRef();
  const particleCount = 5000;
  
  // Store original positions
  const originalPositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Fibonacci sphere distribution for even particle placement
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      
      const radius = 2;
      pos[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      pos[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    return pos;
  }, [particleCount]);
  
  // Generate colors
  const colors = useMemo(() => {
    const col = new Float32Array(particleCount * 3);
    
    // Color palette: #033F63, #28666E, #7C9885, #B5B682, #FEDC97
    const palette = [
      { r: 0.012, g: 0.247, b: 0.388 }, // #033F63 - dark blue
      { r: 0.157, g: 0.400, b: 0.431 }, // #28666E - teal
      { r: 0.486, g: 0.596, b: 0.522 }, // #7C9885 - sage green
      { r: 0.710, g: 0.714, b: 0.510 }, // #B5B682 - olive
      { r: 0.996, g: 0.863, b: 0.592 }, // #FEDC97 - light yellow
    ];
    
    for (let i = 0; i < particleCount; i++) {
      // Create smooth gradient across all colors
      const t = i / particleCount;
      const scaledT = t * (palette.length - 1);
      const colorIndex = Math.floor(scaledT);
      const localT = scaledT - colorIndex;
      
      const color1 = palette[Math.min(colorIndex, palette.length - 1)];
      const color2 = palette[Math.min(colorIndex + 1, palette.length - 1)];
      
      // Interpolate between colors
      col[i * 3] = color1.r + (color2.r - color1.r) * localT;
      col[i * 3 + 1] = color1.g + (color2.g - color1.g) * localT;
      col[i * 3 + 2] = color1.b + (color2.b - color1.b) * localT;
    }
    
    return col;
  }, [particleCount]);
  
  // Create a copy for the geometry
  const positions = useMemo(() => {
    return new Float32Array(originalPositions);
  }, [originalPositions]);
  
  // Animate particles based on scroll
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    
    const time = clock.getElapsedTime();
    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.attributes.position;
    
    // Morph particles based on scroll
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Get original position
      const x = originalPositions[i3];
      const y = originalPositions[i3 + 1];
      const z = originalPositions[i3 + 2];
      
      // Calculate distance from center
      const distance = Math.sqrt(x * x + y * y + z * z);
      
      // Wave effect based on scroll
      const waveOffset = Math.sin(time + i * 0.01) * 0.1;
      const scrollEffect = scrollProgress * 2;
      
      // Morph the sphere shape based on scroll
      const morphFactor = 1 + Math.sin(scrollProgress * Math.PI * 2 + i * 0.1) * 0.5;
      
      // Apply transformations
      positionAttribute.array[i3] = x * morphFactor + waveOffset * scrollEffect;
      positionAttribute.array[i3 + 1] = y * morphFactor + Math.sin(time * 0.5 + i * 0.02) * 0.1;
      positionAttribute.array[i3 + 2] = z * morphFactor + waveOffset;
    }
    
    positionAttribute.needsUpdate = true;
    
    // Rotate the entire particle system
    pointsRef.current.rotation.y = time * 0.05 + scrollProgress * Math.PI;
    pointsRef.current.rotation.x = Math.sin(time * 0.1) * 0.2;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={1.0}
        sizeAttenuation
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </points>
  );
}

export const ParticleBackground = ({ scrollProgress }: { scrollProgress: number }) => {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#f8f9fa' }}
      >
        <ambientLight intensity={0.5} />
        <ParticleSphere scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
};

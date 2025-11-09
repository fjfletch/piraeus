"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Piraeus color palette
const COLORS = ['#033f63', '#28666e', '#7c9885', '#b5b682', '#fedc97'];

export default function ParticleSphereCanvas({ scrollY }: { scrollY: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const colorsRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8f9fa');
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particle sphere
    const particleCount = 5000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Sphere distribution
      const radius = 15 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      scales[i] = Math.random() * 0.8 + 0.3;

      // Initial colors
      const colorIndex = Math.floor((i / particleCount) * COLORS.length) % COLORS.length;
      const color = new THREE.Color(COLORS[colorIndex]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    colorsRef.current = colors;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const material = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Animation
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!particlesRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      const elapsedTime = clock.getElapsedTime();
      
      // Scroll-based rotation
      const scrollRotation = scrollY * 0.001;
      particlesRef.current.rotation.y = scrollRotation;
      particlesRef.current.rotation.x = scrollRotation * 0.5;
      particlesRef.current.rotation.z = elapsedTime * 0.05;

      // Update colors based on scroll
      if (colorsRef.current) {
        const colorProgress = (scrollY / 2000) % 1;
        const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          
          const baseColorIndex = Math.floor((i / particleCount + colorProgress) * COLORS.length) % COLORS.length;
          const nextColorIndex = (baseColorIndex + 1) % COLORS.length;
          const localProgress = ((i / particleCount + colorProgress) * COLORS.length) % 1;

          const baseColor = new THREE.Color(COLORS[baseColorIndex]);
          const nextColor = new THREE.Color(COLORS[nextColorIndex]);

          colors[i3] = baseColor.r + (nextColor.r - baseColor.r) * localProgress;
          colors[i3 + 1] = baseColor.g + (nextColor.g - baseColor.g) * localProgress;
          colors[i3 + 2] = baseColor.b + (nextColor.b - baseColor.b) * localProgress;
        }

        particlesRef.current.geometry.attributes.color.needsUpdate = true;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, [scrollY]);

  return <div ref={containerRef} className="fixed inset-0 -z-10" />;
}

"use client";

import { useEffect, useRef } from 'react';

// Piraeus color palette
const COLORS = ['#033f63', '#28666e', '#7c9885', '#b5b682', '#fedc97'];

interface Particle {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colorIndex: number;
}

export default function ParticleBackgroundScrollReactive({ scrollY }: { scrollY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Reinitialize particles on resize if needed
      if (particlesRef.current.length === 0) {
        initParticles();
      }
    };

    const initParticles = () => {
      particlesRef.current = [];
      const numParticles = 5000;
      
      for (let i = 0; i < numParticles; i++) {
        const baseX = Math.random() * canvas.width;
        const baseY = Math.random() * canvas.height;
        
        particlesRef.current.push({
          baseX,
          baseY,
          x: baseX,
          y: baseY,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2.5 + 0.5,
          colorIndex: Math.floor(Math.random() * COLORS.length),
        });
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    const animate = () => {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scroll-based effects
      const scrollProgress = scrollY / 1000; // Normalize scroll
      const waveAmplitude = Math.sin(scrollProgress) * 50;
      const flowDirection = scrollProgress * 0.5;

      particlesRef.current.forEach((particle, index) => {
        // Base movement
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Scroll-reactive wave effect
        const waveOffset = Math.sin((particle.baseX * 0.01) + (scrollProgress * 2)) * waveAmplitude;
        const flowOffset = Math.cos((particle.baseY * 0.01) + (scrollProgress * 2)) * waveAmplitude;
        
        // Apply scroll-based displacement
        const targetX = particle.baseX + waveOffset + flowOffset;
        const targetY = particle.baseY + flowOffset - (scrollY * 0.05); // Vertical scroll displacement
        
        // Smooth interpolation to target
        particle.x += (targetX - particle.x) * 0.05;
        particle.y += (targetY - particle.y) * 0.05;

        // Wrap around edges
        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;

        // Update base position for wrapping
        if (particle.y < -50) {
          particle.baseY = canvas.height + 50;
        }

        // Color transition based on scroll
        const colorProgress = (scrollProgress * 0.5) % 1;
        const baseColorIndex = Math.floor((index / particlesRef.current.length + colorProgress) * COLORS.length) % COLORS.length;
        const nextColorIndex = (baseColorIndex + 1) % COLORS.length;
        const localProgress = ((index / particlesRef.current.length + colorProgress) * COLORS.length) % 1;

        const baseColor = hexToRgb(COLORS[baseColorIndex]);
        const nextColor = hexToRgb(COLORS[nextColorIndex]);

        const r = Math.floor(baseColor.r + (nextColor.r - baseColor.r) * localProgress);
        const g = Math.floor(baseColor.g + (nextColor.g - baseColor.g) * localProgress);
        const b = Math.floor(baseColor.b + (nextColor.b - baseColor.b) * localProgress);

        // Opacity changes with scroll
        const opacity = 0.4 + (Math.sin(scrollProgress + index * 0.001) * 0.3);

        // Draw particle
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scrollY]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: '#f8f9fa' }}
    />
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

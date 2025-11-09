"use client";

import { useEffect, useRef } from 'react';

// Piraeus color palette
const COLORS = ['#033f63', '#28666e', '#7c9885', '#b5b682', '#fedc97'];

interface Particle {
  angle: number;
  radius: number;
  spiralOffset: number;
  size: number;
  colorIndex: number;
  speed: number;
}

export default function ParticleSpiralCanvas({ scrollY }: { scrollY: number }) {
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
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles in spiral formation
    if (particlesRef.current.length === 0) {
      const numParticles = 3000;
      
      for (let i = 0; i < numParticles; i++) {
        const t = i / numParticles;
        
        particlesRef.current.push({
          angle: t * Math.PI * 20, // Multiple spirals
          radius: t * 400, // Expand outward
          spiralOffset: Math.random() * Math.PI * 2,
          size: 3 + Math.random() * 2,
          colorIndex: Math.floor(t * COLORS.length),
          speed: 0.0005 + Math.random() * 0.001,
        });
      }
    }

    // Animation loop
    let startTime = Date.now();
    
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      // Clear canvas with light background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Scroll-based rotation (MUCH SLOWER)
      const scrollRotation = scrollY * 0.0002; // Reduced from 0.001 to 0.0002 (5x slower)
      const time = (Date.now() - startTime) * 0.001;

      particlesRef.current.forEach((particle, index) => {
        // Calculate particle position in spiral
        const totalRotation = particle.angle + scrollRotation + (time * particle.speed);
        
        // Spiral coordinates
        const x = centerX + Math.cos(totalRotation) * particle.radius;
        const y = centerY + Math.sin(totalRotation) * particle.radius;

        // Only draw if within canvas bounds (with margin)
        if (x < -50 || x > canvas.width + 50 || y < -50 || y > canvas.height + 50) {
          return;
        }

        // Color transition based on scroll
        const colorProgress = (scrollY / 3000) % 1;
        const baseColorIndex = Math.floor((particle.colorIndex + colorProgress * COLORS.length)) % COLORS.length;
        const nextColorIndex = (baseColorIndex + 1) % COLORS.length;
        const localProgress = ((particle.colorIndex + colorProgress * COLORS.length)) % 1;

        const baseColor = hexToRgb(COLORS[baseColorIndex]);
        const nextColor = hexToRgb(COLORS[nextColorIndex]);

        const r = Math.floor(baseColor.r + (nextColor.r - baseColor.r) * localProgress);
        const g = Math.floor(baseColor.g + (nextColor.g - baseColor.g) * localProgress);
        const b = Math.floor(baseColor.b + (nextColor.b - baseColor.b) * localProgress);

        // Opacity based on distance from center
        const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const maxDistance = Math.min(canvas.width, canvas.height) * 0.6;
        const opacity = Math.max(0.3, 1 - (distanceFromCenter / maxDistance));

        // Draw square particle (like reference)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.fillRect(x - particle.size / 2, y - particle.size / 2, particle.size, particle.size);
      });
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

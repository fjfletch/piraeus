"use client";

import { useEffect, useRef } from 'react';

// Piraeus color palette
const COLORS = ['#033f63', '#28666e', '#7c9885', '#b5b682', '#fedc97'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colorIndex: number;
}

export default function ParticleBackgroundSimple({ scrollY }: { scrollY: number }) {
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

    // Initialize particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 5000; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2.5 + 0.5,
          colorIndex: Math.floor(Math.random() * COLORS.length),
        });
      }
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate color transition based on scroll
      const colorProgress = Math.min(scrollY / 2000, 1);

      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Color transition
        const baseColorIndex = Math.floor((index / particlesRef.current.length + colorProgress) * COLORS.length) % COLORS.length;
        const nextColorIndex = (baseColorIndex + 1) % COLORS.length;
        const localProgress = ((index / particlesRef.current.length + colorProgress) * COLORS.length) % 1;

        const baseColor = hexToRgb(COLORS[baseColorIndex]);
        const nextColor = hexToRgb(COLORS[nextColorIndex]);

        const r = Math.floor(baseColor.r + (nextColor.r - baseColor.r) * localProgress);
        const g = Math.floor(baseColor.g + (nextColor.g - baseColor.g) * localProgress);
        const b = Math.floor(baseColor.b + (nextColor.b - baseColor.b) * localProgress);

        // Draw particle
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
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

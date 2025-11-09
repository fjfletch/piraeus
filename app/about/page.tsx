"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Target, Zap, Heart, Code, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const ParticleBackground = dynamic(
  () => import('@/components/ParticleBackgroundFibonacci').then(mod => mod.ParticleBackground),
  { ssr: false }
);

export default function About() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / docHeight, 1);
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const values = [
    {
      icon: Zap,
      title: "Innovation First",
      description:
        "We're constantly pushing the boundaries of what's possible with AI integrations, making complex technologies accessible to everyone.",
    },
    {
      icon: Code,
      title: "Developer Focused",
      description:
        "Built by developers, for developers. We understand your workflow and design tools that fit seamlessly into your process.",
    },
    {
      icon: Heart,
      title: "Open & Transparent",
      description:
        "We believe in open standards, community-driven development, and transparent communication with our users.",
    },
    {
      icon: Rocket,
      title: "Ship Fast",
      description:
        "Move quickly, iterate often, and deliver value. We're committed to shipping features that matter, when they matter.",
    },
  ];

  const team = [
    {
      name: "Engineering Team",
      role: "Building the Future",
      description: "Our team of engineers is dedicated to creating robust, scalable solutions that power the next generation of AI applications.",
    },
    {
      name: "Product Team",
      role: "User Experience",
      description: "Focused on making complex integrations simple and intuitive, ensuring every user can build powerful AI tools.",
    },
    {
      name: "Community",
      role: "Open Source",
      description: "A vibrant community of developers, contributors, and users who shape the direction of Piraeus through feedback and collaboration.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <ParticleBackground scrollProgress={scrollProgress} />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-5xl text-center"
        >
          <div className="backdrop-blur-lg bg-white/15 border border-white/25 rounded-3xl p-12 shadow-2xl">
            <div className="flex items-center gap-8">
              <img 
                src="https://customer-assets.emergentagent.com/job_no-code-llm/artifacts/xbsi69r0_Screenshot_2025-11-08_at_10.53.35_PM-removebg-preview.png" 
                alt="Piraeus Logo" 
                className="w-24 h-auto flex-shrink-0"
              />
              <div className="flex-1">
                <h1 className="text-6xl md:text-7xl font-bold mb-6" style={{ color: '#033F63' }}>
                  About Piraeus
                </h1>
                <p className="text-xl md:text-2xl" style={{ color: '#28666E' }}>
                  Piraeus is the historic port city of Athens, known since ancient Greece as a major hub of trade, connection, and exchange where countless routes, goods, and ideas converged. Here, we embody the same spirit of connectivity: a dynamic port where APIs, LLMs, and users meet, exchange data, and build powerful integrations across a vast digital network.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-5xl"
        >
          <div className="backdrop-blur-lg bg-white/15 border border-white/25 rounded-3xl p-12 shadow-2xl">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto backdrop-blur-sm" style={{ backgroundColor: 'rgba(254, 220, 151, 0.5)', border: '2px solid rgba(254, 220, 151, 0.3)' }}>
              <Target className="w-10 h-10" style={{ color: '#033F63' }} />
            </div>
            <h2 className="text-5xl font-bold mb-4 text-center">
              <span style={{ color: '#033F63' }}>Our </span>
              <span style={{ color: '#7C9885' }}>Mission</span>
            </h2>
            <p className="text-lg mb-8 text-center" style={{ color: '#28666E' }}>
              Empowering developers and businesses to build the future of AI
            </p>
            <p className="text-lg leading-relaxed text-center max-w-3xl mx-auto" style={{ color: '#033F63' }}>
              At Piraeus, we believe that AI integration shouldn't be a barrier. Whether you're a startup building your first AI feature or an enterprise scaling AI across your organization, we provide the tools and platform to make it happen. Our visual builder removes the complexity, while our robust API and marketplace ecosystem ensures you have everything you need to succeed.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Values Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-6xl"
        >
          <div className="text-center mb-16 backdrop-blur-lg bg-white/15 border border-white/25 rounded-3xl p-8 shadow-xl">
            <h2 className="text-5xl font-bold mb-4" style={{ color: '#033F63' }}>
              Our Values
            </h2>
            <p className="text-xl" style={{ color: '#28666E' }}>
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full backdrop-blur-xl bg-white/20 border-2 border-white/30 hover:shadow-2xl hover:bg-white/30 transition-all duration-300" style={{ borderColor: 'rgba(181, 182, 130, 0.3)' }}>
                    <CardHeader>
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto backdrop-blur-sm"
                        style={{ backgroundColor: 'rgba(254, 220, 151, 0.5)', border: '2px solid rgba(254, 220, 151, 0.3)' }}
                      >
                        <Icon className="w-8 h-8" style={{ color: '#033F63' }} />
                      </div>
                      <CardTitle className="text-center text-xl" style={{ color: '#033F63' }}>
                        {value.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center" style={{ color: '#28666E' }}>
                        {value.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Team Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-6xl"
        >
          <div className="text-center mb-16 backdrop-blur-lg bg-white/15 border border-white/25 rounded-3xl p-8 shadow-xl">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto backdrop-blur-sm" style={{ backgroundColor: 'rgba(254, 220, 151, 0.5)', border: '2px solid rgba(254, 220, 151, 0.3)' }}>
              <Users className="w-10 h-10" style={{ color: '#033F63' }} />
            </div>
            <h2 className="text-5xl font-bold mb-4" style={{ color: '#033F63' }}>
              Built by a Global Team
            </h2>
            <p className="text-xl" style={{ color: '#28666E' }}>
              Passionate people working together to build the future
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="h-full backdrop-blur-xl bg-white/20 border-2 border-white/30 hover:shadow-2xl hover:bg-white/30 transition-all duration-300" style={{ borderColor: 'rgba(181, 182, 130, 0.3)' }}>
                  <CardHeader>
                    <CardTitle className="text-xl" style={{ color: '#033F63' }}>
                      {member.name}
                    </CardTitle>
                    <CardDescription className="text-base" style={{ color: '#7C9885' }}>
                      {member.role}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed" style={{ color: '#28666E' }}>
                      {member.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

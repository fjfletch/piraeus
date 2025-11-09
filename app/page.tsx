"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Zap, Code, TestTube, Share2, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const ParticleBackground = dynamic(
  () => import('@/components/ParticleBackgroundFibonacci').then(mod => mod.ParticleBackground),
  { ssr: false }
);

export default function Home() {
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

  const features = [
    {
      icon: Zap,
      title: "Visual Builder",
      description:
        "Build MCP integrations with our intuitive drag-and-drop interface. No coding required.",
    },
    {
      icon: Code,
      title: "Any API",
      description:
        "Connect any REST API to your LLM. Stripe, GitHub, Weather, and more.",
    },
    {
      icon: TestTube,
      title: "Test & Debug",
      description:
        "Test your integrations in real-time with our built-in testing tools.",
    },
    {
      icon: Share2,
      title: "Share & Deploy",
      description:
        "Share your MCPs with the community or deploy them via our API.",
    },
  ];

  const techStack = [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "FastAPI",
    "MongoDB"
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
            <h1 className="text-6xl md:text-7xl font-bold mb-6" style={{ color: '#033F63' }}>
              Provide your agents with the tools they need
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto" style={{ color: '#28666E' }}>
              Build powerful AI integrations visually. No code required. Piraeus makes it easy to expose APIs as tools that LLMs can use.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/builder/new">
                <Button size="lg" className="text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-shadow" style={{ backgroundColor: '#033F63' }}>
                  Create Now
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-shadow border-2 backdrop-blur-sm"
                  style={{ 
                    borderColor: '#28666E',
                    color: '#033F63',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)'
                  }}
                >
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
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
              Powerful Features
            </h2>
            <p className="text-xl" style={{ color: '#28666E' }}>
              Everything you need to build AI integrations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
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
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center" style={{ color: '#28666E' }}>
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Tech Stack Section */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-5xl"
        >
          <Card className="backdrop-blur-xl bg-white/20 border-2 border-white/30 shadow-2xl" style={{ borderColor: 'rgba(124, 152, 133, 0.2)' }}>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-5xl mb-4">
                <span style={{ color: '#033F63' }}>Build with </span>
                <span style={{ color: '#7C9885' }}>Featured Integrations</span>
              </CardTitle>
              <CardDescription className="text-lg" style={{ color: '#28666E' }}>
                Connect your agents to powerful services and APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Example MCP Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockMCPs.slice(0, 3).map((mcp) => (
                  <Card key={mcp.id} className="flex flex-col bg-white/90 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-2xl transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{mcp.emoji}</span>
                        <span className="text-lg">{mcp.name}</span>
                      </CardTitle>
                      <CardDescription>{mcp.description}</CardDescription>
                      <div className="text-sm text-muted-foreground mt-2">by @{mcp.author}</div>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{mcp.stars}</span>
                          <span className="text-sm text-muted-foreground">({mcp.reviews})</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {((mcp.uses || 0) / 1000).toFixed(1)}k uses
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="min-h-[60vh] flex items-center justify-center px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center"
        >
          <div className="backdrop-blur-xl bg-white/15 border-2 border-white/30 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: '#033F63' }}>
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-10" style={{ color: '#28666E' }}>
              Join developers building the future of AI integrations
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-shadow" style={{ backgroundColor: '#033F63' }}>
                  Create Free Account
                </Button>
              </Link>
              <Link href="/docs">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-shadow border-2 backdrop-blur-sm"
                  style={{ 
                    borderColor: '#28666E',
                    color: '#033F63',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)'
                  }}
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

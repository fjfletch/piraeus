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
import ParticleBackgroundScrollReactive from '@/components/ParticleBackgroundScrollReactive';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
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
      <ParticleBackgroundSimple scrollY={scrollY} />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-5xl text-center"
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-6" style={{ color: '#033F63' }}>
            Provide your agents with the tools they need
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto" style={{ color: '#28666E' }}>
            Build powerful AI integrations visually. No code required. Piraeus makes it easy to expose APIs as tools that LLMs can use.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/builder/new">
              <Button size="lg" className="text-lg px-10 py-6 shadow-xl" style={{ backgroundColor: '#033F63' }}>
                Explore Now
              </Button>
            </Link>
            <Link href="/docs">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-10 py-6 shadow-xl border-2"
                style={{ 
                  borderColor: '#28666E',
                  color: '#033F63',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                Learn More
              </Button>
            </Link>
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
          <Card className="backdrop-blur-md bg-white/70 border-2 shadow-2xl" style={{ borderColor: '#7C9885' }}>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-5xl mb-4">
                <span style={{ color: '#033F63' }}>Built With </span>
                <span style={{ color: '#7C9885' }}>Modern Tech</span>
              </CardTitle>
              <CardDescription className="text-lg" style={{ color: '#28666E' }}>
                Leveraging the latest web technologies for exceptional performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 justify-center mb-12">
                {techStack.map((tech, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-base px-6 py-2"
                    style={{ 
                      backgroundColor: '#B5B682',
                      color: '#033F63'
                    }}
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2" style={{ color: '#033F63' }}>5000+</div>
                  <div className="text-lg" style={{ color: '#28666E' }}>Particles Rendered</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2" style={{ color: '#033F63' }}>60fps</div>
                  <div className="text-lg" style={{ color: '#28666E' }}>Smooth Performance</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2" style={{ color: '#033F63' }}>100%</div>
                  <div className="text-lg" style={{ color: '#28666E' }}>Canvas Powered</div>
                </div>
              </div>
            </CardContent>
          </Card>
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
          <div className="text-center mb-16">
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
                  <Card className="h-full backdrop-blur-md bg-white/80 border-2 hover:shadow-2xl transition-shadow duration-300" style={{ borderColor: '#B5B682' }}>
                    <CardHeader>
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto"
                        style={{ backgroundColor: '#FEDC97' }}
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

      {/* CTA Section */}
      <section className="min-h-[60vh] flex items-center justify-center px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: '#033F63' }}>
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-10" style={{ color: '#28666E' }}>
            Join developers building the future of AI integrations
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-10 py-6 shadow-xl" style={{ backgroundColor: '#033F63' }}>
                Create Free Account
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-10 py-6 shadow-xl border-2"
                style={{ 
                  borderColor: '#28666E',
                  color: '#033F63',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

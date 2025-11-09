"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Code, TestTube, Share2, Star, Palette } from "lucide-react";
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
import { mockMCPs } from "@/lib/mock-data";
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), {
  ssr: false,
});

export default function Home() {
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

  const featuredMCPs = mockMCPs.slice(0, 3);
  
  // Random boat positions - right third of the wave section
  const [boat1Pos, setBoat1Pos] = useState({ right: 25, bottom: 9 });
  const [boat2Pos, setBoat2Pos] = useState({ right: 14, bottom: 4 });
  const [boat3Pos, setBoat3Pos] = useState({ right: 7, bottom: 1 });

  useEffect(() => {
    // Randomize positions on mount (right third: 0-33% from right, bottom: 0-12%)
    setBoat1Pos({
      right: Math.floor(Math.random() * 20) + 15, // 15-35% from right
      bottom: Math.floor(Math.random() * 8) + 4   // 4-12% from bottom
    });
    setBoat2Pos({
      right: Math.floor(Math.random() * 20) + 8,  // 8-28% from right
      bottom: Math.floor(Math.random() * 6) + 2   // 2-8% from bottom
    });
    setBoat3Pos({
      right: Math.floor(Math.random() * 15) + 3,  // 3-18% from right
      bottom: Math.floor(Math.random() * 5)       // 0-5% from bottom
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden" style={{ backgroundColor: '#529BC9' }}>
        {/* Ocean waves animation */}
        <div className="absolute inset-0">
          <svg className="absolute bottom-0 w-full h-64" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#28666E" fillOpacity="0.7" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,133.3C672,139,768,181,864,181.3C960,181,1056,139,1152,128C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
              <animate attributeName="d" dur="10s" repeatCount="indefinite"
                values="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,133.3C672,139,768,181,864,181.3C960,181,1056,139,1152,128C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                        M0,160L48,149.3C96,139,192,117,288,128C384,139,480,181,576,181.3C672,181,768,139,864,133.3C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                        M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,133.3C672,139,768,181,864,181.3C960,181,1056,139,1152,128C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
            </path>
          </svg>
          
          {/* Second wave layer */}
          <svg className="absolute bottom-0 w-full h-64" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#28666E" fillOpacity="0.5" d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,128C672,128,768,160,864,165.3C960,171,1056,149,1152,133.3C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
              <animate attributeName="d" dur="8s" repeatCount="indefinite"
                values="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,128C672,128,768,160,864,165.3C960,171,1056,149,1152,133.3C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                        M0,192L48,181.3C96,171,192,149,288,154.7C384,160,480,192,576,192C672,192,768,160,864,154.7C960,149,1056,171,1152,186.7C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                        M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,128C672,128,768,160,864,165.3C960,171,1056,149,1152,133.3C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
            </path>
          </svg>
        </div>

        {/* Large lead boat - bottom left with two masts */}
        <div id="leadBoat" className="absolute left-[5%] md:left-[8%]" style={{ 
          bottom: 'calc(6% + 0px)',
          animation: 'waveMotion 10s ease-in-out infinite'
        }}>
          <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="md:w-32 md:h-32">
            {/* Large boat hull - single layer */}
            <path d="M15,70 L85,70 L80,85 L20,85 Z" fill="#654321" stroke="#4a3218" strokeWidth="2.5"/>
            {/* Deck - single layer */}
            <rect x="20" y="58" width="60" height="12" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
            
            {/* First Mast (left) */}
            <line x1="35" y1="58" x2="35" y2="15" stroke="#654321" strokeWidth="4"/>
            {/* First sail */}
            <path d="M35,20 L58,35 L35,50 Z" fill="#FEDC97" stroke="#B5B682" strokeWidth="2" opacity="0.9"/>
            
            {/* Second Mast (right) */}
            <line x1="65" y1="58" x2="65" y2="20" stroke="#654321" strokeWidth="4"/>
            {/* Second sail */}
            <path d="M65,25 L85,38 L65,51 Z" fill="#FEDC97" stroke="#B5B682" strokeWidth="2" opacity="0.9"/>
            
            {/* Flag on first mast */}
            <path d="M35,15 L47,19 L35,23 Z" fill="#033f63"/>
          </svg>
        </div>

        {/* Small boat 1 - randomly placed in bottom right */}
        <div id="boat1" className="absolute" style={{ 
          right: `${boat1Pos.right}%`,
          bottom: `${boat1Pos.bottom}%`,
          animation: 'waveMotion1 8.5s ease-in-out infinite'
        }}>
          <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="md:w-16 md:h-16">
            <path d="M20,70 L80,70 L75,85 L25,85 Z" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
            <rect x="30" y="60" width="40" height="10" fill="#A0522D" stroke="#654321" strokeWidth="1.5"/>
            <line x1="50" y1="60" x2="50" y2="25" stroke="#654321" strokeWidth="3"/>
            <path d="M50,30 L68,42 L50,54 Z" fill="#FEDC97" stroke="#B5B682" strokeWidth="1.5" opacity="0.9"/>
            <path d="M50,25 L58,28 L50,31 Z" fill="#033f63"/>
          </svg>
        </div>

        {/* Small boat 2 - randomly placed */}
        <div id="boat2" className="absolute" style={{ 
          right: `${boat2Pos.right}%`,
          bottom: `${boat2Pos.bottom}%`,
          animation: 'waveMotion2 11s ease-in-out infinite'
        }}>
          <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="md:w-16 md:h-16">
            <path d="M20,70 L80,70 L75,85 L25,85 Z" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
            <rect x="30" y="60" width="40" height="10" fill="#A0522D" stroke="#654321" strokeWidth="1.5"/>
            <line x1="50" y1="60" x2="50" y2="25" stroke="#654321" strokeWidth="3"/>
            <path d="M50,30 L68,42 L50,54 Z" fill="#FEDC97" stroke="#B5B682" strokeWidth="1.5" opacity="0.9"/>
            <path d="M50,25 L58,28 L50,31 Z" fill="#033f63"/>
          </svg>
        </div>

        {/* Small boat 3 - randomly placed */}
        <div id="boat3" className="absolute" style={{ 
          right: `${boat3Pos.right}%`,
          bottom: `${boat3Pos.bottom}%`,
          animation: 'waveMotion3 9.5s ease-in-out infinite'
        }}>
          <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="md:w-16 md:h-16">
            <path d="M20,70 L80,70 L75,85 L25,85 Z" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
            <rect x="30" y="60" width="40" height="10" fill="#A0522D" stroke="#654321" strokeWidth="1.5"/>
            <line x1="50" y1="60" x2="50" y2="25" stroke="#654321" strokeWidth="3"/>
            <path d="M50,30 L68,42 L50,54 Z" fill="#FEDC97" stroke="#B5B682" strokeWidth="1.5" opacity="0.9"/>
            <path d="M50,25 L58,28 L50,31 Z" fill="#033f63"/>
          </svg>
        </div>

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg" style={{ color: '#033F63' }}>
            Provide your agents with the tools they need
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto drop-shadow" style={{ color: '#033F63' }}>
            Build powerful AI integrations visually. No code required. Piraeus 
            makes it easy to expose APIs as tools that LLMs can use.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/builder/new">
              <Button size="lg" className="text-base px-8 shadow-lg">
                Create New MCP
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="text-base px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 shadow-lg backdrop-blur-sm">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>

        <style jsx>{`
          @keyframes waveMotion {
            0%, 100% {
              transform: translateY(0px) rotate(-3deg);
            }
            25% {
              transform: translateY(-20px) rotate(2deg);
            }
            50% {
              transform: translateY(-35px) rotate(-1deg);
            }
            75% {
              transform: translateY(-20px) rotate(2deg);
            }
          }
          
          @keyframes waveMotion1 {
            0%, 100% {
              transform: translateY(0px) rotate(-2deg);
            }
            30% {
              transform: translateY(-25px) rotate(3deg);
            }
            60% {
              transform: translateY(-30px) rotate(-2deg);
            }
            80% {
              transform: translateY(-15px) rotate(1deg);
            }
          }
          
          @keyframes waveMotion2 {
            0%, 100% {
              transform: translateY(0px) rotate(2deg);
            }
            20% {
              transform: translateY(-18px) rotate(-3deg);
            }
            55% {
              transform: translateY(-40px) rotate(1deg);
            }
            85% {
              transform: translateY(-22px) rotate(-1deg);
            }
          }
          
          @keyframes waveMotion3 {
            0%, 100% {
              transform: translateY(0px) rotate(-1deg);
            }
            35% {
              transform: translateY(-28px) rotate(2deg);
            }
            65% {
              transform: translateY(-38px) rotate(-3deg);
            }
            90% {
              transform: translateY(-20px) rotate(1deg);
            }
          }
          
          @media (max-width: 768px) {
            @keyframes waveMotion, @keyframes waveMotion1, @keyframes waveMotion2, @keyframes waveMotion3 {
              0%, 100% {
                transform: translateY(0px) rotate(-2deg);
              }
              50% {
                transform: translateY(-20px) rotate(2deg);
              }
            }
          }
        `}</style>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Build AI Integrations
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Integrations */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured Integrations
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredMCPs.map((mcp) => (
              <Card key={mcp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{mcp.emoji}</span>
                    {mcp.name}
                  </CardTitle>
                  <CardDescription>{mcp.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{mcp.stars}</span>
                      <span>({mcp.reviews} reviews)</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(mcp.uses || 0).toLocaleString()} uses
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/marketplace">
              <Button variant="outline">View All Integrations</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t mt-16">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>&copy; 2024 Piraeus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
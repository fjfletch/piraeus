"use client";

import Link from "next/link";
import { Zap, Code, TestTube, Share2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { mockMCPs } from "@/lib/mock-data";

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

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Connect Any API to Any LLM
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Build powerful AI integrations visually. No code required. The Model Context Protocol Platform 
            makes it easy to expose APIs as tools that LLMs can use.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/builder/new">
              <Button size="lg" className="text-base px-8">
                Create New MCP
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="text-base px-8">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
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
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMCPs.map((mcp, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{mcp.emoji}</span>
                    {mcp.name}
                  </CardTitle>
                  <CardDescription>{mcp.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{mcp.stars}</span>
                      <span className="ml-1">({mcp.reviews} reviews)</span>
                    </div>
                    <span>{formatNumber(mcp.uses)} uses</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 mt-auto">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 MCP Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
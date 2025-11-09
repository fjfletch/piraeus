"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Target, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
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

  const faqs = [
    {
      question: "What is Piraeus?",
      answer: "Piraeus is a visual, no-code platform for building AI integrations. It allows developers and businesses to connect APIs to LLMs without writing complex integration code, making AI implementation faster and more accessible."
    },
    {
      question: "Who can use Piraeus?",
      answer: "Piraeus is designed for developers, product teams, and businesses of all sizes. Whether you're a startup building your first AI feature or an enterprise scaling AI across your organization, Piraeus provides the tools you need."
    },
    {
      question: "How does the visual builder work?",
      answer: "The visual builder uses a drag-and-drop interface powered by React Flow. You can connect API nodes to LLM nodes, configure properties, and test integrations in real-time without writing code. The builder generates the integration logic automatically."
    },
    {
      question: "What integrations are supported?",
      answer: "Piraeus supports a wide range of integrations including various LLM providers (OpenAI, Anthropic, Google), custom APIs, webhooks, and popular third-party services. You can also create custom MCPs (Model Context Protocols) to extend functionality."
    },
    {
      question: "Can I share my integrations with others?",
      answer: "Yes! The Piraeus Marketplace allows you to share your MCPs (Model Context Protocols) with the community. You can browse, download, and customize integrations created by other users."
    },
    {
      question: "Is there API access available?",
      answer: "Yes, Piraeus provides a comprehensive Developer API Portal where you can manage API keys, monitor usage statistics, and access documentation for programmatic access to your integrations."
    },
    {
      question: "How do I get started?",
      answer: "Simply sign up for an account, explore the marketplace for pre-built integrations, or start building your own using the visual builder. Our documentation provides step-by-step guides to help you get started quickly."
    },
    {
      question: "What is the pricing model?",
      answer: "Piraeus offers flexible pricing plans to suit different needs. We provide a free tier for getting started, with paid plans that scale based on usage, number of integrations, and advanced features. Contact us for enterprise pricing."
    }
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
              At Piraeus, we believe building MCPs shouldn't be hard. Our mission is to make it effortless for you and your agents to discover, connect, and deploy the tools you need. We're creating a digital bazaar — a vibrant hub where developers and agents in a post-agent world can easily trade, share, and build the capabilities that power the next generation of intelligent systems.
            </p>
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl"
        >
          <div className="backdrop-blur-lg bg-white/15 border border-white/25 rounded-3xl p-12 shadow-2xl">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto backdrop-blur-sm" style={{ backgroundColor: 'rgba(254, 220, 151, 0.5)', border: '2px solid rgba(254, 220, 151, 0.3)' }}>
              <HelpCircle className="w-10 h-10" style={{ color: '#033F63' }} />
            </div>
            <h2 className="text-5xl font-bold mb-8 text-center" style={{ color: '#033F63' }}>
              FAQ
            </h2>
            <Accordion type="multiple" className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="backdrop-blur-xl bg-white/20 border-2 border-white/30 mb-3"
                  style={{ borderColor: 'rgba(181, 182, 130, 0.3)' }}
                >
                  <AccordionTrigger
                    value={`item-${index}`}
                    className="text-lg font-semibold"
                    style={{ color: '#033F63' }}
                  >
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent
                    value={`item-${index}`}
                    className="text-base leading-relaxed"
                    style={{ color: '#28666E' }}
                  >
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

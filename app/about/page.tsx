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
  const [typedTextWithout, setTypedTextWithout] = useState("");
  const [typedTextWith, setTypedTextWith] = useState("");
  const [startTyping, setStartTyping] = useState(false);

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

  const textWithoutMCP = "I'm sorry for the confusion, but as an AI, I currently don't have the ability to provide real-time flight information or book flights. It's recommended to check major travel and airline websites like Expedia, Kayak, or directly from airline websites for detailed and accurate flight information and booking.";
  
  const textWithMCP = `Here are some flight options from Chicago (ORD) to Los Angeles (LAX) on November 10, 2025:

1. Frontier Flight F9 1596 and F9 4315: Price $171
   Departure: 05:05 from Chicago ORD, Arrival: 12:25 in Los Angeles LAX
   Duration: 9h 20m Including layover in Atlanta ATL (2h 19m)

2. Frontier Flight F9 2445: Price $274
   Departure: 06:30 from Chicago ORD, Arrival: 08:56 in Los Angeles LAX
   Duration: 4h 26m, Direct flight

3. United Flight UA 2396: Price $437
   Departure: 13:00 from Chicago ORD, Arrival: 15:30 in Los Angeles LAX
   Duration: 4h 30m, Direct flight

4. American Airlines AA 369: Price $437
   Departure: 13:49 from Chicago ORD, Arrival: 16:21 in Los Angeles LAX
   Duration: 4h 32m, Direct flight

For more options and to book flights, you may view here: https://www.google.com/travel/flights

Please note, these prices are higher than average for this route.`;

  useEffect(() => {
    if (!startTyping) return;

    let indexWithout = 0;
    let indexWith = 0;

    const intervalWithout = setInterval(() => {
      if (indexWithout < textWithoutMCP.length) {
        setTypedTextWithout(textWithoutMCP.slice(0, indexWithout + 1));
        indexWithout++;
      } else {
        clearInterval(intervalWithout);
      }
    }, 20);

    const intervalWith = setInterval(() => {
      if (indexWith < textWithMCP.length) {
        setTypedTextWith(textWithMCP.slice(0, indexWith + 1));
        indexWith++;
      } else {
        clearInterval(intervalWith);
      }
    }, 15);

    return () => {
      clearInterval(intervalWithout);
      clearInterval(intervalWith);
    };
  }, [startTyping, textWithoutMCP, textWithMCP]);

  const faqs = [
    {
      question: "What is Piraeus?",
      answer: "Piraeus is a visual, no-code platform for building AI integrations. It allows developers and businesses to connect APIs to LLMs without writing complex integration code, making AI implementation faster and more accessible."
    },
    {
      question: "Who should use Piraeus?",
      answer: "Anyone who wants to create and utilize their agents in a easier and better way. Builders, consumers, and non-technical users alike would be able to use our platform."
    },
    {
      question: "Why does this matter?",
      answer: "We believe that most current MCP creation tools are inconsistent and overly complicated. Piraeus aims to change that by making MCPs accessible to a broader community of developers and users. During our research, we also found no dedicated marketplace for MCPs — a gap we're determined to fill by building a platform that benefits everyone in the ecosystem."
    },
    {
      question: "What does the technical stack look like?",
      answer: "Our tech stack includes a PostgreSQL database and a Python FastAPI backend hosted on AWS. The frontend is built with Vite and React, hosted on Emergent. We also integrate multiple APIs — including OpenAI and Anthropic endpoints — to enable seamless interaction with LLMs."
    },
    {
      question: "What's planned for the future?",
      answer: "We eventually want to have users able to upload their own MCPs they create in order to facilitate the marketplace emphasis of our idea, which unfortunately we could not complete within the time frame. We also have ideas of how we could scale up for both large community and enterprise capabilities."
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

      {/* The Impact of MCPs Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onViewportEnter={() => setStartTyping(true)}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-7xl"
        >
          <div className="backdrop-blur-lg bg-white/15 border border-white/25 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-5xl font-bold mb-4 text-center" style={{ color: '#033F63' }}>
              The Impact of MCPs
            </h2>
            <p className="text-lg mb-12 text-center max-w-4xl mx-auto" style={{ color: '#28666E' }}>
              Here's what happens when you ask ChatGPT to show you flights from Chicago to Los Angeles on November 10th, 2025 — with and without an MCP
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Without MCP Column */}
              <div>
                <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#033F63' }}>
                  Response without MCP
                </h3>
                <div 
                  className="backdrop-blur-sm bg-black/80 rounded-xl p-6 border border-white/10 font-mono text-sm text-green-400 h-[400px] overflow-auto"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {typedTextWithout}
                  <span className="animate-pulse">|</span>
                </div>
              </div>

              {/* With MCP Column */}
              <div>
                <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#033F63' }}>
                  Response with MCP
                </h3>
                <div 
                  className="backdrop-blur-sm bg-black/80 rounded-xl p-6 border border-white/10 font-mono text-sm text-green-400 h-[400px] overflow-auto"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {typedTextWith}
                  <span className="animate-pulse">|</span>
                </div>
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

"use client";

import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Book, Code, Zap, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 sticky top-24 h-fit">
            <nav className="space-y-1">
              <div className="font-semibold text-sm text-muted-foreground mb-2">Getting Started</div>
              <a href="#intro" className="block px-3 py-2 rounded hover:bg-accent text-sm">
                Introduction
              </a>
              <a href="#quickstart" className="block px-3 py-2 rounded hover:bg-accent text-sm">
                Quick Start
              </a>
              <a href="#concepts" className="block px-3 py-2 rounded hover:bg-accent text-sm">
                Core Concepts
              </a>
              
              <div className="font-semibold text-sm text-muted-foreground mt-6 mb-2">Building MCPs</div>
              <a href="#apis" className="block px-3 py-2 rounded hover:bg-accent text-sm">
                Configuring APIs
              </a>
              <a href="#tools" className="block px-3 py-2 rounded hover:bg-accent text-sm">
                Creating Tools
              </a>
              <a href="#prompts" className="block px-3 py-2 rounded hover:bg-accent text-sm">
                Writing Prompts
              </a>
              <a href="#testing" className="block px-3 py-2 rounded hover:bg-accent text-sm">
                Testing & Debugging
              </a>
              
              <div className="font-semibold text-sm text-muted-foreground mt-6 mb-2">Advanced</div>
              <a href="#flows" className="block px-3 py-2 rounded hover:bg-accent text-sm">
                Visual Flows
              </a>
              <a href="#resources" className="block px-3 py-2 rounded hover:bg-accent text-sm">
                Resources
              </a>
              <a href="#deployment" className="block px-3 py-2 rounded hover:bg-accent text-sm">
                Deployment
              </a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-4xl space-y-12">
            <div>
              <h1 className="text-4xl font-bold mb-2">Documentation</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Learn how to build, test, and deploy MCP integrations
              </p>
            </div>

            {/* Introduction */}
            <section id="intro">
              <h2 className="text-3xl font-bold mb-4">Introduction</h2>
              <p className="text-muted-foreground mb-6">
                Piraeus allows you to connect any REST API to any LLM 
                (GPT-4, Claude, etc.) through a visual, no-code interface. Build powerful AI integrations 
                that let LLMs execute functions, retrieve data, and interact with external services.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <Book className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>What is MCP?</CardTitle>
                    <CardDescription>
                      A protocol for exposing APIs as tools that LLMs can use to perform actions and retrieve information
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <Code className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>No Code Required</CardTitle>
                    <CardDescription>
                      Build integrations visually with our drag-and-drop interface. Perfect for developers and non-developers alike
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </section>

            {/* Quick Start */}
            <section id="quickstart">
              <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
              <p className="text-muted-foreground mb-6">
                Get started with your first MCP integration in minutes
              </p>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">1</span>
                      Create a New MCP
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">
                      Click "Create New MCP" from the dashboard. Give it a name and description.
                    </p>
                    <Link href="/builder/new">
                      <Button>Create New MCP</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">2</span>
                      Add an API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Configure the API you want to connect. Add the base URL, authentication, and define routes.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">3</span>
                      Create Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Define the functions (tools) that the LLM can call. Map them to your API endpoints.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">4</span>
                      Test & Deploy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Test your integration with real queries, then publish it to make it available.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Core Concepts */}
            <section id="concepts">
              <h2 className="text-3xl font-bold mb-4">Core Concepts</h2>
              <Tabs defaultValue="tools">
                <TabsList>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                  <TabsTrigger value="prompts">Prompts</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>
                <TabsContent value="tools">
                  <Card>
                    <CardHeader>
                      <Zap className="h-8 w-8 mb-2 text-primary" />
                      <CardTitle>Tools</CardTitle>
                      <CardDescription>Functions that the LLM can execute</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Tools are callable functions that allow the LLM to perform actions. Each tool maps to 
                        an API endpoint and defines what inputs it accepts.
                      </p>
                      <div className="bg-muted p-4 rounded font-mono text-xs">
                        {`{
  "name": "get_weather",
  "description": "Get current weather for a city",
  "parameters": {
    "city": "string",
    "units": "metric|imperial"
  }
}`}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="prompts">
                  <Card>
                    <CardHeader>
                      <Settings className="h-8 w-8 mb-2 text-primary" />
                      <CardTitle>Prompts</CardTitle>
                      <CardDescription>Instructions and context for the LLM</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Prompts guide the LLM's behavior. System prompts define the LLM's role, while 
                        contextual prompts provide additional information for specific scenarios.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="resources">
                  <Card>
                    <CardHeader>
                      <Book className="h-8 w-8 mb-2 text-primary" />
                      <CardTitle>Resources</CardTitle>
                      <CardDescription>Data sources the LLM can read</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Resources provide read-only access to data. They can be files, databases, or 
                        API endpoints that the LLM can query for information.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </section>

            {/* Configuring APIs */}
            <section id="apis">
              <h2 className="text-3xl font-bold mb-4">Configuring APIs</h2>
              <p className="text-muted-foreground mb-4">
                Learn how to connect and configure external APIs
              </p>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">When configuring an API, you can specify:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>API Key (header or query parameter)</li>
                    <li>Bearer Token</li>
                    <li>OAuth 2.0</li>
                    <li>Basic Authentication</li>
                    <li>Custom authentication</li>
                  </ul>
                  <p className="mt-4 text-muted-foreground">
                    You can also import API configurations from OpenAPI/Swagger specifications for faster setup.
                  </p>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
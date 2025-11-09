"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Star, Users, Play } from "lucide-react";
import { MCPIntegration } from "@/types/mcp";
import { mockMCPs } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

interface MCPDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcpId: string | null;
  onUseMCP?: (mcpId: string, mcpName: string) => void;
}

export function MCPDetailModal({ open, onOpenChange, mcpId, onUseMCP }: MCPDetailModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mcpDetails, setMcpDetails] = useState<MCPIntegration | null>(null);

  useEffect(() => {
    if (open && mcpId) {
      fetchMCPDetails(mcpId);
    }
  }, [open, mcpId]);

  const fetchMCPDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    
    // Simulate API call with mock data
    setTimeout(() => {
      const mcp = mockMCPs.find(m => m.id === id);
      if (mcp) {
        setMcpDetails(mcp);
        setLoading(false);
      } else {
        setError("MCP not found");
        setLoading(false);
      }
    }, 500);
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET": return "bg-blue-100 text-blue-800";
      case "POST": return "bg-green-100 text-green-800";
      case "PUT": return "bg-orange-100 text-orange-800";
      case "DELETE": return "bg-red-100 text-red-800";
      case "PATCH": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const generateExamples = () => {
    if (!mcpDetails || mcpDetails.tools.length === 0) {
      return {
        input: "Example query for this MCP",
        output: "Example response",
        steps: ["Query received", "Processing", "Response generated"]
      };
    }

    const firstTool = mcpDetails.tools[0];
    const api = mcpDetails.apis.find(a => a.id === firstTool.apiId);
    
    // Generate example based on tool
    let exampleInput = "";
    let exampleOutput = "";
    const steps = [];

    if (firstTool.name.includes("weather")) {
      exampleInput = "What's the weather in San Francisco?";
      exampleOutput = JSON.stringify({
        response: "The current weather in San Francisco is 65°F and sunny with light winds.",
        tool_calls: [{
          tool: firstTool.name,
          input: { city: "San Francisco" },
          output: { temperature: 65, condition: "Sunny", wind: "5 mph" }
        }]
      }, null, 2);
      steps = [
        `User sends query: "${exampleInput}"`,
        `LLM analyzes request using ${mcpDetails.configuration.model}`,
        `LLM calls tool: "${firstTool.displayName}"`,
        `Tool makes API call: ${firstTool.method} ${api?.baseUrl}${firstTool.endpoint}`,
        `API returns weather data`,
        `LLM formats response for user`
      ];
    } else if (firstTool.name.includes("tournament") || firstTool.name.includes("event")) {
      exampleInput = "Create a tournament called 'Winter Championship' on December 15, 2025";
      exampleOutput = JSON.stringify({
        response: "I've created the tournament 'Winter Championship' scheduled for December 15, 2025.",
        tool_calls: [{
          tool: firstTool.name,
          input: { name: "Winter Championship", date: "2025-12-15" },
          output: { id: 123, name: "Winter Championship", status: "created" }
        }]
      }, null, 2);
      steps = [
        `User sends query: "${exampleInput}"`,
        `LLM analyzes request using ${mcpDetails.configuration.model}`,
        `LLM calls tool: "${firstTool.displayName}"`,
        `Tool makes API call: ${firstTool.method} ${api?.baseUrl}${firstTool.endpoint}`,
        `API creates tournament`,
        `LLM confirms tournament creation to user`
      ];
    } else if (firstTool.name.includes("recipe") || firstTool.name.includes("search")) {
      exampleInput = "Find me recipes with chicken and rice";
      exampleOutput = JSON.stringify({
        response: "I found 5 delicious recipes with chicken and rice. Here are the top results...",
        tool_calls: [{
          tool: firstTool.name,
          input: { query: "chicken rice recipes" },
          output: { results: 5, recipes: ["Chicken Fried Rice", "Chicken Biryani"] }
        }]
      }, null, 2);
      steps = [
        `User sends query: "${exampleInput}"`,
        `LLM analyzes request using ${mcpDetails.configuration.model}`,
        `LLM calls tool: "${firstTool.displayName}"`,
        `Tool makes API call: ${firstTool.method} ${api?.baseUrl}${firstTool.endpoint}`,
        `API returns recipe results`,
        `LLM formats and presents recipes to user`
      ];
    } else {
      exampleInput = `Use ${mcpDetails.name} to perform an action`;
      exampleOutput = JSON.stringify({
        response: "Action completed successfully",
        tool_calls: [{
          tool: firstTool.name,
          input: firstTool.inputSchema.properties || {},
          output: { success: true }
        }]
      }, null, 2);
      steps = [
        `User sends query: "${exampleInput}"`,
        `LLM analyzes request using ${mcpDetails.configuration.model}`,
        `LLM calls tool: "${firstTool.displayName}"`,
        `Tool makes API call: ${firstTool.method} ${api?.baseUrl || "API"}${firstTool.endpoint}`,
        `API processes request`,
        `LLM returns formatted response`
      ];
    }

    return { input: exampleInput, output: exampleOutput, steps };
  };

  const handleUseMCPClick = () => {
    if (mcpDetails && onUseMCP) {
      onUseMCP(mcpDetails.id, mcpDetails.name);
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading MCP details...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => mcpId && fetchMCPDetails(mcpId)}>Retry</Button>
          </div>
        ) : mcpDetails ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl flex items-center gap-2">
                <span className="text-3xl">{mcpDetails.emoji}</span>
                <span>{mcpDetails.name}</span>
              </DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span>by @{mcpDetails.author}</span>
                  {mcpDetails.stars && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{mcpDetails.stars}</span>
                      {mcpDetails.reviews && <span className="text-muted-foreground">({mcpDetails.reviews} reviews)</span>}
                    </div>
                  )}
                  {mcpDetails.uses && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{mcpDetails.uses.toLocaleString()} uses</span>
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="routes">Routes & APIs</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{mcpDetails.description}</p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-3">How It Works</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      This MCP integration allows Large Language Models to interact with external APIs through defined tools. 
                      When a user makes a request, the LLM (using {mcpDetails.configuration.model}) analyzes the query and 
                      determines which tools to call.
                    </p>
                    <p>
                      The integration includes {mcpDetails.apis.length} API{mcpDetails.apis.length !== 1 ? 's' : ''} and {mcpDetails.tools.length} tool{mcpDetails.tools.length !== 1 ? 's' : ''}, 
                      enabling the LLM to perform various actions like fetching data, creating resources, or managing information.
                    </p>
                    <p>
                      With a temperature of {mcpDetails.configuration.temperature} and a maximum token limit of {mcpDetails.configuration.maxTokens}, 
                      the LLM generates responses that are balanced between creativity and consistency.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-3">Configuration</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <dl className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Model</dt>
                          <dd className="text-base font-semibold">{mcpDetails.configuration.model}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Temperature</dt>
                          <dd className="text-base font-semibold">{mcpDetails.configuration.temperature}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Max Tokens</dt>
                          <dd className="text-base font-semibold">{mcpDetails.configuration.maxTokens}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Version</dt>
                          <dd className="text-base font-semibold">{mcpDetails.version}</dd>
                        </div>
                      </dl>
                      {mcpDetails.configuration.globalPrompt && (
                        <div className="mt-4">
                          <dt className="text-sm font-medium text-muted-foreground mb-2">System Prompt</dt>
                          <dd className="text-sm bg-muted p-3 rounded-lg">{mcpDetails.configuration.globalPrompt}</dd>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Routes & APIs Tab */}
              <TabsContent value="routes" className="space-y-6">
                {mcpDetails.apis.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No APIs configured for this MCP
                  </div>
                ) : (
                  mcpDetails.apis.map((api) => (
                    <Card key={api.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{api.name}</span>
                          <Badge variant="secondary">{api.authentication.type}</Badge>
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">{api.baseUrl}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <h4 className="font-semibold mb-3">Routes</h4>
                        {api.routes && api.routes.length > 0 ? (
                          <div className="space-y-2">
                            {api.routes.map((route) => (
                              <div key={route.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                <Badge className={`${getMethodColor(route.method)} flex-shrink-0`}>
                                  {route.method}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <code className="text-sm font-mono">{route.path}</code>
                                  {route.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{route.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No routes defined</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Tools Tab */}
              <TabsContent value="tools" className="space-y-4">
                {mcpDetails.tools.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No tools configured for this MCP
                  </div>
                ) : (
                  mcpDetails.tools.map((tool) => {
                    const connectedAPI = mcpDetails.apis.find(api => api.id === tool.apiId);
                    return (
                      <Card key={tool.id}>
                        <CardHeader>
                          <CardTitle>{tool.displayName}</CardTitle>
                          <CardDescription>{tool.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="text-sm font-medium mb-2">Endpoint</div>
                            <div className="flex items-center gap-2">
                              <Badge className={getMethodColor(tool.method)}>{tool.method}</Badge>
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{tool.endpoint}</code>
                            </div>
                          </div>

                          {connectedAPI && (
                            <div>
                              <div className="text-sm font-medium mb-2">Connected API</div>
                              <div className="text-sm text-muted-foreground">{connectedAPI.name}</div>
                            </div>
                          )}

                          <div>
                            <div className="text-sm font-medium mb-2">Input Schema</div>
                            <div className="bg-muted p-4 rounded-lg">
                              <pre className="text-xs font-mono overflow-x-auto">
                                {JSON.stringify(tool.inputSchema, null, 2)}
                              </pre>
                            </div>
                          </div>

                          {tool.inputSchema.required && tool.inputSchema.required.length > 0 && (
                            <div>
                              <div className="text-sm font-medium mb-2">Required Fields</div>
                              <div className="flex gap-2 flex-wrap">
                                {tool.inputSchema.required.map((field: string) => (
                                  <Badge key={field} variant="outline">{field}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* Examples Tab */}
              <TabsContent value="examples" className="space-y-6">
                {(() => {
                  const examples = generateExamples();
                  return (
                    <>
                      <div>
                        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                          <Play className="h-5 w-5" />
                          Example Input
                        </h3>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="font-mono text-sm">{examples.input}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold mb-3">Example Output</h3>
                        <div className="bg-muted p-4 rounded-lg">
                          <pre className="font-mono text-xs overflow-x-auto">{examples.output}</pre>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold mb-3">Execution Flow</h3>
                        <ol className="space-y-3">
                          {examples.steps.map((step, index) => (
                            <li key={index} className="flex gap-3">
                              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </span>
                              <span className="flex-1 pt-1 text-sm">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </>
                  );
                })()}
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleUseMCPClick}>
                Use This MCP
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Play, AlertTriangle } from "lucide-react";
import { useMCPStore } from "@/store/mcpStore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export function PropertiesPanel() {
  const { selectedNode, currentMCP } = useMCPStore();
  const { toast } = useToast();
  const [testQuery, setTestQuery] = useState("What's the weather in San Francisco?");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleTest = async () => {
    if (!currentMCP) return;

    setTestLoading(true);
    setTestResult(null);

    // Mock test execution
    setTimeout(() => {
      setTestResult({
        success: true,
        response: "The weather in San Francisco is currently 65°F and sunny with light winds.",
        executionFlow: [
          { step: 1, action: "Query received", details: testQuery },
          { step: 2, action: "LLM decision", details: `Using ${currentMCP.configuration.model}` },
          { step: 3, action: "Tool called", details: "get_weather(city='San Francisco')" },
          { step: 4, action: "API request", details: "GET /weather?city=San+Francisco" },
          { step: 5, action: "Response generated", details: "Temperature: 65°F, Condition: Sunny" }
        ],
        tokenUsage: {
          prompt: 125,
          completion: 45,
          total: 170
        },
        cost: 0.0034
      });
      setTestLoading(false);
      toast({
        title: "Test Complete",
        description: "Your MCP executed successfully"
      });
    }, 2000);
  };

  return (
    <div className="w-96 border-l bg-background flex flex-col h-full">
      <Tabs defaultValue="properties" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="flex-1 overflow-y-auto p-4">
          {!selectedNode ? (
            <div className="text-center text-muted-foreground py-12">
              <div className="text-4xl mb-4">👈</div>
              <div className="text-sm">Click on a node in the flow diagram to see its properties</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="font-semibold text-lg mb-2">{selectedNode.data.label}</div>
                <Badge variant="secondary">{selectedNode.data.type}</Badge>
              </div>

              {selectedNode.data.type === 'tool' && selectedNode.data.details && (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Name</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.data.details.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Description</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.data.details.description}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Endpoint</div>
                    <div className="text-xs font-mono bg-muted p-2 rounded">
                      {selectedNode.data.details.method} {selectedNode.data.details.endpoint}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Input Schema</div>
                    <div className="text-xs font-mono bg-muted p-2 rounded max-h-40 overflow-y-auto">
                      <pre>{JSON.stringify(selectedNode.data.details.inputSchema, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.data.type === 'api' && selectedNode.data.details && (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Base URL</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.data.details.baseUrl}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Authentication</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.data.details.authentication.type}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Routes</div>
                    <div className="space-y-1">
                      {selectedNode.data.details.routes.map((route: any) => (
                        <div key={route.id} className="text-xs bg-muted p-2 rounded">
                          <span className="font-semibold">{route.method}</span> {route.path}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.data.type === 'llm' && selectedNode.data.details && (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Model</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.data.details.model}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Temperature</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.data.details.temperature}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Max Tokens</div>
                    <div className="text-sm text-muted-foreground">{selectedNode.data.details.maxTokens}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">System Prompt</div>
                    <div className="text-xs bg-muted p-2 rounded max-h-40 overflow-y-auto">
                      {selectedNode.data.details.globalPrompt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="test" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {!currentMCP && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Save your MCP before testing</span>
              </div>
            )}

            <div>
              <div className="text-sm font-medium mb-2">Test Query</div>
              <Textarea
                rows={3}
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Enter a test query..."
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleTest}
              disabled={testLoading || !currentMCP}
            >
              {testLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </Button>

            {testResult && (
              <div className="space-y-4 mt-4">
                <div>
                  <div className="text-sm font-medium mb-2">Response</div>
                  <div className="bg-muted p-3 rounded text-sm max-h-40 overflow-y-auto">
                    {testResult.response}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Execution Flow</div>
                  <div className="space-y-2">
                    {testResult.executionFlow.map((step: any) => (
                      <div key={step.step} className="flex gap-2 text-xs">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{step.action}</div>
                          <div className="text-muted-foreground">{step.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Token Usage & Cost</div>
                  <div className="bg-muted p-3 rounded text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Prompt tokens:</span>
                      <span className="font-medium">{testResult.tokenUsage.prompt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion tokens:</span>
                      <span className="font-medium">{testResult.tokenUsage.completion}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total tokens:</span>
                      <span>{testResult.tokenUsage.total}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-primary mt-2 pt-2 border-t">
                      <span>Estimated cost:</span>
                      <span>${testResult.cost.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

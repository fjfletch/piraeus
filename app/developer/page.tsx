"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function APIPortal() {
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const apiKey = "sk_test_4eC39HqLyjWDarjtT1zdp7dc";
  const maskedKey = "sk_test_" + "•".repeat(20);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "API Key Copied",
      description: "API key copied to clipboard"
    });
  };

  const handleRegenerate = () => {
    if (confirm("Are you sure you want to regenerate your API key? This will invalidate your current key.")) {
      toast({
        title: "API Key Regenerated",
        description: "Your new API key is ready to use"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-2">Developer API</h1>
        <p className="text-muted-foreground mb-8">Access your MCPs programmatically</p>

        {/* API Key Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Key</CardTitle>
            <CardDescription>Use this key to authenticate API requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-sm bg-muted px-4 py-3 rounded-md">
                {showKey ? apiKey : maskedKey}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRegenerate}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Your API usage for the current period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold">1,234 / 10,000</div>
                <div className="text-sm text-muted-foreground">API Calls this month</div>
              </div>
              <div>
                <div className="text-3xl font-bold">456K / 1M</div>
                <div className="text-sm text-muted-foreground">Tokens used</div>
              </div>
              <div>
                <div className="text-3xl font-bold">$12.45 / $50</div>
                <div className="text-sm text-muted-foreground">Cost this month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>Available endpoints for executing MCPs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="font-mono text-sm mb-2">
                  <span className="text-primary font-bold">POST</span> /v1/mcp/:mcp_id/execute
                </div>
                <p className="text-sm text-muted-foreground mb-3">Execute an MCP with a user query</p>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-xs overflow-x-auto">{`{
  "query": "What's the weather in San Francisco?",
  "context": {},
  "stream": false
}`}</pre>
                </div>
              </div>
              <div className="pt-4">
                <div className="font-semibold mb-2">Response</div>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-xs overflow-x-auto">{`{
  "response": "The weather in San Francisco is...",
  "toolCalls": [
    {
      "tool": "get_weather",
      "input": {"city": "San Francisco"},
      "output": {...}
    }
  ],
  "usage": {
    "promptTokens": 100,
    "completionTokens": 50,
    "totalTokens": 150
  }
}`}</pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Code Examples</CardTitle>
            <CardDescription>Get started with these examples</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="python">
              <TabsList>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              <TabsContent value="python">
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-xs overflow-x-auto">{`import requests

url = "https://api.mcpplatform.com/v1/mcp/your-mcp-id/execute"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
data = {
    "query": "What's the weather today?"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`}</pre>
                </div>
              </TabsContent>
              <TabsContent value="javascript">
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-xs overflow-x-auto">{`const response = await fetch(
  "https://api.mcpplatform.com/v1/mcp/your-mcp-id/execute",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer ${apiKey}",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: "What's the weather today?"
    })
  }
);

const data = await response.json();
console.log(data);`}</pre>
                </div>
              </TabsContent>
              <TabsContent value="curl">
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-xs overflow-x-auto">{`curl -X POST https://api.mcpplatform.com/v1/mcp/your-mcp-id/execute \
  -H "Authorization: Bearer ${apiKey}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What's the weather today?"
  }'`}</pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
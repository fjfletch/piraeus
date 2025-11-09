'use client';

import { useState } from 'react';
import { useMCPStore } from '@/store/mcpStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Play, Loader2, X, Trash2, Edit } from 'lucide-react';
import APIConfigModal from '@/components/modals/APIConfigModal';
import ToolConfigModal from '@/components/modals/ToolConfigModal';

export default function PropertiesPanel() {
  const { currentMCP, selectedNode, updateMCP, removeAPI, removeTool, updateAPI, updateTool, selectNode } = useMCPStore();
  const { toast } = useToast();
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState('');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [isEditingAPI, setIsEditingAPI] = useState(false);
  const [isEditingTool, setIsEditingTool] = useState(false);
  const [editingAPIConfig, setEditingAPIConfig] = useState<any>(null);
  const [editingToolConfig, setEditingToolConfig] = useState<any>(null);

  const runTest = async () => {
    if (!testQuery.trim()) return;

    setIsTestRunning(true);
    setTestResult('');

    // Simulate test execution
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResponse = {
      response: "I've created the tournament 'Winter Championship' for December 15, 2025.",
      tool_calls: [
        {
          tool: 'create_tournament',
          input: { name: 'Winter Championship', date: '2025-12-15' },
          output: { id: 123, status: 'created' },
          status: 200,
          duration_ms: 450,
        },
      ],
      tokens_used: { input: 156, output: 89, total: 245 },
      cost: 0.0023,
      execution_id: `exec_${Date.now()}`,
    };

    const formattedResult = `
📝 Response:
${mockResponse.response}

🔧 Tool Calls:
${mockResponse.tool_calls
  .map(
    (tc) => `
- Tool: ${tc.tool}
  Input: ${JSON.stringify(tc.input, null, 2)}
  Output: ${JSON.stringify(tc.output, null, 2)}
  Status: ${tc.status}
  Duration: ${tc.duration_ms}ms
`
  )
  .join('')}

📊 Usage:
- Tokens: ${mockResponse.tokens_used.total} (in: ${mockResponse.tokens_used.input}, out: ${mockResponse.tokens_used.output})
- Cost: $${mockResponse.cost}
- Execution ID: ${mockResponse.execution_id}
    `;

    setTestResult(formattedResult);
    setIsTestRunning(false);
    toast({
      title: 'Test Complete ✓',
      description: 'Test execution successful',
    });
  };

  const clearTest = () => {
    setTestQuery('');
    setTestResult('');
  };

  const renderNodeProperties = () => {
    if (!selectedNode) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">👈 Click on a node in the flow diagram</p>
          <p className="text-sm">to view its properties</p>
        </div>
      );
    }

    // Tool node
    if (selectedNode.id.startsWith('tool-')) {
      const toolId = selectedNode.id.replace('tool-', '');
      const tool = currentMCP?.tools.find((t) => t.id === toolId);
      if (!tool) return <p>Tool not found</p>;

      const api = currentMCP?.apis.find((a) => a.id === tool.apiId);

      const handleDeleteTool = () => {
        if (confirm('Are you sure you want to delete this tool?')) {
          removeTool(toolId);
          selectNode(null);
          toast({
            title: 'Success',
            description: 'Tool deleted',
          });
        }
      };

      const handleEditTool = () => {
        setEditingToolConfig(tool);
        setIsEditingTool(true);
      };

      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">🔧 Tool: {tool.displayName}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleEditTool}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDeleteTool}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Tool Name</p>
              <p className="font-mono text-sm">{tool.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">{tool.description}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Connected API</p>
              <p className="text-sm">{api?.name || 'None'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <Badge variant="outline">{tool.method}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Endpoint</p>
                <p className="font-mono text-xs break-all">{tool.endpoint}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Input Schema</p>
              <Textarea
                value={JSON.stringify(tool.inputSchema, null, 2)}
                readOnly
                rows={6}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      );
    }

    // API node
    if (selectedNode.id.startsWith('api-')) {
      const apiId = selectedNode.id.replace('api-', '');
      const api = currentMCP?.apis.find((a) => a.id === apiId);
      if (!api) return <p>API not found</p>;

      const handleDeleteAPI = () => {
        if (confirm('Are you sure you want to delete this API?')) {
          removeAPI(apiId);
          selectNode(null);
          toast({
            title: 'Success',
            description: 'API deleted',
          });
        }
      };

      const handleEditAPI = () => {
        setEditingAPIConfig(api);
        setIsEditingAPI(true);
      };

      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">📡 API: {api.name}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleEditAPI}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDeleteAPI}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Base URL</p>
              <p className="font-mono text-sm break-all">{api.baseUrl}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Authentication</p>
              <Badge variant="outline">{api.authentication.type}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Routes ({api.routes.length})</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {api.routes.map((route) => (
                  <div key={route.id} className="border rounded p-2 text-xs space-y-1">
                    <p className="font-mono">
                      <Badge variant="outline" className="mr-2">
                        {route.method}
                      </Badge>
                      {route.path}
                    </p>
                    {route.description && (
                      <p className="text-muted-foreground">{route.description}</p>
                    )}
                    {route.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method) && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-muted-foreground mb-1">Request Body:</p>
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          {route.body}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // LLM node
    if (selectedNode.id === 'llm') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🤖 LLM Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Model</p>
              <p className="text-sm">{currentMCP?.configuration.model}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Temperature</p>
              <p className="text-sm">{currentMCP?.configuration.temperature}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Tokens</p>
              <p className="text-sm">{currentMCP?.configuration.maxTokens}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">System Prompt</p>
              <Textarea
                value={currentMCP?.configuration.globalPrompt || ''}
                readOnly
                rows={4}
                className="text-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Edit LLM settings in the &apos;Configuration&apos; tab in the left sidebar
            </p>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <Tabs defaultValue="properties" className="p-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="properties">Properties</TabsTrigger>
        <TabsTrigger value="test">Test</TabsTrigger>
      </TabsList>

      <TabsContent value="properties" className="mt-4">
        {renderNodeProperties()}
      </TabsContent>

      <TabsContent value="test" className="mt-4 space-y-4">
        {(!currentMCP || currentMCP.id === 'new') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-yellow-800">⚠️ Save Required</p>
            <p className="text-yellow-700 text-xs mt-1">
              You must save your MCP before testing. Click &apos;Save Draft&apos; in the top bar.
            </p>
          </div>
        )}

        {currentMCP && currentMCP.tools.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-blue-800">💡 Tip</p>
            <p className="text-blue-700 text-xs mt-1">
              Add APIs and Tools in the left sidebar to enable LLM tool calling.
            </p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Test Execution</CardTitle>
            <CardDescription>Test your MCP with a sample query</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                placeholder='Create a tournament called "Winter Championship" on December 15, 2025'
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={runTest}
                disabled={!testQuery.trim() || isTestRunning}
                className="flex-1"
              >
                {isTestRunning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Test
              </Button>
              <Button variant="outline" onClick={clearTest}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            <div className="border rounded-lg p-3 min-h-[200px] max-h-[300px] overflow-y-auto bg-muted/30">
              {isTestRunning ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : testResult ? (
                <pre className="text-xs whitespace-pre-wrap">{testResult}</pre>
              ) : (
                <p className="text-sm text-muted-foreground text-center mt-8">
                  Run a test to see results...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

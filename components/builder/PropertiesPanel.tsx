'use client';

import { useState, useEffect } from 'react';
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
import QueryNodeProperties from './QueryNodeProperties';
import ResponseNodeProperties from './ResponseNodeProperties';
import EdgeProperties from './EdgeProperties';

export default function PropertiesPanel() {
  const { currentMCP, selectedNode, selectedEdge, updateMCP, removeAPI, removeTool, updateAPI, updateTool, selectNode, updateLLMNode, getLLMNode } = useMCPStore();
  const { toast } = useToast();
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState('');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [isEditingAPI, setIsEditingAPI] = useState(false);
  const [isEditingTool, setIsEditingTool] = useState(false);
  const [editingAPIConfig, setEditingAPIConfig] = useState<any>(null);
  const [editingToolConfig, setEditingToolConfig] = useState<any>(null);
  
  // LLM configuration state for selected node
  const [llmMode, setLlmMode] = useState<'normal' | 'mcp'>('normal');
  const [model, setModel] = useState(currentMCP?.configuration.model || 'gpt-3.5-turbo');
  const [temperature, setTemperature] = useState(currentMCP?.configuration.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(currentMCP?.configuration.maxTokens || 2000);
  const [systemPrompt, setSystemPrompt] = useState(currentMCP?.configuration.globalPrompt || '');

  // Update local state when currentMCP or selectedNode changes
  useEffect(() => {
    if (currentMCP) {
      setModel(currentMCP.configuration.model);
      setTemperature(currentMCP.configuration.temperature);
      setMaxTokens(currentMCP.configuration.maxTokens);
      setSystemPrompt(currentMCP.configuration.globalPrompt);
    }
    
    // Load LLM node config if an LLM node is selected
    if (selectedNode && (selectedNode.id === 'llm' || selectedNode.id.startsWith('llm-decision'))) {
      const nodeConfig = getLLMNode(selectedNode.id);
      setLlmMode(nodeConfig.mode);
      setModel(nodeConfig.model);
      setTemperature(nodeConfig.temperature);
      setMaxTokens(nodeConfig.maxTokens);
      setSystemPrompt(nodeConfig.systemPrompt || '');
    }
  }, [currentMCP, selectedNode, getLLMNode]);

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
    // Show edge properties if edge is selected
    if (selectedEdge) {
      return <EdgeProperties edge={selectedEdge} />;
    }

    if (!selectedNode) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">👈 Click on a node or connection</p>
          <p className="text-sm">to view its properties</p>
        </div>
      );
    }

    // Query node properties
    if (selectedNode.type === 'query') {
      return <QueryNodeProperties node={selectedNode} />;
    }

    // Response node properties
    if (selectedNode.type === 'response') {
      return <ResponseNodeProperties node={selectedNode} />;
    }

    // Tool node
    if (selectedNode.id.startsWith('tool-')) {
      // Get tool ID from node data instead of parsing node ID
      const toolId = selectedNode.data?.toolId;
      const tool = currentMCP?.tools.find((t) => t.id === toolId);
      if (!tool) {
        return (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p className="text-sm">Tool not found in configuration</p>
              <p className="text-xs mt-2">The tool may have been deleted or the data is corrupted.</p>
            </CardContent>
          </Card>
        );
      }

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
      // Get API ID from node data instead of parsing node ID
      const apiId = selectedNode.data?.apiId || selectedNode.id.replace('api-', '');
      const api = currentMCP?.apis.find((a) => a.id === apiId);
      if (!api) {
        return (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p className="text-sm">API not found in configuration</p>
              <p className="text-xs mt-2">The API may have been deleted or the data is corrupted.</p>
            </CardContent>
          </Card>
        );
      }

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

    // Prompt node
    if (selectedNode.id.startsWith('prompt-')) {
      const promptId = selectedNode.data?.promptId;
      const prompt = currentMCP?.prompts.find((p) => p.id === promptId);
      
      if (!prompt) {
        return (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p className="text-sm">Prompt not found in configuration</p>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {prompt.type === 'system' ? '⚙️' : '💬'} Prompt: {prompt.type}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <Badge variant="outline" className="mt-1">
                {prompt.type}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Content</p>
              <Textarea
                value={prompt.content}
                readOnly
                rows={6}
                className="text-xs"
              />
            </div>
            {prompt.trigger && (
              <div>
                <p className="text-xs text-muted-foreground">Trigger</p>
                <p className="text-sm font-mono">{prompt.trigger}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              💡 Edit prompts in the Prompts section of the blocks palette
            </p>
          </CardContent>
        </Card>
      );
    }

    // LLM node
    if (selectedNode.id === 'llm' || selectedNode.id.startsWith('llm-decision')) {
      const handleUpdateLLMNode = () => {
        updateLLMNode(selectedNode.id, {
          mode: llmMode,
          model,
          temperature,
          maxTokens,
          systemPrompt,
        });
        toast({
          title: 'LLM Updated',
          description: 'Configuration saved',
        });
      };

      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🤖 LLM Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-semibold">Mode</Label>
              <Select
                value={llmMode}
                onValueChange={(value: 'normal' | 'mcp') => {
                  setLlmMode(value);
                  updateLLMNode(selectedNode.id, {
                    mode: value,
                    model,
                    temperature,
                    maxTokens,
                    systemPrompt,
                  });
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <span>💬</span>
                      <div>
                        <p className="font-medium">Normal Prompt</p>
                        <p className="text-xs text-muted-foreground">Standard chat/completion</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="mcp">
                    <div className="flex items-center gap-2">
                      <span>🔧</span>
                      <div>
                        <p className="font-medium">MCP Tool Calling</p>
                        <p className="text-xs text-muted-foreground">LLM can use tools</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {llmMode === 'mcp' && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Connect tools to this LLM node to enable tool calling
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <Label className="text-xs font-semibold">Model</Label>
              <Select
                value={model}
                onValueChange={(value) => {
                  setModel(value);
                  handleUpdateLLMNode();
                }}
              >
                <SelectTrigger className="text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Temperature: {temperature}</Label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTemperature(val);
                }}
                onMouseUp={handleUpdateLLMNode}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-xs">Max Tokens</Label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setMaxTokens(val);
                }}
                onBlur={handleUpdateLLMNode}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">System Prompt (Optional)</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                onBlur={handleUpdateLLMNode}
                rows={3}
                className="text-xs"
                placeholder="You are a helpful assistant..."
              />
            </div>

            <div className="bg-muted p-3 rounded-lg text-xs">
              <p className="font-semibold mb-1">Current Setup:</p>
              <p>• Mode: <strong>{llmMode === 'mcp' ? 'MCP Tool Calling' : 'Normal Prompt'}</strong></p>
              <p>• Model: <strong>{model}</strong></p>
              <p>• Temperature: <strong>{temperature}</strong></p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <>
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

      <APIConfigModal
        open={isEditingAPI}
        onOpenChange={setIsEditingAPI}
        onSave={(config) => {
          updateAPI(config.id, config);
          setIsEditingAPI(false);
          toast({
            title: 'Success',
            description: 'API updated',
          });
        }}
        existingAPI={editingAPIConfig}
      />

      <ToolConfigModal
        open={isEditingTool}
        onOpenChange={setIsEditingTool}
        onSave={(config) => {
          updateTool(config.id, config);
          setIsEditingTool(false);
          toast({
            title: 'Success',
            description: 'Tool updated',
          });
        }}
        existingTool={editingToolConfig}
      />
    </>
  );
}

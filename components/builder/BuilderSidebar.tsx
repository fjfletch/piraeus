'use client';

import { useState } from 'react';
import { useMCPStore } from '@/store/mcpStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Settings, Wifi, Wrench, MessageSquare, FileText } from 'lucide-react';
import APIConfigModal from '@/components/modals/APIConfigModal';
import ToolConfigModal from '@/components/modals/ToolConfigModal';
import { APIConfig, MCPTool } from '@/types/mcp';

export default function BuilderSidebar() {
  const { currentMCP, updateMCP, addAPI, updateAPI, addTool, updateTool } = useMCPStore();
  const { toast } = useToast();
  
  const [isAPIModalOpen, setIsAPIModalOpen] = useState(false);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [editingAPI, setEditingAPI] = useState<APIConfig | null>(null);
  const [editingTool, setEditingTool] = useState<MCPTool | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptContent, setPromptContent] = useState('');
  const [promptType, setPromptType] = useState<'system' | 'contextual'>('contextual');

  if (!currentMCP) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No MCP loaded</p>
      </div>
    );
  }

  const handleSaveAPI = (config: APIConfig) => {
    if (editingAPI) {
      updateAPI(config.id, config);
      toast({ title: 'Success', description: 'API updated' });
    } else {
      addAPI(config);
      toast({ title: 'Success', description: 'API added' });
    }
    setIsAPIModalOpen(false);
    setEditingAPI(null);
  };

  const handleSaveTool = (config: MCPTool) => {
    if (editingTool) {
      updateTool(config.id, config);
      toast({ title: 'Success', description: 'Tool updated' });
    } else {
      addTool(config);
      toast({ title: 'Success', description: 'Tool created' });
    }
    setIsToolModalOpen(false);
    setEditingTool(null);
  };

  const handleAddPrompt = () => {
    const newPrompt = {
      id: Date.now().toString(),
      type: 'contextual' as const,
      content: 'New prompt...',
    };
    updateMCP({
      prompts: [...currentMCP.prompts, newPrompt],
    });
    setEditingPrompt(newPrompt.id);
    setPromptContent(newPrompt.content);
    setPromptType(newPrompt.type);
  };

  const handleSavePrompt = () => {
    if (!editingPrompt) return;
    
    updateMCP({
      prompts: currentMCP.prompts.map((p) =>
        p.id === editingPrompt
          ? { ...p, content: promptContent, type: promptType }
          : p
      ),
    });
    toast({ title: 'Success', description: 'Prompt saved' });
    setEditingPrompt(null);
  };

  const handleDeletePrompt = (id: string) => {
    updateMCP({
      prompts: currentMCP.prompts.filter((p) => p.id !== id),
    });
    toast({ title: 'Success', description: 'Prompt deleted' });
  };

  return (
    <>
      <Tabs defaultValue="config" className="p-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="config">
            <Settings className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="apis">
            <Wifi className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Wrench className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <MessageSquare className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FileText className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div>
              <Label>Model</Label>
              <Select
                value={currentMCP.configuration.model}
                onValueChange={(value) =>
                  updateMCP({
                    configuration: { ...currentMCP.configuration, model: value },
                  })
                }
              >
                <SelectTrigger>
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
              <Label>Temperature: {currentMCP.configuration.temperature}</Label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={currentMCP.configuration.temperature}
                onChange={(e) =>
                  updateMCP({
                    configuration: {
                      ...currentMCP.configuration,
                      temperature: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Higher = more creative, Lower = more focused
              </p>
            </div>

            <div>
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={currentMCP.configuration.maxTokens}
                onChange={(e) =>
                  updateMCP({
                    configuration: {
                      ...currentMCP.configuration,
                      maxTokens: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>

            <div>
              <Label>System Prompt</Label>
              <Textarea
                rows={6}
                placeholder="You are a helpful assistant that..."
                value={currentMCP.configuration.globalPrompt}
                onBlur={(e) =>
                  updateMCP({
                    configuration: {
                      ...currentMCP.configuration,
                      globalPrompt: e.target.value,
                    },
                  })
                }
                onChange={(e) =>
                  updateMCP({
                    configuration: {
                      ...currentMCP.configuration,
                      globalPrompt: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </TabsContent>

        {/* APIs Tab */}
        <TabsContent value="apis" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">APIs ({currentMCP.apis.length})</h3>
            <Button
              size="sm"
              onClick={() => {
                setEditingAPI(null);
                setIsAPIModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add API
            </Button>
          </div>

          {currentMCP.apis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No APIs configured yet.</p>
              <p>Click &apos;Add API&apos; to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentMCP.apis.map((api) => (
                <Card key={api.id}>
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          📡 {api.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {api.routes.length} routes
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          api.status === 'connected'
                            ? 'default'
                            : api.status === 'error'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {api.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingAPI(api);
                        setIsAPIModalOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toast({
                          title: 'Testing',
                          description: 'Testing connection...',
                        })
                      }
                    >
                      Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Tools ({currentMCP.tools.length})</h3>
            <Button
              size="sm"
              onClick={() => {
                setEditingTool(null);
                setIsToolModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Tool
            </Button>
          </div>

          {currentMCP.tools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Tool className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No tools created yet.</p>
              <p>Click &apos;Create Tool&apos; to add one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentMCP.tools.map((tool) => (
                <div
                  key={tool.id}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setEditingTool(tool);
                    setIsToolModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Tool className="h-4 w-4" />
                    <div>
                      <p className="font-medium text-sm">{tool.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {tool.method} {tool.endpoint}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Prompts ({currentMCP.prompts.length})</h3>
            <Button size="sm" onClick={handleAddPrompt}>
              <Plus className="h-4 w-4 mr-1" />
              Add Prompt
            </Button>
          </div>

          {currentMCP.prompts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No prompts yet.</p>
              <p>Click &apos;Add Prompt&apos; to create one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentMCP.prompts.map((prompt) => (
                <div key={prompt.id} className="border rounded-lg p-3">
                  {editingPrompt === prompt.id ? (
                    <div className="space-y-3">
                      <Select
                        value={promptType}
                        onValueChange={(value: 'system' | 'contextual') =>
                          setPromptType(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="contextual">Contextual</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={promptContent}
                        onChange={(e) => setPromptContent(e.target.value)}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSavePrompt}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPrompt(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletePrompt(prompt.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setEditingPrompt(prompt.id);
                        setPromptContent(prompt.content);
                        setPromptType(prompt.type);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {prompt.type === 'system' ? '⚙️' : '💬'}
                        <Badge variant="outline" className="text-xs">
                          {prompt.type}
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-2">{prompt.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Resources</h3>
            <Button
              size="sm"
              disabled
              onClick={() =>
                toast({ title: 'Coming Soon', description: 'Resources feature coming soon' })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Resource
            </Button>
          </div>

          <div className="text-center py-8 text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Resources feature coming soon</p>
          </div>
        </TabsContent>
      </Tabs>

      <APIConfigModal
        open={isAPIModalOpen}
        onOpenChange={setIsAPIModalOpen}
        onSave={handleSaveAPI}
        existingAPI={editingAPI}
      />

      <ToolConfigModal
        open={isToolModalOpen}
        onOpenChange={setIsToolModalOpen}
        onSave={handleSaveTool}
        existingTool={editingTool}
      />
    </>
  );
}

'use client';

import { useMCPStore } from '@/store/mcpStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wrench, Wifi, MessageSquare, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import APIConfigModal from '@/components/modals/APIConfigModal';
import ToolConfigModal from '@/components/modals/ToolConfigModal';
import { useToast } from '@/components/ui/use-toast';

export default function BlocksPalette() {
  const { currentMCP, addAPI, addTool } = useMCPStore();
  const { toast } = useToast();
  const [isAPIModalOpen, setIsAPIModalOpen] = useState(false);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);

  const handleDragStart = (event: React.DragEvent, blockType: string, data?: any) => {
    event.dataTransfer.setData('application/reactflow', blockType);
    event.dataTransfer.setData('blockData', JSON.stringify(data || {}));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      <div className="w-64 border-r bg-background flex flex-col h-full">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Blocks Palette
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Drag blocks to canvas
          </p>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Core Building Blocks */}
            <div>
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                Core Blocks
              </h4>
              <div className="space-y-2">
                <Card
                  className="p-3 cursor-move hover:bg-muted/50 transition-colors border-2"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'user-query', {})}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎤</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium">User Query</p>
                      <p className="text-xs text-muted-foreground">Start of flow</p>
                    </div>
                  </div>
                </Card>

                <Card
                  className="p-3 cursor-move hover:bg-muted/50 transition-colors border-2"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'llm-decision', {})}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium">LLM Decision</p>
                      <p className="text-xs text-muted-foreground">AI processing</p>
                    </div>
                  </div>
                </Card>

                <Card
                  className="p-3 cursor-move hover:bg-muted/50 transition-colors border-2"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'response', {})}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium">Response</p>
                      <p className="text-xs text-muted-foreground">End of flow</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                Configuration
              </h4>
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsAPIModalOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Configure API
                </Button>
                <p className="text-xs text-muted-foreground px-1">
                  APIs are used to define Tools
                </p>
              </div>
            </div>

            {/* Tools Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                  Tools ({currentMCP?.tools.length || 0})
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => {
                    if (currentMCP?.apis.length === 0) {
                      toast({
                        title: 'No APIs',
                        description: 'Configure an API first',
                        variant: 'destructive',
                      });
                      return;
                    }
                    setIsToolModalOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2 px-1">
                Drag tools to attach to LLMs
              </p>
            </div>

            {/* Existing Tools */}
            {currentMCP && currentMCP.tools.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                  Tools ({currentMCP.tools.length})
                </h4>
                <div className="space-y-2">
                  {currentMCP.tools.map((tool) => (
                    <Card
                      key={tool.id}
                      className="p-3 cursor-move hover:bg-muted/50 transition-colors border-2"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'tool', tool)}
                    >
                      <div className="flex items-start gap-2">
                        <Wrench className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {tool.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {tool.method} {tool.endpoint}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Prompts */}
            {currentMCP && currentMCP.prompts.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                  Prompts ({currentMCP.prompts.length})
                </h4>
                <div className="space-y-2">
                  {currentMCP.prompts.map((prompt) => (
                    <Card
                      key={prompt.id}
                      className="p-3 cursor-move hover:bg-muted/50 transition-colors border-2"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'prompt', prompt)}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {prompt.type === 'system' ? '⚙️' : '💬'} {prompt.type}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {prompt.content}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {currentMCP &&
              currentMCP.tools.length === 0 &&
              currentMCP.prompts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-xs mb-3">Start building</p>
                  <p className="text-xs">
                    Drag Core Blocks to canvas or configure APIs and Tools
                  </p>
                </div>
              )}
          </div>
        </ScrollArea>
      </div>

      <APIConfigModal
        open={isAPIModalOpen}
        onOpenChange={setIsAPIModalOpen}
        onSave={(config) => {
          addAPI(config);
          setIsAPIModalOpen(false);
          toast({
            title: 'Success',
            description: 'API added. Drag it to the canvas!',
          });
        }}
        existingAPI={null}
      />

      <ToolConfigModal
        open={isToolModalOpen}
        onOpenChange={setIsToolModalOpen}
        onSave={(config) => {
          addTool(config);
          setIsToolModalOpen(false);
          toast({
            title: 'Success',
            description: 'Tool added. Drag it to the canvas!',
          });
        }}
        existingTool={null}
      />
    </>
  );
}

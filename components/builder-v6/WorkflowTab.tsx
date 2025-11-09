"use client";

import { useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, ChevronRight, Trash2, CheckCircle2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export namespace WorkflowTab {
  export function Sidebar() {
    const { savedMCPConfigs, savedResponseConfigs } = useMCPBuilderStore();
    const [mcpsFolderOpen, setMcpsFolderOpen] = useState(true);
    const [responsesFolderOpen, setResponsesFolderOpen] = useState(true);

    return (
      <div className="h-full flex flex-col p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Building Blocks</h3>
          <p className="text-xs text-muted-foreground">
            Drag items to the workflow canvas
          </p>
        </div>

        {/* MCPs Folder */}
        <div className="space-y-2">
          <button
            onClick={() => setMcpsFolderOpen(!mcpsFolderOpen)}
            className="flex items-center gap-2 text-sm font-medium w-full hover:text-primary transition-colors"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${mcpsFolderOpen ? 'rotate-90' : ''}`}
            />
            MCPs ({savedMCPConfigs.length})
          </button>

          {mcpsFolderOpen && (
            <div className="space-y-1 pl-6">
              {savedMCPConfigs.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">
                  No MCPs configured
                </div>
              ) : (
                savedMCPConfigs.map((config) => (
                  <DraggableMCPItem key={config.id} config={config} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Responses Folder */}
        <div className="space-y-2">
          <button
            onClick={() => setResponsesFolderOpen(!responsesFolderOpen)}
            className="flex items-center gap-2 text-sm font-medium w-full hover:text-primary transition-colors"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${responsesFolderOpen ? 'rotate-90' : ''}`}
            />
            Responses ({savedResponseConfigs.length})
          </button>

          {responsesFolderOpen && (
            <div className="space-y-1 pl-6">
              {savedResponseConfigs.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">
                  No responses configured
                </div>
              ) : (
                savedResponseConfigs.map((config) => (
                  <DraggableResponseItem key={config.id} config={config} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  export function Canvas() {
    const { toast } = useToast();
    const {
      workflowSteps,
      addWorkflowStep,
      updateWorkflowStep,
      deleteWorkflowStep,
      canAddStepType,
      getMCPConfigById,
      getResponseConfigById,
      setSelectedItem,
    } = useMCPBuilderStore();

    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

    const toggleStep = (stepId: string) => {
      setExpandedSteps((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(stepId)) {
          newSet.delete(stepId);
        } else {
          newSet.add(stepId);
        }
        return newSet;
      });
    };

    const handleDrop = (e: React.DragEvent, afterStepId?: string) => {
      e.preventDefault();
      e.stopPropagation();

      const type = e.dataTransfer.getData('type');

      if (type === 'saved-mcp') {
        const mcpConfigId = parseInt(e.dataTransfer.getData('mcpConfigId'));
        const config = getMCPConfigById(mcpConfigId);

        if (config && canAddStepType('mcp', afterStepId)) {
          const newStepId = addWorkflowStep('mcp', afterStepId);

          if (newStepId) {
            updateWorkflowStep(newStepId, {
              mcpConfigId: config.id,
              model: config.model,
              temperature: config.temperature,
              maxTokens: config.maxTokens,
              systemPrompt: config.systemPrompt,
              instruction: config.instruction,
              selectedTools: config.selectedTools,
            });

            setSelectedItem({ type: 'mcp', stepId: newStepId });
          }
        } else {
          toast({
            title: 'Cannot Add MCP',
            description: 'After an MCP, you need a Response Handler',
            variant: 'destructive',
          });
        }
        return;
      }

      if (type === 'saved-response') {
        const responseConfigId = parseInt(e.dataTransfer.getData('responseConfigId'));
        const config = getResponseConfigById(responseConfigId);

        if (config && canAddStepType('response', afterStepId)) {
          const newStepId = addWorkflowStep('response', afterStepId);

          if (newStepId) {
            updateWorkflowStep(newStepId, {
              responseConfigId: config.id,
              responseType: config.type,
              reprocessInstructions: config.reprocessInstructions,
              errorHandling: config.errorHandling,
            });

            setSelectedItem({ type: 'response', stepId: newStepId });
          }
        } else {
          toast({
            title: 'Cannot Add Response',
            description: 'Response must follow an MCP step',
            variant: 'destructive',
          });
        }
      }
    };

    const handleDelete = (stepId: string) => {
      deleteWorkflowStep(stepId);
      toast({
        title: 'Step Deleted',
        description: 'Workflow step has been removed',
      });
    };

    return (
      <div className="h-full overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Workflow</h2>
          <p className="text-muted-foreground">
            Build your workflow step by step
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4 max-w-3xl">
          {workflowSteps.length === 0 ? (
            <AddStepDropZone onDrop={(e) => handleDrop(e)} afterStepId={undefined} />
          ) : (
            <>
              {workflowSteps.map((step, index) => (
                <div key={step.id}>
                  {/* Step Card */}
                  {step.type === 'mcp' ? (
                    <MCPStepCard
                      step={step}
                      isExpanded={expandedSteps.has(step.id)}
                      onToggle={() => toggleStep(step.id)}
                      onDelete={() => handleDelete(step.id)}
                      onClick={() => setSelectedItem({ type: 'mcp', stepId: step.id })}
                    />
                  ) : (
                    <ResponseStepCard
                      step={step}
                      isExpanded={expandedSteps.has(step.id)}
                      onToggle={() => toggleStep(step.id)}
                      onDelete={() => handleDelete(step.id)}
                      onClick={() => setSelectedItem({ type: 'response', stepId: step.id })}
                    />
                  )}

                  {/* Add Step Drop Zone */}
                  <div className="py-2">
                    <AddStepDropZone
                      onDrop={(e) => handleDrop(e, step.id)}
                      afterStepId={step.id}
                    />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }
}

// MCP Step Card Component
function MCPStepCard({
  step,
  isExpanded,
  onToggle,
  onDelete,
  onClick,
}: {
  step: any;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const { getMCPConfigById } = useMCPBuilderStore();
  const mcpConfig = step.mcpConfigId ? getMCPConfigById(step.mcpConfigId) : null;
  const isDeployed = mcpConfig?.deploymentStatus === 'deployed';

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">MCP</span>
                {isDeployed && (
                  <div
                    className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"
                    title="Server is deployed and active"
                  />
                )}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {mcpConfig?.name || 'No MCP configuration'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && mcpConfig && (
        <CardContent className="pt-0 space-y-2 text-sm">
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div>
              <span className="text-muted-foreground">Model: </span>
              <span className="font-medium">{mcpConfig.model}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tools: </span>
              <span className="font-medium">{mcpConfig.selectedTools.length}</span>
            </div>
            {isDeployed && mcpConfig.deploymentUrl && (
              <div className="flex items-start gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-600 dark:text-green-400 break-all">
                  {mcpConfig.deploymentUrl}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Response Step Card Component
function ResponseStepCard({
  step,
  isExpanded,
  onToggle,
  onDelete,
  onClick,
}: {
  step: any;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const { updateWorkflowStep } = useMCPBuilderStore();

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Send className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold">Response Handler</span>
              <div className="text-sm text-muted-foreground">
                {step.responseType === 'raw-output' ? 'Raw Output' : 'LLM Reprocess'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Response Type</label>
            <Select
              value={step.responseType || 'raw-output'}
              onValueChange={(value: any) =>
                updateWorkflowStep(step.id, { responseType: value })
              }
            >
              <SelectTrigger onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw-output">Raw Output</SelectItem>
                <SelectItem value="llm-reprocess">LLM Reprocess</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {step.responseType === 'llm-reprocess' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Reprocess Instructions</label>
              <Textarea
                value={step.reprocessInstructions || ''}
                onChange={(e) =>
                  updateWorkflowStep(step.id, {
                    reprocessInstructions: e.target.value,
                  })
                }
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter reprocess instructions..."
                className="min-h-[80px]"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Error Handling</label>
            <Select
              value={step.errorHandling || 'pass-through'}
              onValueChange={(value: any) =>
                updateWorkflowStep(step.id, { errorHandling: value })
              }
            >
              <SelectTrigger onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pass-through">Pass Through</SelectItem>
                <SelectItem value="retry">Retry</SelectItem>
                <SelectItem value="fallback">Fallback</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Draggable MCP Item Component
function DraggableMCPItem({ config }: { config: any }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('type', 'saved-mcp');
        e.dataTransfer.setData('mcpConfigId', config.id.toString());
        e.dataTransfer.effectAllowed = 'copy';
        setIsDragging(true);
      }}
      onDragEnd={() => {
        setIsDragging(false);
      }}
      className={`
        p-2 rounded-md border cursor-move 
        transition-all duration-200
        flex items-center gap-2 text-xs
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        bg-card border-border
        hover:bg-accent hover:border-primary/50
      `}
    >
      <Bot className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
      <span className="truncate">{config.name}</span>
    </div>
  );
}

// Draggable Response Item Component
function DraggableResponseItem({ config }: { config: any }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('type', 'saved-response');
        e.dataTransfer.setData('responseConfigId', config.id.toString());
        e.dataTransfer.effectAllowed = 'copy';
        setIsDragging(true);
      }}
      onDragEnd={() => {
        setIsDragging(false);
      }}
      className={`
        p-2 rounded-md border cursor-move 
        transition-all duration-200
        flex items-center gap-2 text-xs
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        bg-card border-border
        hover:bg-accent hover:border-primary/50
      `}
    >
      <Send className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
      <span className="truncate">{config.name}</span>
    </div>
  );
}

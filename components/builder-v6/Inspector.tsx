"use client";

import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, Send, Wrench } from 'lucide-react';
import { TestingPanel } from './TestingPanel';

export function Inspector() {
  const {
    selectedItem,
    getToolById,
    getPromptById,
    getMCPConfigById,
    getResponseConfigById,
    getWorkflowStepById,
  } = useMCPBuilderStore();

  if (!selectedItem) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Select a workflow step to view details</p>
        </div>
      </div>
    );
  }

  // MCP Step
  if (selectedItem.type === 'mcp') {
    const step = getWorkflowStepById(selectedItem.stepId);
    if (!step) return null;

    const mcpConfig = step.mcpConfigId ? getMCPConfigById(step.mcpConfigId) : null;

    return (
      <div className="h-full overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Bot className="h-5 w-5" />
            MCP Step
          </h3>
          <Separator className="mb-4" />
        </div>

        {mcpConfig ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name: </span>
                <span className="font-medium">{mcpConfig.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Model: </span>
                <span className="font-medium">{step.model || mcpConfig.model}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Temperature: </span>
                <span className="font-medium">{step.temperature || mcpConfig.temperature}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Max Tokens: </span>
                <span className="font-medium">{step.maxTokens || mcpConfig.maxTokens}</span>
              </div>
              {step.systemPrompt && (
                <div>
                  <span className="text-muted-foreground block mb-1">System Prompt:</span>
                  <div className="p-2 bg-muted rounded text-xs">
                    {step.systemPrompt}
                  </div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground block mb-1">Instruction:</span>
                <div className="p-2 bg-muted rounded text-xs">
                  {step.instruction || mcpConfig.instruction}
                </div>
              </div>
              {mcpConfig.deploymentStatus === 'deployed' && mcpConfig.deploymentUrl && (
                <div>
                  <span className="text-muted-foreground block mb-1">Deployment URL:</span>
                  <div className="p-2 bg-muted rounded text-xs break-all">
                    {mcpConfig.deploymentUrl}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">No MCP configuration set</p>
            </CardContent>
          </Card>
        )}

        {(step.selectedTools && step.selectedTools.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Tools ({step.selectedTools.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {step.selectedTools.map((toolId) => {
                const tool = getToolById(toolId);
                if (!tool) return null;
                return (
                  <div key={toolId} className="flex items-start gap-2 text-sm">
                    <Wrench className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{tool.url}</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Response Step
  if (selectedItem.type === 'response') {
    const step = getWorkflowStepById(selectedItem.stepId);
    if (!step) return null;

    const responseConfig = step.responseConfigId
      ? getResponseConfigById(step.responseConfigId)
      : null;

    return (
      <div className="h-full overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Send className="h-5 w-5" />
            Response Step
          </h3>
          <Separator className="mb-4" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {responseConfig && (
              <div>
                <span className="text-muted-foreground">Name: </span>
                <span className="font-medium">{responseConfig.name}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Response Type: </span>
              <Badge variant="secondary">
                {step.responseType === 'raw-output' ? 'Raw Output' : 'LLM Reprocess'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Error Handling: </span>
              <Badge variant="outline">
                {step.errorHandling === 'pass-through'
                  ? 'Pass Through'
                  : step.errorHandling === 'retry'
                  ? 'Retry'
                  : 'Fallback'}
              </Badge>
            </div>
            {step.responseType === 'llm-reprocess' && step.reprocessInstructions && (
              <div>
                <span className="text-muted-foreground block mb-1">Reprocess Instructions:</span>
                <div className="p-2 bg-muted rounded text-xs">
                  {step.reprocessInstructions}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Testing Panel
  if (selectedItem.type === 'testing') {
    return <TestingPanel />;
  }

  return null;
}

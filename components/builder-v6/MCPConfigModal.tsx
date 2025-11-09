"use client";

import { useEffect, useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { SavedMCPConfig } from '@/types/builder';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Rocket, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToolSelectorModal } from './ToolSelectorModal';

interface MCPConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configId: number | null;
  onDeploy?: (configId: number) => void;
}

export function MCPConfigModal({
  open,
  onOpenChange,
  configId,
  onDeploy,
}: MCPConfigModalProps) {
  const { toast } = useToast();
  const {
    tools,
    savedPrompts,
    addMCPConfig,
    updateMCPConfig,
    deleteMCPConfig,
    getMCPConfigById,
    getToolById,
  } = useMCPBuilderStore();

  const [localConfig, setLocalConfig] = useState<Omit<SavedMCPConfig, 'id'> | null>(null);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPromptMode, setSystemPromptMode] = useState<'saved' | 'custom'>('custom');
  const [instructionMode, setInstructionMode] = useState<'saved' | 'custom'>('custom');
  const [selectedSystemPromptId, setSelectedSystemPromptId] = useState<number | null>(null);
  const [selectedInstructionPromptId, setSelectedInstructionPromptId] = useState<number | null>(null);
  const [isToolSelectorOpen, setIsToolSelectorOpen] = useState(false);

  // Initialize config data when modal opens
  useEffect(() => {
    if (open) {
      if (configId === null) {
        // New config
        setLocalConfig({
          name: 'New MCP Configuration',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 500,
          systemPrompt: '',
          instruction: 'You are a helpful AI assistant.',
          selectedTools: [],
          deploymentStatus: 'not-deployed',
        });
        setShowSystemPrompt(false);
        setSystemPromptMode('custom');
        setInstructionMode('custom');
        setSelectedSystemPromptId(null);
        setSelectedInstructionPromptId(null);
      } else {
        // Edit existing config
        const config = getMCPConfigById(configId);
        if (config) {
          setLocalConfig({
            name: config.name,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            systemPrompt: config.systemPrompt || '',
            instruction: config.instruction,
            selectedTools: [...config.selectedTools],
            deploymentStatus: config.deploymentStatus,
            deployedAt: config.deployedAt,
            deploymentUrl: config.deploymentUrl,
          });
          setShowSystemPrompt(!!config.systemPrompt);
        }
      }
    }
  }, [open, configId, getMCPConfigById]);

  const handleSave = () => {
    if (!localConfig) return;

    if (!localConfig.name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for the MCP configuration',
        variant: 'destructive',
      });
      return;
    }

    if (configId === null) {
      // Add new config
      const newId = addMCPConfig(localConfig);
      toast({
        title: 'MCP Configuration Created',
        description: `${localConfig.name} has been created successfully`,
      });
      onOpenChange(false);
    } else {
      // Update existing config
      updateMCPConfig(configId, localConfig);
      toast({
        title: 'MCP Configuration Updated',
        description: `${localConfig.name} has been updated successfully`,
      });
      onOpenChange(false);
    }
  };

  const handleSaveAndDeploy = () => {
    if (!localConfig) return;

    if (!localConfig.name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for the MCP configuration',
        variant: 'destructive',
      });
      return;
    }

    let finalConfigId = configId;

    if (configId === null) {
      // Add new config
      finalConfigId = addMCPConfig(localConfig);
    } else {
      // Update existing config
      updateMCPConfig(configId, localConfig);
    }

    onOpenChange(false);

    // Trigger deployment
    if (onDeploy && finalConfigId !== null) {
      onDeploy(finalConfigId);
    }
  };

  const handleDelete = () => {
    if (configId !== null) {
      const config = getMCPConfigById(configId);
      deleteMCPConfig(configId);
      toast({
        title: 'MCP Configuration Deleted',
        description: `${config?.name} has been deleted`,
        variant: 'destructive',
      });
      onOpenChange(false);
    }
  };

  const handleSystemPromptModeChange = (value: string) => {
    if (value === 'custom') {
      setSystemPromptMode('custom');
      setSelectedSystemPromptId(null);
    } else if (value.startsWith('saved-')) {
      const promptId = parseInt(value.replace('saved-', ''));
      const prompt = savedPrompts.find((p) => p.id === promptId);
      if (prompt) {
        setSystemPromptMode('saved');
        setSelectedSystemPromptId(promptId);
        setLocalConfig((prev) => prev ? { ...prev, systemPrompt: prompt.content } : null);
      }
    }
  };

  const handleInstructionModeChange = (value: string) => {
    if (value === 'custom') {
      setInstructionMode('custom');
      setSelectedInstructionPromptId(null);
    } else if (value.startsWith('saved-')) {
      const promptId = parseInt(value.replace('saved-', ''));
      const prompt = savedPrompts.find((p) => p.id === promptId);
      if (prompt) {
        setInstructionMode('saved');
        setSelectedInstructionPromptId(promptId);
        setLocalConfig((prev) => prev ? { ...prev, instruction: prompt.content } : null);
      }
    }
  };

  const removeTool = (toolId: number) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      selectedTools: localConfig.selectedTools.filter((id) => id !== toolId),
    });
  };

  if (!localConfig) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {configId === null ? 'Create MCP Configuration' : 'Edit MCP Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure an MCP with model settings, prompts, and tools
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Config Name */}
            <div className="space-y-2">
              <Label htmlFor="config-name">Configuration Name</Label>
              <Input
                id="config-name"
                value={localConfig.name}
                onChange={(e) => setLocalConfig({ ...localConfig, name: e.target.value })}
                placeholder="e.g., Email Processing MCP"
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="config-model">Model</Label>
              <Select
                value={localConfig.model}
                onValueChange={(value) => setLocalConfig({ ...localConfig, model: value })}
              >
                <SelectTrigger id="config-model">
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

            {/* Temperature */}
            <div className="space-y-2">
              <Label htmlFor="config-temperature">
                Temperature: {localConfig.temperature.toFixed(1)}
              </Label>
              <Slider
                id="config-temperature"
                min={0}
                max={2}
                step={0.1}
                value={[localConfig.temperature]}
                onValueChange={(value) =>
                  setLocalConfig({ ...localConfig, temperature: value[0] })
                }
              />
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label htmlFor="config-max-tokens">Max Tokens</Label>
              <Input
                id="config-max-tokens"
                type="number"
                value={localConfig.maxTokens}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, maxTokens: parseInt(e.target.value) || 500 })
                }
              />
            </div>

            {/* System Prompt (Optional) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-system-prompt"
                  checked={showSystemPrompt}
                  onCheckedChange={(checked) => setShowSystemPrompt(!!checked)}
                />
                <Label htmlFor="show-system-prompt" className="cursor-pointer">
                  Use System Prompt
                </Label>
              </div>

              {showSystemPrompt && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="system-prompt-mode">System Prompt Mode</Label>
                  <Select
                    value={
                      systemPromptMode === 'custom'
                        ? 'custom'
                        : `saved-${selectedSystemPromptId}`
                    }
                    onValueChange={handleSystemPromptModeChange}
                  >
                    <SelectTrigger id="system-prompt-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Text</SelectItem>
                      {savedPrompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={`saved-${prompt.id}`}>
                          {prompt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {systemPromptMode === 'custom' ? (
                    <Textarea
                      value={localConfig.systemPrompt}
                      onChange={(e) =>
                        setLocalConfig({ ...localConfig, systemPrompt: e.target.value })
                      }
                      placeholder="Enter system prompt..."
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Using saved prompt: {savedPrompts.find(p => p.id === selectedSystemPromptId)?.name}
                      </p>
                      <p className="text-sm">{localConfig.systemPrompt}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Instruction (Required) */}
            <div className="space-y-2">
              <Label htmlFor="instruction-mode">Instruction</Label>
              <Select
                value={
                  instructionMode === 'custom'
                    ? 'custom'
                    : `saved-${selectedInstructionPromptId}`
                }
                onValueChange={handleInstructionModeChange}
              >
                <SelectTrigger id="instruction-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Text</SelectItem>
                  {savedPrompts.map((prompt) => (
                    <SelectItem key={prompt.id} value={`saved-${prompt.id}`}>
                      {prompt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {instructionMode === 'custom' ? (
                <Textarea
                  value={localConfig.instruction}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, instruction: e.target.value })
                  }
                  placeholder="Enter instruction..."
                  className="min-h-[100px]"
                />
              ) : (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Using saved prompt: {savedPrompts.find(p => p.id === selectedInstructionPromptId)?.name}
                  </p>
                  <p className="text-sm">{localConfig.instruction}</p>
                </div>
              )}
            </div>

            {/* Selected Tools */}
            <div className="space-y-2">
              <Label>Selected Tools ({localConfig.selectedTools.length})</Label>
              {localConfig.selectedTools.length === 0 ? (
                <div className="p-3 border rounded-lg text-sm text-muted-foreground">
                  No tools selected
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                  {localConfig.selectedTools.map((toolId) => {
                    const tool = getToolById(toolId);
                    if (!tool) return null;
                    return (
                      <Badge key={toolId} variant="secondary" className="gap-1">
                        {tool.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeTool(toolId)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsToolSelectorOpen(true)}
              >
                Select Tools
              </Button>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {configId !== null && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" variant="outline" onClick={handleSave}>
                Save
              </Button>
              <Button type="button" onClick={handleSaveAndDeploy}>
                <Rocket className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tool Selector Modal */}
      <ToolSelectorModal
        open={isToolSelectorOpen}
        onOpenChange={setIsToolSelectorOpen}
        selectedTools={localConfig.selectedTools}
        onSelect={(toolIds) =>
          setLocalConfig({ ...localConfig, selectedTools: toolIds })
        }
      />
    </>
  );
}

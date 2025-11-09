"use client";

import { useEffect, useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { Tool } from '@/types/builder';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolId: number | null;
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between bg-muted hover:bg-muted/80 transition-colors"
      >
        <span className="font-medium text-sm">{title}</span>
        <ChevronRight
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="p-4 border-t bg-background">
          {children}
        </div>
      )}
    </div>
  );
}

export function ToolModal({ open, onOpenChange, toolId }: ToolModalProps) {
  const { toast } = useToast();
  const { tools, syncAddTool, syncUpdateTool, syncDeleteTool, getToolById, isSyncing } = useMCPBuilderStore();
  
  const [localTool, setLocalTool] = useState<Omit<Tool, 'id'> | null>(null);
  const [collapsedSections, setCollapsedSections] = useState({
    headers: true,
    queryParams: true,
  });

  // Initialize tool data when modal opens
  useEffect(() => {
    if (open) {
      if (toolId === null) {
        // New tool
        setLocalTool({
          name: 'New Tool',
          description: 'Tool description',
          method: 'GET',
          url: 'https://api.example.com/endpoint',
          headers: [],
          queryParams: [],
          body: '',
        });
      } else {
        // Edit existing tool
        const tool = getToolById(toolId);
        if (tool) {
          setLocalTool({
            name: tool.name,
            description: tool.description,
            method: tool.method,
            url: tool.url,
            headers: [...tool.headers],
            queryParams: [...tool.queryParams],
            body: tool.body,
          });
        }
      }
    }
  }, [open, toolId, getToolById]);

  const toggleSection = (section: 'headers' | 'queryParams') => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSave = async () => {
    if (!localTool) return;

    if (toolId === null) {
      // Add new tool
      const newId = await syncAddTool(localTool);
      if (newId) {
        toast({
          title: 'Tool Created',
          description: `${localTool.name} has been saved to backend`,
        });
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save tool to backend',
          variant: 'destructive',
        });
      }
    } else {
      // Update existing tool
      await syncUpdateTool(toolId, localTool);
      toast({
        title: 'Tool Updated',
        description: `${localTool.name} has been synced to backend`,
      });
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (toolId !== null) {
      const tool = getToolById(toolId);
      await syncDeleteTool(toolId);
      toast({
        title: 'Tool Deleted',
        description: `${tool?.name} has been deleted from backend`,
        variant: 'destructive',
      });
      onOpenChange(false);
    }
  };

  const addHeader = () => {
    if (!localTool) return;
    setLocalTool({
      ...localTool,
      headers: [...localTool.headers, { key: '', value: '' }],
    });
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    if (!localTool) return;
    const newHeaders = [...localTool.headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setLocalTool({ ...localTool, headers: newHeaders });
  };

  const removeHeader = (index: number) => {
    if (!localTool) return;
    setLocalTool({
      ...localTool,
      headers: localTool.headers.filter((_, i) => i !== index),
    });
  };

  const addQueryParam = () => {
    if (!localTool) return;
    setLocalTool({
      ...localTool,
      queryParams: [...localTool.queryParams, { key: '', value: '' }],
    });
  };

  const updateQueryParam = (index: number, field: 'key' | 'value', value: string) => {
    if (!localTool) return;
    const newParams = [...localTool.queryParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setLocalTool({ ...localTool, queryParams: newParams });
  };

  const removeQueryParam = (index: number) => {
    if (!localTool) return;
    setLocalTool({
      ...localTool,
      queryParams: localTool.queryParams.filter((_, i) => i !== index),
    });
  };

  const showRequestBody = localTool?.method && ['POST', 'PUT', 'PATCH'].includes(localTool.method);

  if (!localTool) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{toolId === null ? 'Create Tool' : 'Edit Tool'}</DialogTitle>
          <DialogDescription>
            Configure an HTTP API tool that MCPs can use
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tool Name */}
          <div className="space-y-2">
            <Label htmlFor="tool-name">Tool Name</Label>
            <Input
              id="tool-name"
              value={localTool.name}
              onChange={(e) => setLocalTool({ ...localTool, name: e.target.value })}
              placeholder="e.g., Search GitHub Repos"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="tool-description">Description</Label>
            <Input
              id="tool-description"
              value={localTool.description}
              onChange={(e) => setLocalTool({ ...localTool, description: e.target.value })}
              placeholder="What does this tool do?"
            />
            <p className="text-xs text-muted-foreground">
              The LLM uses this to understand when to call the tool
            </p>
          </div>

          {/* Method */}
          <div className="space-y-2">
            <Label htmlFor="tool-method">Method</Label>
            <Select
              value={localTool.method}
              onValueChange={(value: any) => setLocalTool({ ...localTool, method: value })}
            >
              <SelectTrigger id="tool-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="tool-url">URL</Label>
            <Input
              id="tool-url"
              value={localTool.url}
              onChange={(e) => setLocalTool({ ...localTool, url: e.target.value })}
              placeholder="https://api.example.com/endpoint"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use {'{variable}'} for dynamic values
            </p>
          </div>

          {/* Headers Section */}
          <CollapsibleSection
            title={`Headers (${localTool.headers.length})`}
            isOpen={!collapsedSections.headers}
            onToggle={() => toggleSection('headers')}
          >
            <div className="space-y-3">
              {localTool.headers.map((header, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    placeholder="Header name"
                  />
                  <Input
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    placeholder="Header value"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHeader(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHeader}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Header
              </Button>
            </div>
          </CollapsibleSection>

          {/* Query Parameters Section */}
          <CollapsibleSection
            title={`Query Parameters (${localTool.queryParams.length})`}
            isOpen={!collapsedSections.queryParams}
            onToggle={() => toggleSection('queryParams')}
          >
            <div className="space-y-3">
              {localTool.queryParams.map((param, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input
                    value={param.key}
                    onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                    placeholder="Parameter name"
                  />
                  <Input
                    value={param.value}
                    onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                    placeholder="Parameter value"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQueryParam(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQueryParam}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Query Parameter
              </Button>
            </div>
          </CollapsibleSection>

          {/* Request Body */}
          {showRequestBody && (
            <div className="space-y-2">
              <Label htmlFor="tool-body">Request Body</Label>
              <Textarea
                id="tool-body"
                value={localTool.body}
                onChange={(e) => setLocalTool({ ...localTool, body: e.target.value })}
                placeholder="JSON request body"
                className="font-mono text-sm min-h-[150px]"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {toolId !== null && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSyncing}>
              {isSyncing ? 'Saving...' : 'Save Tool'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

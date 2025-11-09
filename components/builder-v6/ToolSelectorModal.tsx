"use client";

import { useEffect, useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Wrench } from 'lucide-react';

interface ToolSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTools: number[];
  onSelect: (toolIds: number[]) => void;
}

export function ToolSelectorModal({
  open,
  onOpenChange,
  selectedTools,
  onSelect,
}: ToolSelectorModalProps) {
  const { tools } = useMCPBuilderStore();
  const [localSelectedTools, setLocalSelectedTools] = useState<number[]>([]);

  // Initialize from props on open
  useEffect(() => {
    if (open) {
      setLocalSelectedTools([...selectedTools]);
    }
  }, [open, selectedTools]);

  const toggleTool = (toolId: number) => {
    setLocalSelectedTools((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId);
      } else {
        return [...prev, toolId];
      }
    });
  };

  const handleDone = () => {
    onSelect(localSelectedTools);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalSelectedTools([...selectedTools]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Tools</DialogTitle>
          <DialogDescription>
            Choose which tools this MCP can access
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto py-4">
          {tools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tools available. Create tools first in the Tools tab.
            </div>
          ) : (
            <div className="space-y-2">
              {tools.map((tool) => {
                const isSelected = localSelectedTools.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTool(tool.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm">{tool.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleDone}>
            Done ({localSelectedTools.length} selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { SavedPrompt } from '@/types/builder';
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
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: number | null;
}

export function PromptModal({ open, onOpenChange, promptId }: PromptModalProps) {
  const { toast } = useToast();
  const { syncAddPrompt, syncUpdatePrompt, syncDeletePrompt, getPromptById, isSyncing } = useMCPBuilderStore();
  
  const [localPrompt, setLocalPrompt] = useState<Omit<SavedPrompt, 'id'> | null>(null);

  // Initialize prompt data when modal opens
  useEffect(() => {
    if (open) {
      if (promptId === null) {
        // New prompt
        setLocalPrompt({
          name: 'New Prompt',
          content: '',
        });
      } else {
        // Edit existing prompt
        const prompt = getPromptById(promptId);
        if (prompt) {
          setLocalPrompt({
            name: prompt.name,
            content: prompt.content,
          });
        }
      }
    }
  }, [open, promptId, getPromptById]);

  const handleSave = async () => {
    if (!localPrompt) return;

    if (!localPrompt.name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for the prompt',
        variant: 'destructive',
      });
      return;
    }

    if (!localPrompt.content.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please enter content for the prompt',
        variant: 'destructive',
      });
      return;
    }

    if (promptId === null) {
      // Add new prompt
      const newId = await syncAddPrompt(localPrompt);
      if (newId) {
        toast({
          title: 'Prompt Created',
          description: `${localPrompt.name} has been saved to backend`,
        });
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save prompt to backend',
          variant: 'destructive',
        });
      }
    } else {
      // Update existing prompt
      await syncUpdatePrompt(promptId, localPrompt);
      toast({
        title: 'Prompt Updated',
        description: `${localPrompt.name} has been synced to backend`,
      });
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (promptId !== null) {
      const prompt = getPromptById(promptId);
      await syncDeletePrompt(promptId);
      toast({
        title: 'Prompt Deleted',
        description: `${prompt?.name} has been deleted from backend`,
        variant: 'destructive',
      });
      onOpenChange(false);
    }
  };

  if (!localPrompt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{promptId === null ? 'Create Prompt' : 'Edit Prompt'}</DialogTitle>
          <DialogDescription>
            Create a reusable prompt that can be used in MCP configurations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prompt Name */}
          <div className="space-y-2">
            <Label htmlFor="prompt-name">Prompt Name</Label>
            <Input
              id="prompt-name"
              value={localPrompt.name}
              onChange={(e) => setLocalPrompt({ ...localPrompt, name: e.target.value })}
              placeholder="e.g., Professional Assistant Prompt"
            />
          </div>

          {/* Prompt Content */}
          <div className="space-y-2">
            <Label htmlFor="prompt-content">Prompt Content</Label>
            <Textarea
              id="prompt-content"
              value={localPrompt.content}
              onChange={(e) => setLocalPrompt({ ...localPrompt, content: e.target.value })}
              placeholder="Enter your prompt text here..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              This prompt can be used as a system prompt or instruction in your MCP configurations
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {promptId !== null && (
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
              {isSyncing ? 'Saving...' : 'Save Prompt'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

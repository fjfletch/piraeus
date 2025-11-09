"use client";

import { useEffect, useState } from 'react';
import { useMCPBuilderStore } from '@/store/mcpBuilderStore';
import { SavedResponseConfig } from '@/types/builder';
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
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResponseConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configId: number | null;
}

export function ResponseConfigModal({
  open,
  onOpenChange,
  configId,
}: ResponseConfigModalProps) {
  const { toast } = useToast();
  const {
    syncAddResponseConfig,
    syncUpdateResponseConfig,
    syncDeleteResponseConfig,
    getResponseConfigById,
    isSyncing,
  } = useMCPBuilderStore();

  const [localConfig, setLocalConfig] = useState<Omit<SavedResponseConfig, 'id'> | null>(null);

  // Initialize config data when modal opens
  useEffect(() => {
    if (open) {
      if (configId === null) {
        // New config
        setLocalConfig({
          name: 'New Response Config',
          type: 'raw-output',
          reprocessInstructions: '',
          errorHandling: 'pass-through',
        });
      } else {
        // Edit existing config
        const config = getResponseConfigById(configId);
        if (config) {
          setLocalConfig({
            name: config.name,
            type: config.type,
            reprocessInstructions: config.reprocessInstructions || '',
            errorHandling: config.errorHandling || 'pass-through',
          });
        }
      }
    }
  }, [open, configId, getResponseConfigById]);

  const handleSave = async () => {
    if (!localConfig) return;

    if (!localConfig.name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for the response configuration',
        variant: 'destructive',
      });
      return;
    }

    if (configId === null) {
      // Add new config
      const newId = await syncAddResponseConfig(localConfig);
      if (newId) {
        toast({
          title: 'Response Config Created',
          description: `${localConfig.name} has been saved to backend`,
        });
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save response config to backend',
          variant: 'destructive',
        });
      }
    } else {
      // Update existing config
      await syncUpdateResponseConfig(configId, localConfig);
      toast({
        title: 'Response Config Updated',
        description: `${localConfig.name} has been synced to backend`,
      });
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (configId !== null) {
      const config = getResponseConfigById(configId);
      await syncDeleteResponseConfig(configId);
      toast({
        title: 'Response Config Deleted',
        description: `${config?.name} has been deleted from backend`,
        variant: 'destructive',
      });
      onOpenChange(false);
    }
  };

  if (!localConfig) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {configId === null ? 'Create Response Config' : 'Edit Response Config'}
          </DialogTitle>
          <DialogDescription>
            Configure how responses from MCPs are processed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Config Name */}
          <div className="space-y-2">
            <Label htmlFor="response-name">Configuration Name</Label>
            <Input
              id="response-name"
              value={localConfig.name}
              onChange={(e) => setLocalConfig({ ...localConfig, name: e.target.value })}
              placeholder="e.g., Format JSON Response"
            />
          </div>

          {/* Response Type */}
          <div className="space-y-2">
            <Label htmlFor="response-type">Response Type</Label>
            <Select
              value={localConfig.type}
              onValueChange={(value: any) => setLocalConfig({ ...localConfig, type: value })}
            >
              <SelectTrigger id="response-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw-output">Raw Output</SelectItem>
                <SelectItem value="llm-reprocess">LLM Reprocess</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {localConfig.type === 'raw-output'
                ? 'Pass the response through as-is to the user'
                : 'Send the response to an LLM for reformatting or processing'}
            </p>
          </div>

          {/* Reprocess Instructions (only for llm-reprocess) */}
          {localConfig.type === 'llm-reprocess' && (
            <div className="space-y-2">
              <Label htmlFor="reprocess-instructions">Reprocess Instructions</Label>
              <Textarea
                id="reprocess-instructions"
                value={localConfig.reprocessInstructions}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, reprocessInstructions: e.target.value })
                }
                placeholder="Enter instructions for the MCP to reprocess the response..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Describe how the LLM should transform or format the response
              </p>
            </div>
          )}

          {/* Error Handling */}
          <div className="space-y-2">
            <Label htmlFor="error-handling">Error Handling</Label>
            <Select
              value={localConfig.errorHandling}
              onValueChange={(value: any) =>
                setLocalConfig({ ...localConfig, errorHandling: value })
              }
            >
              <SelectTrigger id="error-handling">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pass-through">Pass Through</SelectItem>
                <SelectItem value="retry">Retry</SelectItem>
                <SelectItem value="fallback">Fallback</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Pass Through:</strong> Return error as-is to the user
              </p>
              <p>
                <strong>Retry:</strong> Automatically retry the operation
              </p>
              <p>
                <strong>Fallback:</strong> Use an alternative response or default value
              </p>
            </div>
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
            <Button type="button" onClick={handleSave} disabled={isSyncing}>
              {isSyncing ? 'Saving...' : 'Save Config'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

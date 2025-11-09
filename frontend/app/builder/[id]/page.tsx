'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMCPStore } from '@/store/mcpStore';
import { createNewMCP, loadMCPFromStorage, saveMCPToStorage } from '@/lib/mockStorage';
import { Save, Play, Rocket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import FlowCanvas from '@/components/builder/FlowCanvas';
import PropertiesPanel from '@/components/builder/PropertiesPanel';

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentMCP, setCurrentMCP, updateMCP } = useMCPStore();
  
  const [mcpName, setMcpName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id === 'new') {
      const newMCP = createNewMCP();
      setCurrentMCP(newMCP);
      setMcpName(newMCP.name);
      setIsLoading(false);
    } else {
      const loadedMCP = loadMCPFromStorage(params.id as string);
      if (loadedMCP) {
        setCurrentMCP(loadedMCP);
        setMcpName(loadedMCP.name);
      } else {
        toast({
          title: 'Error',
          description: 'MCP not found',
          variant: 'destructive',
        });
        router.push('/builder/new');
      }
      setIsLoading(false);
    }
  }, [params.id]);

  const handleSave = async () => {
    if (!currentMCP) return;
    
    setIsSaving(true);
    try {
      const updatedMCP = {
        ...currentMCP,
        name: mcpName,
        updatedAt: new Date().toISOString(),
      };
      
      // If this is a new MCP with temporary ID
      if (params.id === 'new') {
        const newId = Date.now().toString();
        updatedMCP.id = newId;
        saveMCPToStorage(updatedMCP);
        setCurrentMCP(updatedMCP);
        router.replace(`/builder/${newId}`);
      } else {
        saveMCPToStorage(updatedMCP);
        setCurrentMCP(updatedMCP);
      }
      
      toast({
        title: 'Success',
        description: 'MCP saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save MCP',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = () => {
    toast({
      title: 'Test Interface',
      description: 'Switch to the Test tab on the right panel',
    });
  };

  const handlePublish = () => {
    if (!currentMCP) return;
    
    updateMCP({ published: true });
    toast({
      title: 'Success',
      description: 'MCP published!',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading MCP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Input
            value={mcpName}
            onChange={(e) => setMcpName(e.target.value)}
            className="w-64 font-semibold"
            placeholder="MCP Name"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          
          <Button variant="outline" onClick={handleTest}>
            <Play className="h-4 w-4 mr-2" />
            Test
          </Button>
          
          <Button onClick={handlePublish}>
            <Rocket className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center Canvas with Blocks Palette */}
        <div className="flex-1 overflow-hidden">
          <FlowCanvas />
        </div>

        {/* Right Panel */}
        <div className="w-96 border-l overflow-y-auto bg-muted/30">
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
}

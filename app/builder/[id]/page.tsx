"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Save, Play, Upload } from "lucide-react";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { FlowCanvas } from "@/components/builder/FlowCanvas";
import { PropertiesPanel } from "@/components/builder/PropertiesPanel";
import { APIConfigModal } from "@/components/modals/APIConfigModal";
import { ToolConfigModal } from "@/components/modals/ToolConfigModal";
import { useMCPStore } from "@/store/mcpStore";
import { useToast } from "@/hooks/use-toast";
import { userMCPs } from "@/lib/mock-data";
import { MCPIntegration, APIConfig, MCPTool, MCPPrompt } from "@/types/mcp";

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentMCP, setCurrentMCP, addAPI, addTool, addPrompt } = useMCPStore();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [mcpName, setMcpName] = useState("");

  useEffect(() => {
    const mcpId = params.id as string;
    
    if (mcpId === "new") {
      // Create new MCP
      const newMCP: MCPIntegration = {
        id: `mcp-${Date.now()}`,
        name: "Untitled MCP",
        description: "A new MCP integration",
        version: "1.0.0",
        format: "mcp/1.0",
        author: "me",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        published: false,
        apis: [],
        tools: [],
        prompts: [],
        resources: [],
        configuration: {
          globalPrompt: "You are a helpful assistant.",
          model: "gpt-4",
          temperature: 0.7,
          maxTokens: 2000
        }
      };
      setCurrentMCP(newMCP);
      setMcpName(newMCP.name);
    } else {
      // Load existing MCP
      const existingMCP = userMCPs.find(m => m.id === mcpId);
      if (existingMCP) {
        setCurrentMCP(existingMCP);
        setMcpName(existingMCP.name);
      } else {
        toast({
          title: "MCP not found",
          description: "Redirecting to dashboard...",
          variant: "destructive"
        });
        router.push("/dashboard");
      }
    }
  }, [params.id, setCurrentMCP, router, toast]);

  const handleSaveAPI = (config: APIConfig) => {
    addAPI(config);
    toast({
      title: "API Saved",
      description: `${config.name} has been configured`
    });
  };

  const handleSaveTool = (tool: MCPTool) => {
    addTool(tool);
    toast({
      title: "Tool Created",
      description: `${tool.displayName} is ready to use`
    });
  };

  const handleAddPrompt = () => {
    const prompt: MCPPrompt = {
      id: `prompt-${Date.now()}`,
      type: "system",
      content: "New prompt content"
    };
    addPrompt(prompt);
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your MCP has been saved as a draft"
    });
  };

  const handleTest = () => {
    // Test tab is in PropertiesPanel
    toast({
      title: "Opening Test Interface",
      description: "Switch to the Test tab in the properties panel"
    });
  };

  const handlePublish = () => {
    toast({
      title: "Publishing MCP",
      description: "Your MCP is being published to the marketplace..."
    });
    setTimeout(() => {
      toast({
        title: "Published Successfully",
        description: "Your MCP is now available in the marketplace"
      });
    }, 1500);
  };

  if (!currentMCP) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        <Input
          value={mcpName}
          onChange={(e) => setMcpName(e.target.value)}
          className="max-w-md"
          placeholder="MCP Name"
        />

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={handleSaveDraft}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button variant="outline" size="sm" onClick={handleTest}>
          <Play className="h-4 w-4 mr-2" />
          Test
        </Button>
        <Button size="sm" onClick={handlePublish}>
          <Upload className="h-4 w-4 mr-2" />
          Publish
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {sidebarOpen && (
          <BuilderSidebar
            onAddAPI={() => setApiModalOpen(true)}
            onAddTool={() => setToolModalOpen(true)}
            onAddPrompt={handleAddPrompt}
            onAddResource={() => {}}
          />
        )}

        {/* Center Canvas */}
        <FlowCanvas />

        {/* Right Panel */}
        <PropertiesPanel />
      </div>

      {/* Modals */}
      <APIConfigModal
        open={apiModalOpen}
        onOpenChange={setApiModalOpen}
        onSave={handleSaveAPI}
      />
      <ToolConfigModal
        open={toolModalOpen}
        onOpenChange={setToolModalOpen}
        onSave={handleSaveTool}
      />
    </div>
  );
}

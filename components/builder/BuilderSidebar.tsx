"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Radio, Wrench, MessageSquare, FileText, Plus } from "lucide-react";
import { useMCPStore } from "@/store/mcpStore";
import { Badge } from "@/components/ui/badge";

interface BuilderSidebarProps {
  onAddAPI: () => void;
  onAddTool: () => void;
  onAddPrompt: () => void;
  onAddResource: () => void;
}

export function BuilderSidebar({ onAddAPI, onAddTool, onAddPrompt, onAddResource }: BuilderSidebarProps) {
  const { currentMCP, updateMCP } = useMCPStore();
  const [activeTab, setActiveTab] = useState("config");

  if (!currentMCP) return null;

  const tabs = [
    { id: "config", icon: Settings, label: "Config" },
    { id: "apis", icon: Radio, label: "APIs" },
    { id: "tools", icon: Wrench, label: "Tools" },
    { id: "prompts", icon: MessageSquare, label: "Prompts" },
    { id: "resources", icon: FileText, label: "Resources" },
  ];

  const handleConfigChange = (field: string, value: any) => {
    updateMCP({
      configuration: {
        ...currentMCP.configuration,
        [field]: value
      }
    });
  };

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-3 flex items-center justify-center border-r last:border-r-0 hover:bg-accent transition-colors ${
              activeTab === tab.id ? "bg-accent" : ""
            }`}
            title={tab.label}
          >
            <tab.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "config" && (
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">LLM Configuration</h3>
            
            <div>
              <Label>Model</Label>
              <Select
                value={currentMCP.configuration.model}
                onValueChange={(value) => handleConfigChange("model", value)}
              >
                <SelectTrigger>
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

            <div>
              <Label>Temperature: {currentMCP.configuration.temperature}</Label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={currentMCP.configuration.temperature}
                onChange={(e) => handleConfigChange("temperature", parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={currentMCP.configuration.maxTokens}
                onChange={(e) => handleConfigChange("maxTokens", parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label>System Prompt</Label>
              <Textarea
                rows={6}
                value={currentMCP.configuration.globalPrompt}
                onChange={(e) => handleConfigChange("globalPrompt", e.target.value)}
                placeholder="Define the LLM's role and behavior..."
              />
            </div>

            <Button className="w-full">Save Configuration</Button>
          </div>
        )}

        {activeTab === "apis" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">APIs ({currentMCP.apis.length})</h3>
              <Button size="sm" onClick={onAddAPI}>
                <Plus className="h-4 w-4 mr-1" />
                Add API
              </Button>
            </div>

            {currentMCP.apis.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No APIs configured yet.
                <br />Click "Add API" to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {currentMCP.apis.map(api => (
                  <div key={api.id} className="border rounded-md p-3 hover:bg-accent cursor-pointer">
                    <div className="font-medium">{api.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{api.baseUrl}</div>
                    <Badge 
                      className="mt-2 text-xs"
                      variant={api.status === 'connected' ? 'default' : api.status === 'error' ? 'destructive' : 'secondary'}
                    >
                      {api.status || 'No Key'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "tools" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Tools ({currentMCP.tools.length})</h3>
              <Button size="sm" onClick={onAddTool}>
                <Plus className="h-4 w-4 mr-1" />
                Create Tool
              </Button>
            </div>

            {currentMCP.tools.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No tools created yet.
                <br />Tools let the LLM call your APIs.
              </div>
            ) : (
              <div className="space-y-2">
                {currentMCP.tools.map(tool => (
                  <div key={tool.id} className="border rounded-md p-3 hover:bg-accent cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      <div className="font-medium">{tool.displayName}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{tool.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "prompts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Prompts ({currentMCP.prompts.length})</h3>
              <Button size="sm" onClick={onAddPrompt}>
                <Plus className="h-4 w-4 mr-1" />
                Add Prompt
              </Button>
            </div>

            {currentMCP.prompts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No prompts added yet.
              </div>
            ) : (
              <div className="space-y-2">
                {currentMCP.prompts.map(prompt => (
                  <div key={prompt.id} className="border rounded-md p-3">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {prompt.type}
                    </Badge>
                    <div className="text-sm">{prompt.content.substring(0, 100)}...</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "resources" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Resources ({currentMCP.resources.length})</h3>
              <Button size="sm" onClick={onAddResource}>
                <Plus className="h-4 w-4 mr-1" />
                Add Resource
              </Button>
            </div>

            <div className="text-center text-muted-foreground py-8 text-sm">
              Resources coming soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
